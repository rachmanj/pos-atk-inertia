<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductUnit;
use App\Models\StockMovement;
use App\Models\Unit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

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
        ]);
    }

    public function store(Request $request)
    {
        $productType = $request->input('product_type', 'physical');
        $productUnits = $this->parseProductUnits($request);

        $rules = [
            'category_id' => 'required|exists:categories,id',
            'barcode' => 'required|string|unique:products,barcode',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'product_type' => 'required|in:physical,ppob',
        ];

        if ($productType === 'physical') {
            $rules['buy_price'] = 'required|integer|min:0';
            $rules['stock'] = 'required|integer|min:0';
        } else {
            $rules['buy_price'] = 'nullable|integer|min:0';
            $rules['stock'] = 'nullable|integer|min:0';
        }

        $rules['image'] = 'nullable|image|mimes:jpeg,png,jpg|max:2048';

        $request->validate($rules);

        if ($productType === 'physical') {
            $openingBuyPrice = (int) $request->buy_price;
            $this->validateProductUnits($productUnits, $openingBuyPrice);
        }

        $imageName = null;

        if ($request->hasFile('image')) {
            $image = $request->file('image');
            $image->storeAs('products', $image->hashName(), 'public');
            $imageName = $image->hashName();
        }

        DB::transaction(function () use ($request, $productType, $productUnits, $imageName) {
            $stock = $productType === 'physical' ? (int) $request->stock : 0;
            $buyPrice = $productType === 'physical' ? (int) $request->buy_price : (int) ($request->buy_price ?? 0);
            $sellPrice = $productType === 'physical'
                ? $this->resolveDefaultSellPrice($productUnits)
                : 0;
            $baseAbbreviation = $productType === 'physical'
                ? $this->resolveBaseUnitAbbreviation($productUnits)
                : 'lembar';

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
            }
        });

        return redirect()->route('account.products.index');
    }

    public function edit($id)
    {
        $product = Product::with(['productUnits.unit'])->findOrFail($id);

        return Inertia::render('Account/Products/Edit', [
            'product' => $product,
            'categories' => Category::orderBy('name')->get(),
            'units' => Unit::orderBy('name')->get(),
        ]);
    }

    public function update(Request $request, $id)
    {
        $product = Product::findOrFail($id);
        $productType = $request->input('product_type', $product->product_type);
        $productUnits = $this->parseProductUnits($request);

        $rules = [
            'category_id' => 'required|exists:categories,id',
            'barcode' => 'required|string|unique:products,barcode,' . $id,
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'product_type' => 'required|in:physical,ppob',
            'image' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
        ];

        $request->validate($rules);

        if ($productType === 'physical') {
            $this->validateProductUnits($productUnits);
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

        DB::transaction(function () use ($product, $data, $productType, $productUnits) {
            $product->update($data);

            if ($productType === 'physical') {
                $this->syncProductUnits($product, $productUnits);
            } else {
                $product->productUnits()->delete();
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

    public function printBarcodes(Request $request)
    {
        $request->validate([
            'product_ids' => 'required|array',
            'product_ids.*' => 'exists:products,id',
        ]);

        $products = Product::whereIn('id', $request->product_ids)->get();

        return view('print.barcode', compact('products'));
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
}
