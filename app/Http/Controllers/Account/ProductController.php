<?php

namespace App\Http\Controllers\Account;

use App\Exports\ProductSalesHistoryExport;
use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductComponent;
use App\Models\ProductUnit;
use App\Models\StockMovement;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $products = Product::with(['category', 'baseUnit.unit', 'defaultSellUnit.unit'])
            ->when($request->q, function ($query) use ($request) {
                $query->where('title', 'like', '%' . $request->q . '%')
                    ->orWhere('barcode', 'like', '%' . $request->q . '%');
            })
            ->latest()
            ->paginate(10);

        $products->appends([
            'q' => $request->q,
        ]);

        return Inertia::render('Account/Products/Index', [
            'products' => $products,
        ]);
    }

    public function create()
    {
        return Inertia::render('Account/Products/Create', [
            'categories' => Category::orderBy('name')->get(),
            'units' => Unit::orderBy('name')->get(),
            'physicalProducts' => Product::physical()
                ->where('is_active', true)
                ->orderBy('title')
                ->get(['id', 'title', 'barcode', 'unit', 'stock']),
        ]);
    }

    public function store(Request $request)
    {
        $productType = $request->input('product_type', 'physical');
        $productUnits = $this->parseProductUnits($request);
        $components = $this->parseComponents($request);

        $rules = [
            'category_id' => 'required|exists:categories,id',
            'barcode' => 'required|string|unique:products,barcode',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'product_type' => 'required|in:physical,ppob,service',
        ];

        if ($productType === 'physical') {
            $rules['buy_price'] = 'required|integer|min:0';
            $rules['stock'] = 'required|integer|min:0';
        } elseif ($productType === 'service') {
            $rules['sell_price'] = 'required|integer|min:1';
            $rules['unit_id'] = 'required|exists:units,id';
        } else {
            $rules['buy_price'] = 'nullable|integer|min:0';
            $rules['stock'] = 'nullable|integer|min:0';
        }

        $rules['image'] = 'nullable|image|mimes:jpeg,png,jpg|max:2048';

        $request->validate($rules);

        if ($productType === 'physical') {
            $openingBuyPrice = (int) $request->buy_price;
            $this->validateProductUnits($productUnits, $openingBuyPrice);
        } elseif ($productType === 'service') {
            $this->validateComponents($components);
        }

        $imageName = null;

        if ($request->hasFile('image')) {
            $image = $request->file('image');
            $image->storeAs('products', $image->hashName(), 'public');
            $imageName = $image->hashName();
        }

        DB::transaction(function () use ($request, $productType, $productUnits, $components, $imageName) {
            $stock = $productType === 'physical' ? (int) $request->stock : 0;
            $buyPrice = $productType === 'physical' ? (int) $request->buy_price : 0;
            $sellPrice = match ($productType) {
                'physical' => $this->resolveDefaultSellPrice($productUnits),
                'service' => (int) $request->sell_price,
                default => 0,
            };
            $baseAbbreviation = match ($productType) {
                'physical' => $this->resolveBaseUnitAbbreviation($productUnits),
                'service' => Unit::query()->whereKey($request->unit_id)->value('abbreviation') ?: 'lembar',
                default => 'lembar',
            };

            $product = Product::create([
                'category_id' => $request->category_id,
                'image' => $imageName,
                'barcode' => $request->barcode,
                'title' => $request->title,
                'description' => $request->description,
                'product_type' => $productType,
                'buy_price' => $buyPrice,
                'sell_price' => $sellPrice,
                'avg_cost' => $productType === 'physical' ? $buyPrice : 0,
                'unit' => $baseAbbreviation,
                'stock' => $stock,
                'is_active' => true,
            ]);

            if ($productType === 'physical') {
                $this->syncProductUnits($product, $productUnits);

                if ($stock > 0) {
                    StockMovement::create([
                        'product_id' => $product->id,
                        'user_id' => Auth::id(),
                        'type' => 'in',
                        'qty' => $stock,
                        'stock_before' => 0,
                        'stock_after' => $stock,
                        'reference_type' => null,
                        'reference_id' => null,
                        'note' => 'Stok awal produk saat dibuat.',
                    ]);
                }
            } elseif ($productType === 'service') {
                $this->syncServiceProductUnit($product, (int) $request->unit_id, (int) $request->sell_price);
                $this->syncComponents($product, $components);
            }
        });

        return redirect()->route('account.products.index');
    }

    public function edit($id)
    {
        $product = Product::with(['productUnits.unit', 'components.componentProduct'])->findOrFail($id);

        return Inertia::render('Account/Products/Edit', [
            'product' => $product,
            'categories' => Category::orderBy('name')->get(),
            'units' => Unit::orderBy('name')->get(),
            'physicalProducts' => Product::physical()
                ->where('is_active', true)
                ->whereKeyNot($product->id)
                ->orderBy('title')
                ->get(['id', 'title', 'barcode', 'unit', 'stock']),
        ]);
    }

    public function update(Request $request, $id)
    {
        $product = Product::findOrFail($id);
        $productType = $request->input('product_type', $product->product_type);
        $productUnits = $this->parseProductUnits($request);
        $components = $this->parseComponents($request);

        $rules = [
            'category_id' => 'required|exists:categories,id',
            'barcode' => 'required|string|unique:products,barcode,' . $id,
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'product_type' => 'required|in:physical,ppob,service',
            'image' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
        ];

        $request->validate($rules);

        if ($productType === 'physical') {
            $this->validateProductUnits($productUnits);
        } elseif ($productType === 'service') {
            $rules['sell_price'] = 'required|integer|min:1';
            $rules['unit_id'] = 'required|exists:units,id';
            $request->validate([
                'sell_price' => 'required|integer|min:1',
                'unit_id' => 'required|exists:units,id',
            ]);
            $this->validateComponents($components);
        }

        $data = [
            'category_id' => $request->category_id,
            'barcode' => $request->barcode,
            'title' => $request->title,
            'description' => $request->description,
            'product_type' => $productType,
        ];

        if ($productType === 'physical') {
            $data['sell_price'] = $this->resolveDefaultSellPrice($productUnits);
            $data['unit'] = $this->resolveBaseUnitAbbreviation($productUnits);
        } elseif ($productType === 'service') {
            $data['sell_price'] = (int) $request->sell_price;
            $data['buy_price'] = 0;
            $data['avg_cost'] = 0;
            $data['unit'] = Unit::query()->whereKey($request->unit_id)->value('abbreviation') ?: 'lembar';
        } else {
            $data['buy_price'] = 0;
            $data['sell_price'] = 0;
        }

        if ($productType === 'ppob') {
            $data['unit'] = 'lembar';
        }

        if ($request->hasFile('image')) {
            if ($product->getRawOriginal('image')) {
                Storage::disk('public')->delete('products/' . $product->getRawOriginal('image'));
            }

            $image = $request->file('image');
            $image->storeAs('products', $image->hashName(), 'public');
            $data['image'] = $image->hashName();
        }

        DB::transaction(function () use ($product, $data, $productType, $productUnits, $components, $request) {
            $product->update($data);

            if ($productType === 'physical') {
                $this->syncProductUnits($product, $productUnits);
                $product->components()->delete();
            } elseif ($productType === 'service') {
                $this->syncServiceProductUnit($product, (int) $request->unit_id, (int) $request->sell_price);
                $this->syncComponents($product, $components);
            } else {
                $product->productUnits()->delete();
                $product->components()->delete();
            }
        });

        return redirect()->route('account.products.index');
    }

    public function destroy($id)
    {
        $product = Product::findOrFail($id);

        if ($product->getRawOriginal('image')) {
            Storage::disk('public')->delete('products/' . $product->getRawOriginal('image'));
        }

        $product->delete();

        return redirect()->route('account.products.index');
    }

    public function salesHistory(Request $request, Product $product)
    {
        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'cashier_id' => 'nullable|exists:users,id',
        ]);

        $filters = $this->salesHistoryFilters($request);
        $baseQuery = $this->salesHistoryQuery($product, $filters);

        $summaryRow = (clone $baseQuery)
            ->reorder()
            ->select([
                DB::raw('COUNT(DISTINCT transactions.id) as total_transaksi'),
                DB::raw('SUM(transaction_details.qty) as total_qty'),
                DB::raw('SUM(transaction_details.subtotal) as total_omzet'),
                DB::raw('SUM(transaction_details.subtotal - transaction_details.buy_price * transaction_details.qty) as total_laba'),
            ])
            ->first();

        $transactions = (clone $baseQuery)
            ->paginate(50)
            ->withQueryString();

        $transactions->getCollection()->transform(function ($row) {
            return [
                'id' => $row->id,
                'waktu' => Carbon::parse($row->waktu_raw)->format('d/m/Y H:i'),
                'invoice' => $row->invoice,
                'cashier' => $row->cashier_name,
                'qty' => (int) $row->qty,
                'harga_satuan' => (int) $row->price,
                'subtotal' => (int) $row->subtotal,
                'laba' => (int) ($row->subtotal - ($row->buy_price * $row->qty)),
            ];
        });

        $product->load('category:id,name');

        return Inertia::render('Account/Products/SalesHistory', [
            'product' => [
                'id' => $product->id,
                'title' => $product->title,
                'barcode' => $product->barcode,
                'unit' => $product->unit,
                'category' => $product->category?->name,
                'stock' => (int) $product->stock,
                'sell_price' => (int) $product->sell_price,
            ],
            'filters' => $filters,
            'cashiers' => User::query()
                ->whereHas('transactions', function ($query) use ($product) {
                    $query->where('payment_status', 'paid')
                        ->where('status', '!=', 'voided')
                        ->whereHas('details', function ($detailQuery) use ($product) {
                            $detailQuery->where('product_id', $product->id);
                        });
                })
                ->orderBy('name')
                ->get(['id', 'name']),
            'summary' => [
                'total_transaksi' => (int) ($summaryRow->total_transaksi ?? 0),
                'total_qty' => (int) ($summaryRow->total_qty ?? 0),
                'total_omzet' => (int) ($summaryRow->total_omzet ?? 0),
                'total_laba' => (int) ($summaryRow->total_laba ?? 0),
            ],
            'transactions' => $transactions,
        ]);
    }

    public function salesHistoryExport(Request $request, Product $product)
    {
        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'cashier_id' => 'nullable|exists:users,id',
        ]);

        $filters = $this->salesHistoryFilters($request);

        return Excel::download(
            new ProductSalesHistoryExport($product, $filters),
            'riwayat-penjualan-' . $product->barcode . '-' . now()->format('Ymd_His') . '.xlsx'
        );
    }

    public function printBarcodes(Request $request)
    {
        $request->validate([
            'product_ids' => 'required|array',
            'product_ids.*' => 'exists:products,id',
        ]);

        $products = Product::whereIn('id', $request->product_ids)->get();

        return view('print.barcode', compact('products'));
    }

    private function salesHistoryFilters(Request $request): array
    {
        return [
            'start_date' => $request->start_date ?? '',
            'end_date' => $request->end_date ?? '',
            'cashier_id' => $request->cashier_id ?? '',
        ];
    }

    private function salesHistoryQuery(Product $product, array $filters): Builder
    {
        return ProductSalesHistoryExport::baseQuery($product, $filters);
    }

    protected function parseProductUnits(Request $request): array
    {
        $productUnits = $request->input('product_units', []);

        if (is_string($productUnits)) {
            $productUnits = json_decode($productUnits, true) ?? [];
        }

        return collect($productUnits)
            ->map(function ($row) {
                return [
                    'unit_id' => (int) ($row['unit_id'] ?? 0),
                    'conversion_factor' => (float) ($row['conversion_factor'] ?? 1),
                    'sell_price' => (int) ($row['sell_price'] ?? 0),
                    'is_base_unit' => filter_var($row['is_base_unit'] ?? false, FILTER_VALIDATE_BOOLEAN),
                    'is_default_sell' => filter_var($row['is_default_sell'] ?? false, FILTER_VALIDATE_BOOLEAN),
                ];
            })
            ->filter(fn ($row) => $row['unit_id'] > 0)
            ->values()
            ->all();
    }

    protected function validateProductUnits(array $productUnits, ?int $openingBuyPrice = null): void
    {
        if (count($productUnits) < 1) {
            throw ValidationException::withMessages([
                'product_units' => 'Tambahkan minimal satu satuan untuk produk.',
            ]);
        }

        $baseCount = collect($productUnits)->where('is_base_unit', true)->count();
        $defaultCount = collect($productUnits)->where('is_default_sell', true)->count();

        if ($baseCount !== 1) {
            throw ValidationException::withMessages([
                'product_units' => 'Tentukan tepat satu satuan dasar.',
            ]);
        }

        if ($defaultCount !== 1) {
            throw ValidationException::withMessages([
                'product_units' => 'Tentukan tepat satu satuan jual default.',
            ]);
        }

        $defaultRow = collect($productUnits)->firstWhere('is_default_sell', true);

        if ((int) ($defaultRow['sell_price'] ?? 0) <= 0) {
            throw ValidationException::withMessages([
                'product_units' => 'Isi harga jual pada satuan jual default.',
            ]);
        }

        if ($openingBuyPrice !== null && $openingBuyPrice > 0) {
            $baseRow = collect($productUnits)->firstWhere('is_base_unit', true);

            if ($baseRow && (int) $baseRow['sell_price'] > 0 && (int) $baseRow['sell_price'] < $openingBuyPrice) {
                throw ValidationException::withMessages([
                    'product_units' => 'Harga jual satuan dasar tidak boleh lebih rendah dari harga beli awal.',
                ]);
            }
        }

        foreach ($productUnits as $index => $row) {
            if ($row['conversion_factor'] <= 0) {
                throw ValidationException::withMessages([
                    "product_units.$index.conversion_factor" => 'Faktor konversi harus lebih dari 0.',
                ]);
            }

            if ($row['sell_price'] < 0) {
                throw ValidationException::withMessages([
                    "product_units.$index.sell_price" => 'Harga jual satuan tidak valid.',
                ]);
            }
        }
    }

    protected function syncProductUnits(Product $product, array $productUnits): void
    {
        $product->productUnits()->delete();

        foreach ($productUnits as $row) {
            ProductUnit::create([
                'product_id' => $product->id,
                'unit_id' => $row['unit_id'],
                'conversion_factor' => $row['conversion_factor'],
                'sell_price' => $row['sell_price'],
                'is_base_unit' => $row['is_base_unit'],
                'is_default_sell' => $row['is_default_sell'],
            ]);
        }
    }

    protected function resolveBaseUnitAbbreviation(array $productUnits): string
    {
        $baseRow = collect($productUnits)->firstWhere('is_base_unit', true);

        if (!$baseRow) {
            return 'pcs';
        }

        return Unit::query()->whereKey($baseRow['unit_id'])->value('abbreviation') ?: 'pcs';
    }

    protected function resolveDefaultSellPrice(array $productUnits): int
    {
        $defaultRow = collect($productUnits)->firstWhere('is_default_sell', true);

        return (int) ($defaultRow['sell_price'] ?? 0);
    }

    protected function parseComponents(Request $request): array
    {
        $components = $request->input('components', []);

        if (is_string($components)) {
            $components = json_decode($components, true) ?? [];
        }

        return collect($components)
            ->map(function ($row) {
                return [
                    'component_product_id' => (int) ($row['component_product_id'] ?? 0),
                    'qty_per_unit' => (float) ($row['qty_per_unit'] ?? 0),
                    'note' => filled($row['note'] ?? null) ? trim($row['note']) : null,
                ];
            })
            ->filter(fn ($row) => $row['component_product_id'] > 0)
            ->values()
            ->all();
    }

    protected function validateComponents(array $components): void
    {
        if (count($components) < 1) {
            throw ValidationException::withMessages([
                'components' => 'Tambahkan minimal satu bahan baku untuk layanan.',
            ]);
        }

        $componentIds = collect($components)->pluck('component_product_id');

        if ($componentIds->duplicates()->isNotEmpty()) {
            throw ValidationException::withMessages([
                'components' => 'Bahan baku tidak boleh duplikat.',
            ]);
        }

        $physicalCount = Product::physical()
            ->whereIn('id', $componentIds)
            ->count();

        if ($physicalCount !== $componentIds->count()) {
            throw ValidationException::withMessages([
                'components' => 'Semua bahan baku harus produk fisik yang aktif.',
            ]);
        }

        foreach ($components as $index => $row) {
            if ($row['qty_per_unit'] <= 0) {
                throw ValidationException::withMessages([
                    "components.$index.qty_per_unit" => 'Qty bahan baku per unit layanan harus lebih dari 0.',
                ]);
            }
        }
    }

    protected function syncServiceProductUnit(Product $product, int $unitId, int $sellPrice): void
    {
        $product->productUnits()->delete();

        ProductUnit::create([
            'product_id' => $product->id,
            'unit_id' => $unitId,
            'conversion_factor' => 1,
            'sell_price' => $sellPrice,
            'is_base_unit' => true,
            'is_default_sell' => true,
        ]);
    }

    protected function syncComponents(Product $product, array $components): void
    {
        $product->components()->delete();

        foreach ($components as $row) {
            ProductComponent::create([
                'service_product_id' => $product->id,
                'component_product_id' => $row['component_product_id'],
                'qty_per_unit' => $row['qty_per_unit'],
                'note' => $row['note'],
            ]);
        }
    }
}
