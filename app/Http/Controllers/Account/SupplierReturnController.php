<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\PurchaseDetail;
use App\Models\StockMovement;
use App\Models\Supplier;
use App\Models\SupplierReturn;
use App\Models\SupplierReturnDetail;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class SupplierReturnController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        abort_unless($user->can('supplier_returns.index'), 403);

        $request->validate([
            'q' => 'nullable|string|max:100',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $startDate = $request->start_date
            ? Carbon::parse($request->start_date)->startOfDay()
            : Carbon::now()->startOfMonth();

        $endDate = $request->end_date
            ? Carbon::parse($request->end_date)->endOfDay()
            : Carbon::now()->endOfDay();

        $supplierReturns = SupplierReturn::query()
            ->with(['supplier:id,name', 'user:id,name', 'purchase:id,invoice'])
            ->when(!$user->isAdminUser(), function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->whereBetween('return_date', [
                $startDate->toDateString(),
                $endDate->toDateString(),
            ])
            ->when(filled($request->supplier_id), function ($query) use ($request) {
                $query->where('supplier_id', $request->supplier_id);
            })
            ->when(filled($request->q), function ($query) use ($request) {
                $search = trim($request->q);

                $query->where(function ($subQuery) use ($search) {
                    $subQuery->where('invoice', 'like', '%' . $search . '%')
                        ->orWhereHas('purchase', function ($purchaseQuery) use ($search) {
                            $purchaseQuery->where('invoice', 'like', '%' . $search . '%');
                        })
                        ->orWhereHas('supplier', function ($supplierQuery) use ($search) {
                            $supplierQuery->where('name', 'like', '%' . $search . '%');
                        })
                        ->orWhereHas('user', function ($userQuery) use ($search) {
                            $userQuery->where('name', 'like', '%' . $search . '%');
                        });
                });
            })
            ->latest('return_date')
            ->latest('id')
            ->paginate(10);

        $supplierReturns->appends([
            'q' => $request->q,
            'supplier_id' => $request->supplier_id,
            'start_date' => $startDate->toDateString(),
            'end_date' => $endDate->toDateString(),
        ]);

        return Inertia::render('Account/SupplierReturns/Index', [
            'supplierReturns' => $supplierReturns,
            'suppliers' => Supplier::query()
                ->orderBy('name')
                ->get(['id', 'name']),
            'filters' => [
                'q' => $request->q ?? '',
                'supplier_id' => $request->supplier_id ?? '',
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
            ],
        ]);
    }

    public function create(Request $request, $invoice)
    {
        $user = $request->user();

        abort_unless($user->can('supplier_returns.create'), 403);

        $purchase = Purchase::query()
            ->with([
                'supplier:id,name,no_telp,email,address',
                'user:id,name',
                'details.product:id,title,barcode,unit,stock',
            ])
            ->where('invoice', $invoice)
            ->when(!$user->isAdminUser(), function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->firstOrFail();

        $returnedQty = $this->getReturnedQtyByPurchaseDetail($purchase->id);

        $returnableItems = $purchase->details->map(function (PurchaseDetail $detail) use ($returnedQty) {
            $alreadyReturnedQty = (int) ($returnedQty[$detail->id] ?? 0);
            $remainingQty = max(0, (int) $detail->qty - $alreadyReturnedQty);
            $currentStock = (int) ($detail->product->stock ?? 0);

            return [
                'purchase_detail_id' => $detail->id,
                'product_id' => $detail->product_id,
                'product_title' => $detail->product?->title,
                'product_barcode' => $detail->product?->barcode,
                'unit' => $detail->product?->unit,
                'purchased_qty' => (int) $detail->qty,
                'returned_qty' => $alreadyReturnedQty,
                'remaining_qty' => $remainingQty,
                'current_stock' => $currentStock,
                'max_return_qty' => min($remainingQty, $currentStock),
                'buy_price' => (int) $detail->buy_price,
                'subtotal' => (int) $detail->subtotal,
            ];
        });

        if ($returnableItems->every(fn($item) => $item['max_return_qty'] === 0)) {
            return redirect()
                ->route('account.purchases.show', $purchase->invoice)
                ->with('error', 'Tidak ada item yang bisa diretur ke supplier dari pembelian ini.');
        }

        return Inertia::render('Account/SupplierReturns/Create', [
            'purchase' => $purchase,
            'returnableItems' => $returnableItems,
            'defaultReturnDate' => now()->toDateString(),
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        abort_unless($user->can('supplier_returns.create'), 403);

        $request->validate([
            'purchase_id' => 'required|exists:purchases,id',
            'return_date' => 'required|date',
            'reason' => 'required|in:defect,expired,wrong_item,other',
            'note' => 'nullable|string|max:1000',
            'items' => 'required|array|min:1',
            'items.*.purchase_detail_id' => 'required|exists:purchase_details,id',
            'items.*.qty' => 'nullable|integer|min:0',
        ]);

        $purchase = Purchase::query()
            ->with(['details.product'])
            ->whereKey($request->purchase_id)
            ->when(!$user->isAdminUser(), function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->firstOrFail();

        $selectedItems = collect($request->items)
            ->map(fn($item) => [
                'purchase_detail_id' => (int) $item['purchase_detail_id'],
                'qty' => (int) ($item['qty'] ?? 0),
            ])
            ->filter(fn($item) => $item['qty'] > 0)
            ->values();

        if ($selectedItems->isEmpty()) {
            throw ValidationException::withMessages([
                'items' => 'Pilih minimal satu item dengan qty retur lebih dari 0.',
            ]);
        }

        if ($selectedItems->pluck('purchase_detail_id')->unique()->count() !== $selectedItems->count()) {
            throw ValidationException::withMessages([
                'items' => 'Item retur supplier tidak boleh duplikat.',
            ]);
        }

        $supplierReturn = DB::transaction(function () use ($request, $purchase, $selectedItems, $user) {
            $purchaseDetails = PurchaseDetail::query()
                ->with('product:id,title,stock')
                ->where('purchase_id', $purchase->id)
                ->whereIn('id', $selectedItems->pluck('purchase_detail_id')->all())
                ->orderBy('id')
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            $returnedQty = $this->getReturnedQtyByPurchaseDetail($purchase->id);
            $preparedItems = [];

            foreach ($selectedItems as $item) {
                $detail = $purchaseDetails->get($item['purchase_detail_id']);

                if (!$detail) {
                    throw ValidationException::withMessages([
                        'items' => 'Terdapat item retur yang tidak sesuai dengan pembelian.',
                    ]);
                }

                $product = Product::query()
                    ->whereKey($detail->product_id)
                    ->lockForUpdate()
                    ->firstOrFail();

                $alreadyReturnedQty = (int) ($returnedQty[$detail->id] ?? 0);
                $remainingQty = max(0, (int) $detail->qty - $alreadyReturnedQty);
                $currentStock = (int) $product->stock;
                $maxReturnQty = min($remainingQty, $currentStock);

                if ($item['qty'] > $maxReturnQty) {
                    throw ValidationException::withMessages([
                        'items' => 'Qty retur supplier melebihi batas yang tersedia pada stok atau pembelian.',
                    ]);
                }

                $preparedItems[] = [
                    'purchase_detail_id' => $detail->id,
                    'product_id' => $detail->product_id,
                    'qty' => $item['qty'],
                    'buy_price' => (int) $detail->buy_price,
                    'subtotal' => $item['qty'] * (int) $detail->buy_price,
                    'stock_before' => $currentStock,
                    'stock_after' => $currentStock - $item['qty'],
                ];
            }

            $supplierReturn = SupplierReturn::create([
                'purchase_id' => $purchase->id,
                'supplier_id' => $purchase->supplier_id,
                'user_id' => $user->id,
                'invoice' => $this->generateReturnInvoice(),
                'return_date' => $request->return_date,
                'total_items' => count($preparedItems),
                'total_qty' => collect($preparedItems)->sum('qty'),
                'total_amount' => collect($preparedItems)->sum('subtotal'),
                'reason' => $request->reason,
                'note' => filled($request->note) ? trim($request->note) : null,
            ]);

            foreach ($preparedItems as $item) {
                SupplierReturnDetail::create([
                    'supplier_return_id' => $supplierReturn->id,
                    'purchase_detail_id' => $item['purchase_detail_id'],
                    'product_id' => $item['product_id'],
                    'qty' => $item['qty'],
                    'buy_price' => $item['buy_price'],
                    'subtotal' => $item['subtotal'],
                ]);

                Product::query()
                    ->whereKey($item['product_id'])
                    ->update([
                        'stock' => $item['stock_after'],
                    ]);

                StockMovement::create([
                    'product_id' => $item['product_id'],
                    'user_id' => $user->id,
                    'type' => 'out',
                    'qty' => $item['qty'],
                    'stock_before' => $item['stock_before'],
                    'stock_after' => $item['stock_after'],
                    'reference_type' => SupplierReturn::class,
                    'reference_id' => $supplierReturn->id,
                    'note' => 'Retur Supplier Invoice: ' . $supplierReturn->invoice,
                ]);
            }

            return $supplierReturn;
        });

        return redirect()
            ->route('account.supplier-returns.show', $supplierReturn->invoice)
            ->with('success', 'Retur supplier berhasil disimpan dan stok produk telah diperbarui.');
    }

    public function show(Request $request, $invoice)
    {
        $user = $request->user();

        abort_unless($user->can('supplier_returns.show'), 403);

        $supplierReturn = SupplierReturn::query()
            ->with([
                'supplier:id,name,no_telp,email,address',
                'user:id,name',
                'purchase:id,invoice,purchase_date',
                'details.product:id,title,barcode,unit',
            ])
            ->where('invoice', $invoice)
            ->when(!$user->isAdminUser(), function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->firstOrFail();

        return Inertia::render('Account/SupplierReturns/Show', [
            'supplierReturn' => $supplierReturn,
        ]);
    }

    protected function getReturnedQtyByPurchaseDetail(int $purchaseId): array
    {
        return SupplierReturnDetail::query()
            ->selectRaw('supplier_return_details.purchase_detail_id, SUM(supplier_return_details.qty) as total_qty')
            ->join('supplier_returns', 'supplier_returns.id', '=', 'supplier_return_details.supplier_return_id')
            ->where('supplier_returns.purchase_id', $purchaseId)
            ->groupBy('supplier_return_details.purchase_detail_id')
            ->pluck('total_qty', 'purchase_detail_id')
            ->map(fn($qty) => (int) $qty)
            ->toArray();
    }

    protected function generateReturnInvoice(): string
    {
        do {
            $invoice = 'SR-' . now()->format('Ymd') . '-' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 6));
        } while (SupplierReturn::query()->where('invoice', $invoice)->exists());

        return $invoice;
    }
}
