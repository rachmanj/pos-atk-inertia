<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ReturnDetail;
use App\Models\ReturnTransaction;
use App\Models\StockMovement;
use App\Models\Transaction;
use DomainException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class ReturnTransactionController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'q' => 'nullable|string|max:100',
            'status' => 'nullable|in:pending,approved,rejected',
        ]);

        $search = trim((string) $request->q);

        $returns = ReturnTransaction::query()
            ->with(['transaction:id,invoice', 'cashier:id,name'])
            ->withSum('details as total_qty', 'qty')
            ->when(!$user->isAdminUser(), function ($query) use ($user) {
                $query->where('cashier_id', $user->id);
            })
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('invoice', 'like', '%' . $search . '%')
                        ->orWhereHas('transaction', function ($query) use ($search) {
                            $query->where('invoice', 'like', '%' . $search . '%');
                        })
                        ->orWhereHas('cashier', function ($query) use ($search) {
                            $query->where('name', 'like', '%' . $search . '%');
                        });
                });
            })
            ->when(filled($request->status), function ($query) use ($request) {
                $query->where('status', $request->status);
            })
            ->latest('id')
            ->paginate(10);

        $returns->appends([
            'q' => $search,
            'status' => $request->status,
        ]);

        return Inertia::render('Account/Returns/Index', [
            'returns' => $returns,
            'filters' => [
                'q' => $search,
                'status' => $request->status ?? '',
            ],
        ]);
    }

    public function create(Request $request, string $invoice)
    {
        $user = $request->user();

        $transaction = Transaction::with([
            'cashier',
            'customer',
            'details.product',
            'activeReturn',
        ])
            ->where('invoice', $invoice)
            ->when(!$user->isAdminUser(), function ($query) use ($user) {
                $query->where('cashier_id', $user->id);
            })
            ->firstOrFail();

        if ($transaction->status !== 'completed') {
            return redirect()
                ->route('account.transactions.show', $transaction->invoice)
                ->with('error', 'Retur hanya bisa dibuat dari transaksi yang sudah selesai.');
        }

        if ($transaction->payment_status !== 'paid') {
            return redirect()
                ->route('account.transactions.show', $transaction->invoice)
                ->with('error', 'Retur hanya bisa dibuat dari transaksi yang sudah lunas.');
        }

        if ($transaction->isVoided()) {
            return redirect()
                ->route('account.transactions.show', $transaction->invoice)
                ->with('error', 'Transaksi yang sudah di-void tidak dapat diretur.');
        }

        if ($transaction->activeReturn) {
            return redirect()
                ->route('account.returns.show', $transaction->activeReturn->invoice)
                ->with('error', 'Transaksi ini masih memiliki retur yang menunggu proses.');
        }

        $reservedQty = $this->getReservedQtyByProduct($transaction->id);

        $returnableItems = $transaction->details->map(function ($detail) use ($reservedQty) {
            $reserved = (int) ($reservedQty[$detail->product_id] ?? 0);
            $remaining = max(0, (int) $detail->qty - $reserved);

            return [
                'product_id' => $detail->product_id,
                'product_title' => $detail->product?->title,
                'product_image' => $detail->product?->image,
                'purchased_qty' => $detail->qty,
                'returned_qty' => $reserved,
                'remaining_qty' => $remaining,
                'price' => $detail->price,
                'subtotal' => $detail->subtotal,
            ];
        });

        if ($returnableItems->every(fn($item) => $item['remaining_qty'] === 0)) {
            return redirect()
                ->route('account.transactions.show', $transaction->invoice)
                ->with('error', 'Semua item pada transaksi ini sudah pernah diajukan retur.');
        }

        return Inertia::render('Account/Returns/Create', [
            'transaction' => $transaction,
            'returnableItems' => $returnableItems,
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'transaction_id' => 'required|integer|exists:transactions,id',
            'reason' => 'required|in:defect,wrong_item,customer_request,other',
            'note' => 'nullable|string|max:1000',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|integer|distinct|exists:products,id',
            'items.*.qty' => 'nullable|integer|min:0',
            'items.*.restock' => 'nullable|boolean',
        ]);

        $selectedItems = collect($request->items)
            ->map(function ($item) {
                return [
                    'product_id' => (int) $item['product_id'],
                    'qty' => (int) ($item['qty'] ?? 0),
                    'restock' => filter_var($item['restock'] ?? true, FILTER_VALIDATE_BOOLEAN),
                ];
            })
            ->filter(fn($item) => $item['qty'] > 0)
            ->values();

        if ($selectedItems->isEmpty()) {
            throw ValidationException::withMessages([
                'items' => 'Pilih minimal satu item dengan qty retur lebih dari 0.',
            ]);
        }

        $blockedReturnInvoice = null;
        $transactionInvoice = null;

        try {
            $returnTransaction = DB::transaction(function () use ($request, $user, $selectedItems, &$blockedReturnInvoice, &$transactionInvoice) {
                $transaction = Transaction::with(['details.product', 'profit', 'activeReturn'])
                    ->when(!$user->isAdminUser(), function ($query) use ($user) {
                        $query->where('cashier_id', $user->id);
                    })
                    ->whereKey($request->transaction_id)
                    ->lockForUpdate()
                    ->firstOrFail();

                $transactionInvoice = $transaction->invoice;

                if ($transaction->status !== 'completed') {
                    throw new DomainException('Retur hanya bisa dibuat dari transaksi yang sudah selesai.');
                }

                if ($transaction->payment_status !== 'paid') {
                    throw new DomainException('Retur hanya bisa dibuat dari transaksi yang sudah lunas.');
                }

                if ($transaction->isVoided()) {
                    throw new DomainException('Transaksi yang sudah di-void tidak dapat diretur.');
                }

                if ($transaction->activeReturn) {
                    $blockedReturnInvoice = $transaction->activeReturn->invoice;

                    throw new DomainException('Transaksi ini masih memiliki retur yang menunggu proses.');
                }

                $detailMap = $transaction->details->keyBy('product_id');
                $reservedQty = $this->getReservedQtyByProduct($transaction->id);
                $refundMethod = $transaction->payment_method === 'cash' ? 'cash' : 'original';
                $preparedItems = [];
                $rawSelectedTotal = 0;

                foreach ($selectedItems as $item) {
                    $detail = $detailMap->get($item['product_id']);

                    if (!$detail) {
                        throw ValidationException::withMessages([
                            'items' => 'Terdapat item retur yang tidak sesuai dengan transaksi.',
                        ]);
                    }

                    $remainingQty = max(0, (int) $detail->qty - (int) ($reservedQty[$item['product_id']] ?? 0));

                    if ($item['qty'] > $remainingQty) {
                        throw ValidationException::withMessages([
                            'items' => 'Qty retur melebihi jumlah item yang masih bisa diretur.',
                        ]);
                    }

                    $rawSubtotal = (int) $detail->price * (int) $item['qty'];
                    $rawSelectedTotal += $rawSubtotal;

                    $preparedItems[] = [
                        'product_id' => $detail->product_id,
                        'unit_id' => $detail->unit_id,
                        'conversion_factor' => $detail->conversion_factor,
                        'qty' => $item['qty'],
                        'restock' => $item['restock'],
                        'sale_price' => $detail->price,
                        'buy_price' => $detail->buy_price,
                        'raw_subtotal' => $rawSubtotal,
                        'is_ppob' => $detail->product?->isPpob() ?? false,
                    ];
                }

                $totalRefund = $this->calculateRefundTarget($transaction, $rawSelectedTotal);
                $allocatedRefund = 0;

                foreach ($preparedItems as $index => $item) {
                    if ($index === array_key_last($preparedItems)) {
                        $refundSubtotal = max(0, $totalRefund - $allocatedRefund);
                    } else {
                        $refundSubtotal = $this->calculateRefundTarget($transaction, $item['raw_subtotal']);
                        $allocatedRefund += $refundSubtotal;
                    }

                    $preparedItems[$index]['refund_subtotal'] = $refundSubtotal;
                }

                $returnTransaction = ReturnTransaction::create([
                    'transaction_id' => $transaction->id,
                    'cashier_id' => $user->id,
                    'invoice' => $this->generateReturnInvoice(),
                    'reason' => $request->reason,
                    'note' => filled($request->note) ? trim($request->note) : null,
                    'total_refund' => collect($preparedItems)->sum('refund_subtotal'),
                    'refund_method' => $refundMethod,
                    'status' => 'pending',
                ]);

                foreach ($preparedItems as $item) {
                    ReturnDetail::create([
                        'return_transaction_id' => $returnTransaction->id,
                        'product_id' => $item['product_id'],
                        'unit_id' => $item['unit_id'],
                        'conversion_factor' => $item['conversion_factor'] ?? 1,
                        'qty' => $item['qty'],
                        'price' => $item['sale_price'],
                        'subtotal' => $item['refund_subtotal'],
                        'restock' => $item['is_ppob'] ? false : $item['restock'],
                    ]);
                }

                return $returnTransaction;
            });
        } catch (DomainException $exception) {
            if ($blockedReturnInvoice) {
                return redirect()
                    ->route('account.returns.show', $blockedReturnInvoice)
                    ->with('error', $exception->getMessage());
            }

            if ($transactionInvoice) {
                return redirect()
                    ->route('account.transactions.show', $transactionInvoice)
                    ->with('error', $exception->getMessage());
            }

            return back()->with('error', $exception->getMessage());
        }

        return redirect()
            ->route('account.returns.show', $returnTransaction->invoice)
            ->with('success', 'Pengajuan retur berhasil dibuat dan menunggu persetujuan.');
    }

    public function show(Request $request, string $invoice)
    {
        $user = $request->user();

        $return = ReturnTransaction::with([
            'transaction:id,invoice,payment_method,payment_channel,grand_total,discount,payment_status,status,created_at,paid_at,customer_id,cashier_id',
            'transaction.customer:id,name',
            'transaction.cashier:id,name',
            'cashier:id,name',
            'details.product',
        ])
            ->where('invoice', $invoice)
            ->when(!$user->isAdminUser(), function ($query) use ($user) {
                $query->where('cashier_id', $user->id);
            })
            ->firstOrFail();

        return Inertia::render('Account/Returns/Show', [
            'return' => $return,
        ]);
    }

    public function update(Request $request, $id)
    {
        abort_unless($request->user()->can('returns.approve'), 403);

        $request->validate([
            'status' => 'required|in:approved,rejected',
        ]);

        $returnInvoice = null;

        try {
            DB::transaction(function () use ($request, $id, &$returnInvoice) {
                $return = ReturnTransaction::query()
                    ->whereKey($id)
                    ->lockForUpdate()
                    ->firstOrFail();

                $returnInvoice = $return->invoice;

                if ($return->status !== 'pending') {
                    throw new DomainException('Retur ini sudah diproses sebelumnya.');
                }

                $return->load('details');

                $transaction = Transaction::query()
                    ->whereKey($return->transaction_id)
                    ->lockForUpdate()
                    ->firstOrFail();

                $transaction->load('details');

                if ($request->status === 'approved') {
                    if (
                        $transaction->status !== 'completed' ||
                        $transaction->payment_status !== 'paid' ||
                        $transaction->isVoided()
                    ) {
                        throw new DomainException('Transaksi asal sudah tidak valid untuk diproses retur.');
                    }

                    $buyPriceMap = $transaction->details->keyBy('product_id');
                    $totalCostReduction = 0;

                    $restockDetails = $return->details
                        ->where('restock', true)
                        ->values();

                    $lockedProducts = $restockDetails->isEmpty()
                        ? collect()
                        : Product::query()
                        ->whereIn('id', $restockDetails->pluck('product_id')->unique()->values()->all())
                        ->orderBy('id')
                        ->lockForUpdate()
                        ->get()
                        ->keyBy('id');

                    foreach ($restockDetails as $detail) {
                        $product = $lockedProducts->get($detail->product_id);

                        if (!$product || $product->isPpob()) {
                            continue;
                        }

                        $qtyInBase = $detail->qtyInBaseUnits();
                        $stockBefore = (int) $product->stock;
                        $stockAfter = $stockBefore + $qtyInBase;

                        $product->update([
                            'stock' => $stockAfter,
                        ]);

                        StockMovement::create([
                            'product_id' => $detail->product_id,
                            'user_id' => $request->user()->id,
                            'type' => 'in',
                            'qty' => $qtyInBase,
                            'stock_before' => $stockBefore,
                            'stock_after' => $stockAfter,
                            'reference_type' => ReturnTransaction::class,
                            'reference_id' => $return->id,
                            'note' => 'Retur Penjualan Invoice: ' . $return->invoice,
                        ]);

                        $buyPrice = (int) optional($buyPriceMap->get($detail->product_id))->buy_price;
                        $totalCostReduction += $buyPrice * $qtyInBase;
                    }

                    $profit = $transaction->profit()
                        ->lockForUpdate()
                        ->first();

                    if ($profit) {
                        $updatedRevenue = max(0, (int) $profit->total_revenue - (int) $return->total_refund);
                        $updatedCost = max(0, (int) $profit->total_cost - $totalCostReduction);

                        $profit->update([
                            'total_revenue' => $updatedRevenue,
                            'total_cost' => $updatedCost,
                            'profit_amount' => $updatedRevenue - $updatedCost,
                        ]);
                    }
                }

                $return->update([
                    'status' => $request->status,
                ]);
            });
        } catch (DomainException $exception) {
            return redirect()
                ->route('account.returns.show', $returnInvoice)
                ->with('error', $exception->getMessage());
        }

        return redirect()
            ->route('account.returns.show', $returnInvoice)
            ->with('success', $request->status === 'approved'
                ? 'Retur berhasil disetujui.'
                : 'Retur berhasil ditolak.');
    }

    protected function getReservedQtyByProduct(int $transactionId)
    {
        return ReturnDetail::query()
            ->selectRaw('return_details.product_id as product_id, COALESCE(SUM(return_details.qty), 0) as total_qty')
            ->join('return_transactions', 'return_transactions.id', '=', 'return_details.return_transaction_id')
            ->where('return_transactions.transaction_id', $transactionId)
            ->whereIn('return_transactions.status', ['pending', 'approved'])
            ->groupBy('return_details.product_id')
            ->pluck('total_qty', 'product_id');
    }

    protected function calculateRefundTarget(Transaction $transaction, int $rawSubtotal): int
    {
        $grossTotal = (int) $transaction->details->sum('subtotal');

        if ($transaction->discount <= 0 || $grossTotal <= 0) {
            return $rawSubtotal;
        }

        $discountShare = (int) round($transaction->discount * ($rawSubtotal / $grossTotal));

        return max(0, $rawSubtotal - $discountShare);
    }

    protected function generateReturnInvoice(): string
    {
        do {
            $invoice = 'RET-' . now()->format('Ymd') . '-' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 6));
        } while (ReturnTransaction::where('invoice', $invoice)->exists());

        return $invoice;
    }
}
