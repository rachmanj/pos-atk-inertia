<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Models\Consignment;
use App\Models\ConsignmentItem;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\Supplier;
use App\Models\SupplierReturn;
use App\Models\SupplierReturnDetail;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class ConsignmentController extends Controller
{
    public function index(Request $request)
    {
        abort_unless($request->user()->can('consignments.index'), 403);

        $request->validate([
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

        $consignments = Consignment::query()
            ->with(['supplier:id,name', 'user:id,name'])
            ->withCount('items')
            ->withSum('items as total_qty', 'qty_in')
            ->whereBetween('received_date', [
                $startDate->toDateString(),
                $endDate->toDateString(),
            ])
            ->when(filled($request->supplier_id), function ($query) use ($request) {
                $query->where('supplier_id', $request->supplier_id);
            })
            ->latest('received_date')
            ->latest('id')
            ->paginate(10);

        $consignments->appends([
            'supplier_id' => $request->supplier_id,
            'start_date' => $startDate->toDateString(),
            'end_date' => $endDate->toDateString(),
        ]);

        return Inertia::render('Account/Consignments/Index', [
            'consignments' => $consignments,
            'suppliers' => Supplier::query()
                ->orderBy('name')
                ->get(['id', 'name']),
            'filters' => [
                'supplier_id' => $request->supplier_id ?? '',
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
            ],
        ]);
    }

    public function create(Request $request)
    {
        abort_unless($request->user()->can('consignments.create'), 403);

        return Inertia::render('Account/Consignments/Create', [
            'suppliers' => Supplier::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'no_telp']),
            'products' => Product::query()
                ->physical()
                ->with(['productUnits.unit'])
                ->orderBy('title')
                ->get(['id', 'title', 'barcode', 'stock', 'sell_price', 'unit', 'product_type']),
            'defaultReceivedDate' => now()->toDateString(),
        ]);
    }

    public function store(Request $request)
    {
        abort_unless($request->user()->can('consignments.create'), 403);

        $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'received_date' => 'required|date',
            'note' => 'nullable|string|max:1000',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.unit_id' => 'nullable|exists:units,id',
            'items.*.conversion_factor' => 'nullable|numeric|min:0.0001',
            'items.*.qty' => 'required|integer|min:1',
            'items.*.cost_price' => 'required|integer|min:0',
        ]);

        $items = collect($request->items)
            ->map(function ($item) {
                return [
                    'product_id' => (int) $item['product_id'],
                    'unit_id' => isset($item['unit_id']) ? (int) $item['unit_id'] : null,
                    'conversion_factor' => (float) ($item['conversion_factor'] ?? 1),
                    'qty' => (int) $item['qty'],
                    'cost_price' => (int) $item['cost_price'],
                ];
            })
            ->filter(fn ($item) => $item['product_id'] > 0 && $item['qty'] > 0)
            ->values();

        if ($items->isEmpty()) {
            throw ValidationException::withMessages([
                'items' => 'Tambahkan minimal satu produk untuk penerimaan konsinyasi.',
            ]);
        }

        if ($items->pluck('product_id')->unique()->count() !== $items->count()) {
            throw ValidationException::withMessages([
                'items' => 'Produk dalam penerimaan tidak boleh duplikat.',
            ]);
        }

        $consignment = DB::transaction(function () use ($request, $items) {
            $lockedProducts = Product::query()
                ->physical()
                ->with(['productUnits'])
                ->whereIn('id', $items->pluck('product_id')->all())
                ->orderBy('id')
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            $code = $this->generateConsignmentCode();

            $consignment = Consignment::create([
                'supplier_id' => (int) $request->supplier_id,
                'user_id' => $request->user()->id,
                'code' => $code,
                'received_date' => $request->received_date,
                'note' => filled($request->note) ? trim($request->note) : null,
                'status' => Consignment::STATUS_OPEN,
            ]);

            foreach ($items as $item) {
                $product = $lockedProducts->get($item['product_id']);

                if (!$product) {
                    throw ValidationException::withMessages([
                        'items' => 'Terdapat produk yang tidak valid pada penerimaan.',
                    ]);
                }

                $conversionFactor = max(0.0001, (float) $item['conversion_factor']);
                $qtyInBase = (int) round($item['qty'] * $conversionFactor);
                $costPricePerBase = (int) round($item['cost_price'] / $conversionFactor);

                $stockBefore = (int) $product->stock;
                $stockAfter = $stockBefore + $qtyInBase;

                ConsignmentItem::create([
                    'consignment_id' => $consignment->id,
                    'product_id' => $product->id,
                    'qty_in' => $qtyInBase,
                    'qty_sold' => 0,
                    'qty_returned' => 0,
                    'cost_price' => $costPricePerBase,
                ]);

                $product->update([
                    'stock' => $stockAfter,
                ]);

                StockMovement::create([
                    'product_id' => $product->id,
                    'user_id' => $request->user()->id,
                    'type' => 'in',
                    'qty' => $qtyInBase,
                    'stock_before' => $stockBefore,
                    'stock_after' => $stockAfter,
                    'reference_type' => Consignment::class,
                    'reference_id' => $consignment->id,
                    'note' => 'Penerimaan Konsinyasi: ' . $consignment->code,
                ]);
            }

            return $consignment;
        });

        return redirect()
            ->route('account.consignments.show', $consignment)
            ->with('success', 'Penerimaan konsinyasi berhasil disimpan dan stok produk sudah diperbarui.');
    }

    public function show(Request $request, Consignment $consignment)
    {
        abort_unless($request->user()->can('consignments.show'), 403);

        $consignment->load([
            'supplier:id,name,no_telp,email,address',
            'user:id,name',
            'items.product:id,title,barcode,unit',
        ]);

        $consignment->setRelation(
            'items',
            $consignment->items->map(function (ConsignmentItem $item) {
                $remaining = $item->remainingQty();

                return array_merge($item->toArray(), [
                    'remaining_qty' => $remaining,
                    'remaining_value' => $remaining * (int) $item->cost_price,
                ]);
            }),
        );

        $totals = [
            'total_items' => $consignment->items->count(),
            'total_qty_in' => (int) $consignment->items->sum('qty_in'),
            'total_qty_sold' => (int) $consignment->items->sum('qty_sold'),
            'total_qty_returned' => (int) $consignment->items->sum('qty_returned'),
            'total_remaining_qty' => (int) $consignment->items->sum('remaining_qty'),
            'total_remaining_value' => (int) $consignment->items->sum('remaining_value'),
        ];

        $consignmentReturns = SupplierReturn::query()
            ->where('consignment_id', $consignment->id)
            ->with(['user:id,name'])
            ->latest('return_date')
            ->latest('id')
            ->get([
                'id',
                'invoice',
                'return_date',
                'total_qty',
                'total_amount',
                'note',
                'user_id',
            ]);

        return Inertia::render('Account/Consignments/Show', [
            'consignment' => $consignment,
            'totals' => $totals,
            'consignmentReturns' => $consignmentReturns,
        ]);
    }

    public function returns(Request $request, Consignment $consignment)
    {
        abort_unless($request->user()->can('consignments.show'), 403);

        $request->validate([
            'return_date' => 'nullable|date',
            'note' => 'nullable|string|max:1000',
            'items' => 'required|array|min:1',
            'items.*.consignment_item_id' => [
                'required',
                'integer',
                Rule::exists('consignment_items', 'id')->where(
                    fn ($query) => $query->where('consignment_id', $consignment->id),
                ),
            ],
            'items.*.qty' => 'required|integer|min:1',
        ]);

        $selectedItems = collect($request->items)
            ->map(fn ($item) => [
                'consignment_item_id' => (int) $item['consignment_item_id'],
                'qty' => (int) $item['qty'],
            ])
            ->values();

        if ($selectedItems->pluck('consignment_item_id')->unique()->count() !== $selectedItems->count()) {
            throw ValidationException::withMessages([
                'items' => 'Baris retur tidak boleh duplikat untuk item yang sama.',
            ]);
        }

        $returnDate = filled($request->return_date)
            ? $request->return_date
            : now()->toDateString();

        $supplierReturn = DB::transaction(function () use ($request, $consignment, $selectedItems, $returnDate) {
            $consignmentItems = ConsignmentItem::query()
                ->with('product:id,title,stock')
                ->where('consignment_id', $consignment->id)
                ->whereIn('id', $selectedItems->pluck('consignment_item_id')->all())
                ->orderBy('id')
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            $preparedItems = [];

            foreach ($selectedItems as $index => $item) {
                $consignmentItem = $consignmentItems->get($item['consignment_item_id']);

                if (!$consignmentItem) {
                    throw ValidationException::withMessages([
                        'items' => 'Terdapat item retur yang tidak sesuai dengan penerimaan konsinyasi ini.',
                    ]);
                }

                $remainingQty = $consignmentItem->remainingQty();

                if ($item['qty'] > $remainingQty) {
                    $productTitle = $consignmentItem->product?->title ?? 'produk';

                    throw ValidationException::withMessages([
                        "items.{$index}.qty" => "Qty retur ({$item['qty']} pcs) melebihi sisa titipan ({$remainingQty} pcs) untuk {$productTitle}.",
                    ]);
                }

                $product = Product::query()
                    ->whereKey($consignmentItem->product_id)
                    ->lockForUpdate()
                    ->firstOrFail();

                $costPrice = (int) $consignmentItem->cost_price;
                $stockBefore = (int) $product->stock;
                $stockAfter = $stockBefore - $item['qty'];

                $preparedItems[] = [
                    'consignment_item_id' => $consignmentItem->id,
                    'product_id' => $consignmentItem->product_id,
                    'qty' => $item['qty'],
                    'buy_price' => $costPrice,
                    'subtotal' => $item['qty'] * $costPrice,
                    'stock_before' => $stockBefore,
                    'stock_after' => $stockAfter,
                    'new_qty_returned' => (int) $consignmentItem->qty_returned + $item['qty'],
                ];
            }

            $supplierReturn = SupplierReturn::create([
                'purchase_id' => null,
                'consignment_id' => $consignment->id,
                'supplier_id' => $consignment->supplier_id,
                'user_id' => $request->user()->id,
                'invoice' => $this->generateConsignmentReturnInvoice(),
                'return_date' => $returnDate,
                'total_items' => count($preparedItems),
                'total_qty' => collect($preparedItems)->sum('qty'),
                'total_amount' => collect($preparedItems)->sum('subtotal'),
                'reason' => 'other',
                'note' => filled($request->note) ? trim($request->note) : null,
            ]);

            foreach ($preparedItems as $item) {
                SupplierReturnDetail::create([
                    'supplier_return_id' => $supplierReturn->id,
                    'purchase_detail_id' => null,
                    'consignment_item_id' => $item['consignment_item_id'],
                    'product_id' => $item['product_id'],
                    'qty' => $item['qty'],
                    'buy_price' => $item['buy_price'],
                    'subtotal' => $item['subtotal'],
                ]);

                ConsignmentItem::query()
                    ->whereKey($item['consignment_item_id'])
                    ->update([
                        'qty_returned' => $item['new_qty_returned'],
                    ]);

                Product::query()
                    ->whereKey($item['product_id'])
                    ->update([
                        'stock' => $item['stock_after'],
                    ]);

                StockMovement::create([
                    'product_id' => $item['product_id'],
                    'user_id' => $request->user()->id,
                    'type' => 'out',
                    'qty' => $item['qty'],
                    'stock_before' => $item['stock_before'],
                    'stock_after' => $item['stock_after'],
                    'reference_type' => SupplierReturn::class,
                    'reference_id' => $supplierReturn->id,
                    'note' => 'Retur Konsinyasi: ' . $supplierReturn->invoice,
                ]);
            }

            return $supplierReturn;
        });

        return redirect()
            ->route('account.consignments.show', $consignment)
            ->with(
                'success',
                'Retur konsinyasi ' . $supplierReturn->invoice . ' berhasil disimpan dan stok produk telah diperbarui.',
            );
    }

    protected function generateConsignmentCode(): string
    {
        do {
            $code = 'CON-' . now()->format('Ymd') . '-' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 6));
        } while (Consignment::where('code', $code)->exists());

        return $code;
    }

    protected function generateConsignmentReturnInvoice(): string
    {
        do {
            $invoice = 'RET-' . now()->format('Ymd') . '-' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 6));
        } while (SupplierReturn::query()->where('invoice', $invoice)->exists());

        return $invoice;
    }
}