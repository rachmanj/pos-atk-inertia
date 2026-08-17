<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTransactionRequest;
use App\Models\Cart;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Product;
use App\Models\PpobAccount;
use App\Models\Profit;
use App\Models\Setting;
use App\Models\Transaction;
use App\Models\TransactionDetail;
use App\Services\CheckoutService;
use DomainException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Midtrans\Config as MidtransConfig;
use Midtrans\Snap;

class TransactionController extends Controller
{
    public function __construct(
        protected CheckoutService $checkoutService,
    ) {}

    public function create(Request $request)
    {
        if (!$request->user()->activeCashierShift) {
            return redirect()
                ->route('account.cashier-shifts.create')
                ->with('error', 'Buka shift kasir terlebih dahulu sebelum masuk ke POS.');
        }

        $categories = Category::all();

        $products = Product::with(['category', 'productUnits.unit', 'defaultSellUnit.unit', 'components.componentProduct'])
            ->where('is_active', true)
            ->when($request->q, function ($query) use ($request) {
                $query->where(function ($q) use ($request) {
                    $q->where('title', 'like', '%' . $request->q . '%')
                        ->orWhere('barcode', 'like', '%' . $request->q . '%');
                });
            })
            ->when($request->category_id, function ($query) use ($request) {
                $query->where('category_id', $request->category_id);
            })
            ->latest()
            ->paginate(12);

        $products->appends([
            'q' => $request->q,
            'category_id' => $request->category_id,
        ]);

        $carts = Cart::with(['product', 'unit'])
            ->where('cashier_id', $request->user()->id)
            ->latest()
            ->get();

        $ppobAccount = PpobAccount::activeAccount();

        return Inertia::render('Account/Transactions/Create', [
            'categories' => $categories,
            'products' => $products,
            'carts' => $carts,
            'ppobSettings' => Setting::ppobSettings(),
            'ppobAccount' => $ppobAccount ? [
                'id' => $ppobAccount->id,
                'name' => $ppobAccount->name,
                'current_balance' => $ppobAccount->current_balance,
                'min_balance_alert' => $ppobAccount->min_balance_alert,
                'is_low_balance' => $ppobAccount->isLowBalance(),
            ] : null,
        ]);
    }

    public function store(StoreTransactionRequest $request)
    {
        $user = $request->user();

        if (!$user->activeCashierShift) {
            return response()->json([
                'success' => false,
                'message' => 'Buka shift kasir terlebih dahulu sebelum memproses transaksi.',
            ], 422);
        }

        $validated = $request->validated();
        $paymentMethod = $validated['payment_method'];

        try {
            $transaction = $this->checkoutService->checkout($user, $validated);

            $snapToken = null;

            if ($transaction->payment_method === 'digital') {
                $snapToken = $this->createMidtransSnapToken($transaction);

                $transaction->update([
                    'snap_token' => $snapToken,
                ]);
            }

            return response()->json([
                'success' => true,
                'invoice' => $transaction->invoice,
                'payment_method' => $transaction->payment_method,
                'payment_status' => $transaction->payment_status,
                'snap_token' => $snapToken,
            ]);
        } catch (DomainException $exception) {
            return response()->json([
                'success' => false,
                'message' => $exception->getMessage(),
            ], 422);
        } catch (\Exception $exception) {
            Log::error('Checkout failed', [
                'cashier_id' => $user->id,
                'payment_method' => $paymentMethod ?? null,
                'exception' => $exception,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan sistem.',
            ], 500);
        }
    }

    public function show(Request $request, $invoice)
    {
        $user = $request->user();

        $transaction = Transaction::with([
            'cashier',
            'customer',
            'details.product',
            'details.unit',
            'activeReturn',
        ])
            ->withCount([
                'returnTransactions as blocking_returns_count' => function ($query) {
                    $query->whereIn('status', ['pending', 'approved']);
                },
            ])
            ->where('invoice', $invoice)
            ->when(!$user->isAdminUser(), function ($query) use ($user) {
                $query->where('cashier_id', $user->id);
            })
            ->firstOrFail();

        return Inertia::render('Account/Transactions/Show', [
            'transaction' => $transaction,
            'store' => Setting::storeSettings(),
        ]);
    }

    public function confirmTransfer(Request $request, string $invoice)
    {
        $user = $request->user();

        $transaction = Transaction::with('details')
            ->where('invoice', $invoice)
            ->when(! $user->isAdminUser(), function ($query) use ($user) {
                $query->where('cashier_id', $user->id);
            })
            ->firstOrFail();

        if ($transaction->payment_method !== 'transfer') {
            return redirect()
                ->route('account.transactions.show', $invoice)
                ->with('error', 'Konfirmasi hanya untuk transaksi transfer manual.');
        }

        if ($transaction->payment_status !== 'pending') {
            return redirect()
                ->route('account.transactions.show', $invoice)
                ->with('error', 'Transaksi transfer ini sudah dikonfirmasi atau tidak dalam status pending.');
        }

        DB::transaction(function () use ($transaction) {
            $transaction->update([
                'payment_status' => 'paid',
                'status' => 'completed',
                'paid_at' => now(),
            ]);

            $totalCost = $transaction->details->sum(function ($detail) {
                if ($detail->ppob_cost !== null) {
                    return (int) $detail->ppob_cost * (int) $detail->qty;
                }

                return (int) $detail->buy_price * $detail->qtyInBaseUnits();
            });

            Profit::updateOrCreate(
                [
                    'transaction_id' => $transaction->id,
                ],
                [
                    'total_revenue' => (int) $transaction->grand_total,
                    'total_cost' => (int) $totalCost,
                    'profit_amount' => (int) $transaction->grand_total - (int) $totalCost,
                ]
            );
        });

        return redirect()
            ->route('account.transactions.show', $invoice)
            ->with('success', 'Pembayaran transfer berhasil dikonfirmasi.');
    }

    public function void(Request $request, $invoice)
    {
        $user = $request->user();

        try {
            $this->checkoutService->void($user, $invoice, $request->void_reason);

            return redirect()
                ->route('account.transactions.show', $invoice)
                ->with('success', 'Transaksi berhasil di-void.');
        } catch (DomainException $exception) {
            return redirect()
                ->route('account.transactions.show', $invoice)
                ->with('error', $exception->getMessage());
        }
    }

    protected function createMidtransSnapToken(Transaction $transaction): string
    {
        $transaction->load([
            'customer',
            'details.product',
        ]);

        MidtransConfig::$serverKey = config('midtrans.server_key');
        MidtransConfig::$isProduction = (bool) config('midtrans.is_production', false);
        MidtransConfig::$isSanitized = true;
        MidtransConfig::$is3ds = true;

        $items = $transaction->details->map(function ($detail) {
            return [
                'id' => (string) $detail->product_id,
                'price' => (int) $detail->price,
                'quantity' => (int) $detail->qty,
                'name' => $detail->product?->title ?? 'Produk',
            ];
        })->values()->all();

        if ((int) $transaction->discount > 0) {
            $items[] = [
                'id' => 'DISCOUNT',
                'price' => -1 * (int) $transaction->discount,
                'quantity' => 1,
                'name' => 'Diskon',
            ];
        }

        $customerName = $transaction->customer?->name ?? 'Pelanggan Umum';
        $customerPhone = $transaction->customer?->no_telp ?? null;

        try {
            return Snap::getSnapToken([
                'transaction_details' => [
                    'order_id' => $transaction->invoice,
                    'gross_amount' => (int) $transaction->grand_total,
                ],
                'customer_details' => [
                    'first_name' => $customerName,
                    'phone' => $customerPhone,
                ],
                'item_details' => $items,
            ]);
        } catch (\Exception $exception) {
            Log::error('Midtrans Snap token creation failed', [
                'invoice' => $transaction->invoice,
                'exception' => $exception,
            ]);

            throw $exception;
        }
    }

    public function callback(Request $request)
    {
        Log::info('Midtrans callback received', [
            'order_id' => $request->order_id,
            'transaction_status' => $request->input('transaction_status'),
            'status_code' => $request->status_code,
        ]);

        $serverKey = config('midtrans.server_key');

        $signatureKey = hash(
            'sha512',
            $request->order_id .
                $request->status_code .
                $request->gross_amount .
                $serverKey
        );

        if ($signatureKey !== $request->signature_key) {
            Log::warning('Midtrans callback signature mismatch', [
                'order_id' => $request->order_id,
                'transaction_status' => $request->input('transaction_status'),
            ]);

            return response()->json([
                'message' => 'Invalid signature key',
            ], 403);
        }

        $transaction = Transaction::where('invoice', $request->order_id)->first();

        if (! $transaction) {
            return response()->json([
                'message' => 'Transaction not found',
            ], 404);
        }

        $transactionStatus = $request->input('transaction_status');
        $fraudStatus = $request->input('fraud_status');

        $paymentStatus = 'pending';
        $status = 'pending';

        if ($transactionStatus === 'capture') {
            if ($fraudStatus === 'accept') {
                $paymentStatus = 'paid';
                $status = 'completed';
            }
        }

        if ($transactionStatus === 'settlement') {
            $paymentStatus = 'paid';
            $status = 'completed';
        }

        if ($transactionStatus === 'pending') {
            $paymentStatus = 'pending';
            $status = 'pending';
        }

        if (in_array($transactionStatus, ['deny', 'cancel', 'failure'])) {
            $paymentStatus = 'failed';
            $status = 'pending';
        }

        if ($transactionStatus === 'expire') {
            $paymentStatus = 'expired';
            $status = 'pending';
        }

        DB::transaction(function () use ($request, $transaction, $paymentStatus, $status) {
            $transaction->update([
                'payment_status' => $paymentStatus,
                'status' => $status,
                'midtrans_transaction_id' => $request->transaction_id,
                'paid_at' => $paymentStatus === 'paid' ? ($transaction->paid_at ?? now()) : $transaction->paid_at,
            ]);

            if ($paymentStatus === 'paid') {
                $details = TransactionDetail::query()
                    ->where('transaction_id', $transaction->id)
                    ->get();

                $totalCost = $details->sum(function ($detail) {
                    if ($detail->ppob_cost !== null) {
                        return (int) $detail->ppob_cost * (int) $detail->qty;
                    }

                    return (int) $detail->buy_price * $detail->qtyInBaseUnits();
                });

                Profit::updateOrCreate(
                    [
                        'transaction_id' => $transaction->id,
                    ],
                    [
                        'total_revenue' => (int) $transaction->grand_total,
                        'total_cost' => (int) $totalCost,
                        'profit_amount' => (int) $transaction->grand_total - (int) $totalCost,
                    ]
                );
            }
        });

        return response()->json([
            'message' => 'Callback processed successfully',
        ]);
    }
}
