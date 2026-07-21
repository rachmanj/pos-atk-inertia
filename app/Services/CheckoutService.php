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
        $activeShift = $user->activeCashierShift;

        if (! $activeShift) {
            throw new DomainException('Buka shift kasir terlebih dahulu sebelum memproses transaksi.');
        }

        return DB::transaction(function () use ($user, $data) {
            $carts = Cart::query()
                ->with(['product.productUnits', 'product.components.componentProduct'])
                ->where('cashier_id', $user->id)
                ->where('is_held', false)
                ->orderBy('id')
                ->lockForUpdate()
                ->get();

            if ($carts->isEmpty()) {
                throw new DomainException('Keranjang masih kosong!');
            }

            $lines = $carts->map(fn (Cart $cart) => [
                'product_id' => $cart->product_id,
                'qty' => (int) $cart->qty,
                'price' => (int) $cart->price,
                'unit_id' => $cart->unit_id,
                'ppob_cost' => $cart->ppob_cost,
                'admin_fee' => $cart->admin_fee,
                'customer_ref' => $cart->customer_ref,
                'discount' => (int) ($cart->discount ?? 0),
                'discount_type' => $cart->discount_type ?? 'nominal',
            ])->all();

            $transaction = $this->checkoutFromLines($user, $lines, $data);

            Cart::query()
                ->whereIn('id', $carts->pluck('id'))
                ->delete();

            return $transaction;
        });
    }

    public function checkoutFromLines(User $user, array $lines, array $data): Transaction
    {
        $paymentMethod = $data['payment_method'];
        $discount = (int) ($data['discount'] ?? 0);
        $discountType = $data['discount_type'] ?? 'nominal';
        $activeShift = $user->activeCashierShift;

        if (! $activeShift) {
            throw new DomainException('Buka shift kasir terlebih dahulu sebelum memproses transaksi.');
        }

        if ($lines === []) {
            throw new DomainException('Keranjang masih kosong!');
        }

        return DB::transaction(function () use ($user, $data, $paymentMethod, $discount, $discountType, $activeShift, $lines) {
            $isImmediatePayment = in_array($paymentMethod, ['cash', 'qris', 'transfer'], true);

            $productIds = collect($lines)->pluck('product_id')->unique()->values()->all();

            $lineProducts = Product::query()
                ->with(['productUnits', 'components.componentProduct'])
                ->whereIn('id', $productIds)
                ->get()
                ->keyBy('id');

            $stockProductIds = collect($lines)
                ->flatMap(function (array $line) use ($lineProducts) {
                    $product = $lineProducts->get($line['product_id']);

                    if ($product?->isPhysical()) {
                        return [$product->id];
                    }

                    if ($product?->isService()) {
                        return $product->components->pluck('component_product_id');
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

            if ($lineProducts->contains(fn (Product $product) => $product->isPpob())) {
                $ppobAccount = PpobAccount::query()
                    ->where('is_active', true)
                    ->orderBy('id')
                    ->lockForUpdate()
                    ->first();

                if (! $ppobAccount) {
                    throw new DomainException('Akun PPOB aktif belum dikonfigurasi.');
                }
            }

            $subtotal = (int) collect($lines)->sum(fn (array $line) => $this->lineNet($line));

            // Order-level discount applies on top of line nets (after per-item discount)
            $discountAmount = $discount;
            if ($discountType === 'percent') {
                $discountAmount = (int) round($subtotal * $discount / 100);
            }

            if ($discountAmount > $subtotal) {
                throw new DomainException('Diskon tidak boleh melebihi subtotal belanja.');
            }

            $grandTotal = $subtotal - $discountAmount;
            $cash = in_array($paymentMethod, ['cash', 'qris', 'transfer']) ? (int) ($data['cash'] ?? 0) : 0;

            if (in_array($paymentMethod, ['cash', 'qris', 'transfer']) && $cash < $grandTotal) {
                throw new DomainException('Uang pembayaran kurang dari total belanja.');
            }

            $change = in_array($paymentMethod, ['cash', 'qris', 'transfer']) ? $cash - $grandTotal : 0;
            $invoice = $this->generateTransactionInvoice();

            $transaction = Transaction::create([
                'cashier_id' => $user->id,
                'customer_id' => $data['customer_id'] ?? null,
                'invoice' => $invoice,
                'cash' => $cash,
                'change' => $change,
                'discount' => $discountAmount,
                'grand_total' => $grandTotal,
                'payment_method' => $paymentMethod,
                'payment_channel' => match ($paymentMethod) {
                    'cash' => 'cash',
                    'qris' => 'qris',
                    'transfer' => 'transfer',
                    default => 'midtrans',
                },
                'payment_status' => $isImmediatePayment ? 'paid' : 'pending',
                'paid_at' => $isImmediatePayment ? now() : null,
                'status' => $isImmediatePayment ? 'completed' : 'pending',
                'note' => $data['note'] ?? null,
            ]);

            $totalBuyPrice = 0;

            foreach ($lines as $line) {
                $product = $lineProducts->get($line['product_id']);

                if (! $product) {
                    throw new DomainException('Produk pada keranjang tidak valid.');
                }

                $itemDiscount = $this->lineDiscountAmount($line);
                $itemSubtotal = $this->lineNet($line);
                $lineDiscountType = $itemDiscount > 0
                    ? ($line['discount_type'] ?? 'nominal')
                    : null;

                if ($product->isPpob()) {
                    $ppobCost = (int) ($line['ppob_cost'] ?? 0);
                    $adminFee = (int) ($line['admin_fee'] ?? 0);
                    $itemCost = $ppobCost * (int) $line['qty'];

                    TransactionDetail::create([
                        'transaction_id' => $transaction->id,
                        'product_id' => $line['product_id'],
                        'unit_id' => null,
                        'conversion_factor' => 1,
                        'qty' => $line['qty'],
                        'price' => $line['price'],
                        'buy_price' => $ppobCost,
                        'subtotal' => $itemSubtotal,
                        'customer_ref' => $line['customer_ref'] ?? null,
                        'ppob_cost' => $ppobCost,
                        'admin_fee' => $adminFee,
                        'discount_type' => $lineDiscountType,
                        'discount_amount' => $itemDiscount,
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
                    $productUnit = $product->productUnits->firstWhere('unit_id', $line['unit_id'])
                        ?? $product->productUnits->firstWhere('is_default_sell', true);

                    $conversionFactor = (float) ($productUnit?->conversion_factor ?? 1);
                    $recipeCostPerUnit = 0;
                    $itemCost = 0;

                    if ($product->components->isEmpty()) {
                        throw new DomainException('Resep bahan baku layanan ' . $product->title . ' belum dikonfigurasi.');
                    }

                    foreach ($product->components as $componentRow) {
                        $componentProduct = $products->get($componentRow->component_product_id);

                        if (! $componentProduct || ! $componentProduct->isPhysical()) {
                            throw new DomainException('Bahan baku layanan ' . $product->title . ' tidak valid.');
                        }

                        $qtyNeeded = (int) round((float) $componentRow->qty_per_unit * (int) $line['qty']);

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
                        'product_id' => $line['product_id'],
                        'unit_id' => $line['unit_id'],
                        'conversion_factor' => $conversionFactor,
                        'qty' => $line['qty'],
                        'price' => $line['price'],
                        'buy_price' => $recipeCostPerUnit,
                        'subtotal' => $itemSubtotal,
                        'discount_type' => $lineDiscountType,
                        'discount_amount' => $itemDiscount,
                    ]);

                    $totalBuyPrice += $itemCost;

                    continue;
                }

                $lockedProduct = $products->get($line['product_id']);

                if (! $lockedProduct) {
                    throw new DomainException('Produk fisik pada keranjang tidak valid.');
                }

                $productUnit = $lockedProduct->productUnits->firstWhere('unit_id', $line['unit_id'])
                    ?? $lockedProduct->productUnits->firstWhere('is_default_sell', true);

                $conversionFactor = (float) ($productUnit?->conversion_factor ?? 1);
                $qtyInBase = (int) round((int) $line['qty'] * $conversionFactor);

                if ($qtyInBase > (int) $lockedProduct->stock) {
                    throw new DomainException('Stok produk ' . $lockedProduct->title . ' tidak mencukupi.');
                }

                $stockBefore = (int) $lockedProduct->stock;
                $stockAfter = $stockBefore - $qtyInBase;
                $itemCost = (int) $lockedProduct->avg_cost * $qtyInBase;

                TransactionDetail::create([
                    'transaction_id' => $transaction->id,
                    'product_id' => $line['product_id'],
                    'unit_id' => $line['unit_id'],
                    'conversion_factor' => $conversionFactor,
                    'qty' => $line['qty'],
                    'price' => $line['price'],
                    'buy_price' => (int) $lockedProduct->avg_cost,
                    'subtotal' => $itemSubtotal,
                    'discount_type' => $lineDiscountType,
                    'discount_amount' => $itemDiscount,
                ]);

                $totalBuyPrice += $itemCost;

                StockMovement::create([
                    'product_id' => $line['product_id'],
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

            if ($isImmediatePayment) {
                Profit::create([
                    'transaction_id' => $transaction->id,
                    'total_revenue' => $grandTotal,
                    'total_cost' => $totalBuyPrice,
                    'profit_amount' => $grandTotal - $totalBuyPrice,
                ]);
            }

            return $transaction;
        });
    }

    public function void(User $user, string $invoice, ?string $voidReason = null): Transaction
    {
        return DB::transaction(function () use ($user, $invoice, $voidReason) {
            $transaction = Transaction::with(['details.product'])
                ->where('invoice', $invoice)
                ->when(! $user->isAdminUser(), function ($query) use ($user) {
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

                if (! $product) {
                    throw new DomainException('Produk pada transaksi tidak ditemukan.');
                }

                if (! $product->isPpob()) {
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

                if (! $lockedProduct) {
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
                'void_reason' => $voidReason,
                'voided_by' => $user->id,
                'voided_at' => now(),
            ]);

            return $transaction->fresh();
        });
    }

    protected function lineGross(array $line): int
    {
        return (int) $line['price'] * (int) $line['qty'];
    }

    protected function lineDiscountAmount(array $line): int
    {
        $gross = $this->lineGross($line);
        $value = (int) ($line['discount'] ?? 0);

        if ($value <= 0 || $gross <= 0) {
            return 0;
        }

        $amount = ($line['discount_type'] ?? 'nominal') === 'percent'
            ? (int) round($gross * $value / 100)
            : $value;

        return min($amount, $gross);
    }

    protected function lineNet(array $line): int
    {
        return $this->lineGross($line) - $this->lineDiscountAmount($line);
    }

    protected function generateTransactionInvoice(): string
    {
        do {
            $invoice = 'TRX-' . now()->format('Ymd') . '-' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 6));
        } while (Transaction::where('invoice', $invoice)->exists());

        return $invoice;
    }
}
