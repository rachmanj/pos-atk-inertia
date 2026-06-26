<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\PpobAccount;
use App\Models\Product;
use App\Models\Profit;
use App\Models\StockMovement;
use App\Models\Transaction;
use App\Models\TransactionDetail;
use App\Models\User;
use DomainException;
use Illuminate\Support\Facades\DB;

class CheckoutService
{
    public function __construct(
        protected PpobBalanceService $ppobBalanceService,
    ) {}

    public function checkout(User $user, array $data): Transaction
    {
        $paymentMethod = $data['payment_method'];
        $discount = (int) ($data['discount'] ?? 0);
        $activeShift = $user->activeCashierShift;

        if (!$activeShift) {
            throw new DomainException('Buka shift kasir terlebih dahulu sebelum memproses transaksi.');
        }

        return DB::transaction(function () use ($user, $data, $paymentMethod, $discount, $activeShift) {
            $carts = Cart::query()
                ->with(['product.productUnits', 'product.components.componentProduct'])
                ->where('cashier_id', $user->id)
                ->orderBy('id')
                ->lockForUpdate()
                ->get();

            if ($carts->isEmpty()) {
                throw new DomainException('Keranjang masih kosong!');
            }

            $stockProductIds = $carts
                ->flatMap(function ($cart) {
                    if ($cart->product?->isPhysical()) {
                        return [$cart->product_id];
                    }

                    if ($cart->product?->isService()) {
                        return $cart->product->components->pluck('component_product_id');
                    }

                    return [];
                })
                ->unique()
                ->values()
                ->all();

            $products = Product::query()
                ->with(['productUnits', 'components.componentProduct'])
                ->whereIn('id', $stockProductIds)
                ->orderBy('id')
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            $ppobAccount = null;

            if ($carts->contains(fn ($cart) => $cart->product?->isPpob())) {
                $ppobAccount = PpobAccount::query()
                    ->where('is_active', true)
                    ->orderBy('id')
                    ->lockForUpdate()
                    ->first();

                if (!$ppobAccount) {
                    throw new DomainException('Akun PPOB aktif belum dikonfigurasi.');
                }
            }

            $subtotal = (int) $carts->sum(fn ($cart) => (int) $cart->price * (int) $cart->qty);

            if ($discount > $subtotal) {
                throw new DomainException('Diskon tidak boleh melebihi subtotal belanja.');
            }

            $grandTotal = $subtotal - $discount;
            $cash = $paymentMethod === 'cash' ? (int) ($data['cash'] ?? 0) : 0;

            if ($paymentMethod === 'cash' && $cash < $grandTotal) {
                throw new DomainException('Uang pembayaran kurang dari total belanja.');
            }

            $change = $paymentMethod === 'cash' ? $cash - $grandTotal : 0;
            $invoice = $this->generateTransactionInvoice();

            $transaction = Transaction::create([
                'cashier_id' => $user->id,
                'customer_id' => $data['customer_id'] ?? null,
                'invoice' => $invoice,
                'cash' => $cash,
                'change' => $change,
                'discount' => $discount,
                'grand_total' => $grandTotal,
                'payment_method' => $paymentMethod,
                'payment_channel' => $paymentMethod === 'cash' ? 'cash' : 'midtrans',
                'payment_status' => $paymentMethod === 'cash' ? 'paid' : 'pending',
                'paid_at' => $paymentMethod === 'cash' ? now() : null,
                'status' => $paymentMethod === 'cash' ? 'completed' : 'pending',
                'note' => $data['note'] ?? null,
            ]);

            $totalBuyPrice = 0;

            foreach ($carts as $cart) {
                $product = $cart->product;

                if (!$product) {
                    throw new DomainException('Produk pada keranjang tidak valid.');
                }

                if ($product->isPpob()) {
                    $ppobCost = (int) $cart->ppob_cost;
                    $adminFee = (int) $cart->admin_fee;
                    $itemSubtotal = (int) $cart->price * (int) $cart->qty;
                    $itemCost = $ppobCost * (int) $cart->qty;

                    TransactionDetail::create([
                        'transaction_id' => $transaction->id,
                        'product_id' => $cart->product_id,
                        'unit_id' => null,
                        'conversion_factor' => 1,
                        'qty' => $cart->qty,
                        'price' => $cart->price,
                        'buy_price' => $ppobCost,
                        'subtotal' => $itemSubtotal,
                        'customer_ref' => $cart->customer_ref,
                        'ppob_cost' => $ppobCost,
                        'admin_fee' => $adminFee,
                    ]);

                    $totalBuyPrice += $itemCost;

                    $this->ppobBalanceService->recordMovement(
                        account: $ppobAccount,
                        userId: $user->id,
                        type: 'sale',
                        amount: -$itemCost,
                        cashierShiftId: $activeShift->id,
                        referenceType: Transaction::class,
                        referenceId: $transaction->id,
                        note: 'Penjualan PPOB Invoice: ' . $invoice,
                    );

                    continue;
                }

                if ($product->isService()) {
                    $productUnit = $product->productUnits->firstWhere('unit_id', $cart->unit_id)
                        ?? $product->productUnits->firstWhere('is_default_sell', true);

                    $conversionFactor = (float) ($productUnit?->conversion_factor ?? 1);
                    $itemSubtotal = (int) $cart->price * (int) $cart->qty;
                    $recipeCostPerUnit = 0;
                    $itemCost = 0;

                    if ($product->components->isEmpty()) {
                        throw new DomainException('Resep bahan baku layanan ' . $product->title . ' belum dikonfigurasi.');
                    }

                    foreach ($product->components as $componentRow) {
                        $componentProduct = $products->get($componentRow->component_product_id);

                        if (!$componentProduct || !$componentProduct->isPhysical()) {
                            throw new DomainException('Bahan baku layanan ' . $product->title . ' tidak valid.');
                        }

                        $qtyNeeded = (int) round((float) $componentRow->qty_per_unit * (int) $cart->qty);

                        if ($qtyNeeded > (int) $componentProduct->stock) {
                            throw new DomainException('Stok bahan ' . $componentProduct->title . ' tidak mencukupi.');
                        }

                        $componentCost = (int) $componentProduct->avg_cost * $qtyNeeded;
                        $itemCost += $componentCost;
                        $recipeCostPerUnit += (int) round((int) $componentProduct->avg_cost * (float) $componentRow->qty_per_unit);

                        $stockBefore = (int) $componentProduct->stock;
                        $stockAfter = $stockBefore - $qtyNeeded;

                        StockMovement::create([
                            'product_id' => $componentProduct->id,
                            'user_id' => $user->id,
                            'type' => 'out',
                            'qty' => $qtyNeeded,
                            'stock_before' => $stockBefore,
                            'stock_after' => $stockAfter,
                            'reference_type' => Transaction::class,
                            'reference_id' => $transaction->id,
                            'note' => 'Penjualan layanan ' . $product->title . ' Invoice: ' . $invoice,
                        ]);

                        $componentProduct->update([
                            'stock' => $stockAfter,
                        ]);

                        $products->put($componentProduct->id, $componentProduct->fresh());
                    }

                    TransactionDetail::create([
                        'transaction_id' => $transaction->id,
                        'product_id' => $cart->product_id,
                        'unit_id' => $cart->unit_id,
                        'conversion_factor' => $conversionFactor,
                        'qty' => $cart->qty,
                        'price' => $cart->price,
                        'buy_price' => $recipeCostPerUnit,
                        'subtotal' => $itemSubtotal,
                    ]);

                    $totalBuyPrice += $itemCost;

                    continue;
                }

                $lockedProduct = $products->get($cart->product_id);

                if (!$lockedProduct) {
                    throw new DomainException('Produk fisik pada keranjang tidak valid.');
                }

                $productUnit = $lockedProduct->productUnits->firstWhere('unit_id', $cart->unit_id)
                    ?? $lockedProduct->productUnits->firstWhere('is_default_sell', true);

                $conversionFactor = (float) ($productUnit?->conversion_factor ?? 1);
                $qtyInBase = (int) round((int) $cart->qty * $conversionFactor);

                if ($qtyInBase > (int) $lockedProduct->stock) {
                    throw new DomainException('Stok produk ' . $lockedProduct->title . ' tidak mencukupi.');
                }

                $stockBefore = (int) $lockedProduct->stock;
                $stockAfter = $stockBefore - $qtyInBase;
                $itemSubtotal = (int) $cart->price * (int) $cart->qty;
                $itemCost = (int) $lockedProduct->avg_cost * $qtyInBase;

                TransactionDetail::create([
                    'transaction_id' => $transaction->id,
                    'product_id' => $cart->product_id,
                    'unit_id' => $cart->unit_id,
                    'conversion_factor' => $conversionFactor,
                    'qty' => $cart->qty,
                    'price' => $cart->price,
                    'buy_price' => (int) $lockedProduct->avg_cost,
                    'subtotal' => $itemSubtotal,
                ]);

                $totalBuyPrice += $itemCost;

                StockMovement::create([
                    'product_id' => $cart->product_id,
                    'user_id' => $user->id,
                    'type' => 'out',
                    'qty' => $qtyInBase,
                    'stock_before' => $stockBefore,
                    'stock_after' => $stockAfter,
                    'reference_type' => Transaction::class,
                    'reference_id' => $transaction->id,
                    'note' => 'Penjualan Invoice: ' . $invoice,
                ]);

                $lockedProduct->update([
                    'stock' => $stockAfter,
                ]);
            }

            if ($paymentMethod === 'cash') {
                Profit::create([
                    'transaction_id' => $transaction->id,
                    'total_revenue' => $grandTotal,
                    'total_cost' => $totalBuyPrice,
                    'profit_amount' => $grandTotal - $totalBuyPrice,
                ]);
            }

            Cart::whereIn('id', $carts->pluck('id'))->delete();

            return $transaction;
        });
    }

    public function void(User $user, string $invoice): Transaction
    {
        return DB::transaction(function () use ($user, $invoice) {
            $transaction = Transaction::with(['details.product'])
                ->where('invoice', $invoice)
                ->when(!$user->isAdminUser(), function ($query) use ($user) {
                    $query->where('cashier_id', $user->id);
                })
                ->lockForUpdate()
                ->firstOrFail();

            if ($transaction->status === 'voided') {
                throw new DomainException('Transaksi sudah dibatalkan sebelumnya.');
            }

            if ($transaction->status !== 'completed' || $transaction->payment_status !== 'paid') {
                throw new DomainException('Hanya transaksi selesai dan lunas yang bisa di-void.');
            }

            $hasBlockingReturn = $transaction->returnTransactions()
                ->whereIn('status', ['pending', 'approved'])
                ->exists();

            if ($hasBlockingReturn) {
                throw new DomainException('Transaksi yang sudah memiliki retur tidak dapat di-void.');
            }

            if ($transaction->details->isEmpty()) {
                throw new DomainException('Detail transaksi tidak ditemukan.');
            }

            $ppobAccount = PpobAccount::activeAccount();

            foreach ($transaction->details as $detail) {
                $product = $detail->product;

                if (!$product) {
                    throw new DomainException('Produk pada transaksi tidak ditemukan.');
                }

                if (!$product->isPpob()) {
                    continue;
                }

                if ($ppobAccount) {
                    $refundAmount = (int) $detail->ppob_cost * (int) $detail->qty;

                    $this->ppobBalanceService->recordMovement(
                        account: $ppobAccount,
                        userId: $user->id,
                        type: 'adjustment',
                        amount: $refundAmount,
                        referenceType: Transaction::class,
                        referenceId: $transaction->id,
                        note: 'Void PPOB Invoice: ' . $transaction->invoice,
                    );
                }
            }

            $outMovements = StockMovement::query()
                ->where('reference_type', Transaction::class)
                ->where('reference_id', $transaction->id)
                ->where('type', 'out')
                ->orderBy('id')
                ->lockForUpdate()
                ->get();

            foreach ($outMovements as $movement) {
                $lockedProduct = Product::query()
                    ->whereKey($movement->product_id)
                    ->lockForUpdate()
                    ->first();

                if (!$lockedProduct) {
                    throw new DomainException('Produk pada transaksi tidak ditemukan.');
                }

                $stockBefore = (int) $lockedProduct->stock;
                $stockAfter = $stockBefore + (int) $movement->qty;

                StockMovement::create([
                    'product_id' => $lockedProduct->id,
                    'user_id' => $user->id,
                    'type' => 'in',
                    'qty' => (int) $movement->qty,
                    'stock_before' => $stockBefore,
                    'stock_after' => $stockAfter,
                    'reference_type' => Transaction::class,
                    'reference_id' => $transaction->id,
                    'note' => 'Void Transaksi Invoice: ' . $transaction->invoice,
                ]);

                $lockedProduct->update([
                    'stock' => $stockAfter,
                ]);
            }

            Profit::updateOrCreate(
                [
                    'transaction_id' => $transaction->id,
                ],
                [
                    'total_revenue' => 0,
                    'total_cost' => 0,
                    'profit_amount' => 0,
                ],
            );

            $transaction->update([
                'status' => 'voided',
                'voided_by' => $user->id,
                'voided_at' => now(),
            ]);

            return $transaction->fresh();
        });
    }

    protected function generateTransactionInvoice(): string
    {
        do {
            $invoice = 'TRX-' . now()->format('Ymd') . '-' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 6));
        } while (Transaction::where('invoice', $invoice)->exists());

        return $invoice;
    }
}
