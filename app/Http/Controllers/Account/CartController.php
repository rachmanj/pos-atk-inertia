<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCartRequest;
use App\Http\Requests\UpdateCartRequest;
use App\Models\Cart;
use App\Models\Product;
use Illuminate\Http\Request;

class CartController extends Controller
{
    public function store(StoreCartRequest $request)
    {
        $user = $request->user();

        if (!$user->activeCashierShift) {
            return back()->with('error', 'Buka shift kasir terlebih dahulu sebelum menambah produk.');
        }

        $product = Product::query()
            ->with(['productUnits.unit'])
            ->where('id', $request->product_id)
            ->where('is_active', true)
            ->firstOrFail();

        if ($product->isPpob()) {
            return $this->storePpobCart($request, $user, $product);
        }

        if ($product->isService()) {
            return $this->storeServiceCart($request, $user, $product);
        }

        return $this->storePhysicalCart($request, $user, $product);
    }

    public function update(UpdateCartRequest $request, Cart $cart)
    {
        $this->authorizeCartOwner($request, $cart);

        $product = Product::with(['productUnits'])->findOrFail($cart->product_id);
        $qty = (int) $request->qty;
        $discountPayload = $this->discountPayload($request, $cart);

        if ($product->isPpob() || $product->isService()) {
            $payload = array_merge(['qty' => $qty], $discountPayload);

            if ($product->isService()) {
                $productUnit = $product->productUnits->firstWhere('unit_id', $cart->unit_id)
                    ?? $product->productUnits->firstWhere('is_default_sell', true);

                $payload['price'] = $productUnit?->sell_price ?? $product->sell_price;
            }

            $cart->update($payload);

            return back();
        }

        $conversionFactor = $this->resolveConversionFactor($product, $cart->unit_id);
        $qtyInBase = (int) round($qty * $conversionFactor);

        if ($qtyInBase > (int) $product->stock) {
            return back()->with('error', 'Qty keranjang melebihi stok tersedia.');
        }

        $productUnit = $product->productUnits->firstWhere('unit_id', $cart->unit_id);

        $cart->update(array_merge([
            'qty' => $qty,
            'price' => $productUnit?->sell_price ?? $product->sell_price,
        ], $discountPayload));

        return back();
    }

    public function destroy(Request $request, Cart $cart)
    {
        $this->authorizeCartOwner($request, $cart);

        $cart->delete();

        return back();
    }

    public function hold(Request $request, Cart $cart)
    {
        $this->authorizeCartOwner($request, $cart);

        $request->validate([
            'is_held' => 'required|boolean',
        ]);

        $cart->update([
            'is_held' => $request->boolean('is_held'),
        ]);

        return back();
    }

    protected function storePhysicalCart(Request $request, $user, Product $product)
    {
        if ((int) $product->stock < 1) {
            return back()->with('error', 'Stok produk habis.');
        }

        $unitId = (int) ($request->unit_id ?: $product->defaultSellUnit?->unit_id);

        $productUnit = $product->productUnits->first(function ($row) use ($unitId) {
            return $unitId > 0 ? $row->unit_id === $unitId : $row->is_default_sell;
        }) ?? $product->productUnits->firstWhere('is_default_sell', true);

        if (!$productUnit) {
            return back()->with('error', 'Satuan jual produk belum dikonfigurasi.');
        }

        $conversionFactor = (float) $productUnit->conversion_factor;

        $cart = Cart::query()
            ->where('cashier_id', $user->id)
            ->where('product_id', $product->id)
            ->where('unit_id', $productUnit->unit_id)
            ->whereNull('ppob_cost')
            ->where('is_held', false)
            ->first();

        $nextQty = (int) ($cart?->qty ?? 0) + 1;
        $qtyInBase = (int) round($nextQty * $conversionFactor);

        if ($qtyInBase > (int) $product->stock) {
            return back()->with('error', 'Qty keranjang melebihi stok tersedia.');
        }

        Cart::updateOrCreate(
            [
                'cashier_id' => $user->id,
                'product_id' => $product->id,
                'unit_id' => $productUnit->unit_id,
                'ppob_cost' => null,
            ],
            [
                'qty' => $nextQty,
                'price' => (int) $productUnit->sell_price,
                'customer_ref' => null,
                'admin_fee' => null,
            ],
        );

        return back();
    }

    protected function storeServiceCart(Request $request, $user, Product $product)
    {
        $product->loadMissing(['productUnits', 'components.componentProduct']);

        $unitId = (int) ($request->unit_id ?: $product->defaultSellUnit?->unit_id);

        $productUnit = $product->productUnits->first(function ($row) use ($unitId) {
            return $unitId > 0 ? $row->unit_id === $unitId : $row->is_default_sell;
        }) ?? $product->productUnits->firstWhere('is_default_sell', true);

        if (!$productUnit) {
            return back()->with('error', 'Satuan jual layanan belum dikonfigurasi.');
        }

        if ($product->components->isEmpty()) {
            return back()->with('error', 'Resep bahan baku layanan belum dikonfigurasi.');
        }

        $cart = Cart::query()
            ->where('cashier_id', $user->id)
            ->where('product_id', $product->id)
            ->where('unit_id', $productUnit->unit_id)
            ->whereNull('ppob_cost')
            ->where('is_held', false)
            ->first();

        $nextQty = (int) ($cart?->qty ?? 0) + 1;

        Cart::updateOrCreate(
            [
                'cashier_id' => $user->id,
                'product_id' => $product->id,
                'unit_id' => $productUnit->unit_id,
                'ppob_cost' => null,
            ],
            [
                'qty' => $nextQty,
                'price' => (int) $productUnit->sell_price,
                'customer_ref' => null,
                'admin_fee' => null,
            ],
        );

        return back();
    }

    protected function storePpobCart(StoreCartRequest $request, $user, Product $product)
    {
        $ppobCost = (int) $request->ppob_cost;
        $adminFee = (int) $request->admin_fee;

        Cart::create([
            'cashier_id' => $user->id,
            'product_id' => $product->id,
            'unit_id' => null,
            'qty' => 1,
            'price' => $ppobCost + $adminFee,
            'customer_ref' => filled($request->customer_ref) ? trim($request->customer_ref) : null,
            'ppob_cost' => $ppobCost,
            'admin_fee' => $adminFee,
        ]);

        return back();
    }

    protected function resolveConversionFactor(Product $product, ?int $unitId): float
    {
        if (!$unitId) {
            return 1;
        }

        $productUnit = $product->productUnits->firstWhere('unit_id', $unitId);

        return (float) ($productUnit?->conversion_factor ?? 1);
    }

    protected function authorizeCartOwner(Request $request, Cart $cart): void
    {
        if ($cart->cashier_id !== $request->user()->id) {
            abort(403);
        }
    }

    protected function discountPayload(UpdateCartRequest $request, Cart $cart): array
    {
        if (!$request->exists('discount') && !$request->exists('discount_type')) {
            return [];
        }

        return [
            'discount' => (int) ($request->input('discount', $cart->discount ?? 0)),
            'discount_type' => $request->input('discount_type', $cart->discount_type ?? 'nominal'),
        ];
    }
}
