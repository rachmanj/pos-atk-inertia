<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class QuickProductService
{
    public const MAX_QUICK_PRODUCTS = 12;

    public function pinned(): Collection
    {
        return Product::query()
            ->with(['defaultSellUnit.unit', 'productUnits.unit', 'components.componentProduct'])
            ->where('is_quick_access', true)
            ->where('is_active', true)
            ->orderBy('quick_access_order')
            ->orderBy('title')
            ->get();
    }

    public function auto(): Collection
    {
        $pinnedIds = Product::query()
            ->where('is_quick_access', true)
            ->where('is_active', true)
            ->pluck('id');

        $since = Carbon::now()->subDays(30);

        $salesSubquery = DB::table('transaction_details')
            ->join('transactions', 'transactions.id', '=', 'transaction_details.transaction_id')
            ->where('transactions.status', '!=', 'voided')
            ->where('transactions.created_at', '>=', $since)
            ->select('transaction_details.product_id', DB::raw('SUM(transaction_details.qty) as sales_qty'))
            ->groupBy('transaction_details.product_id');

        return Product::query()
            ->with(['defaultSellUnit.unit', 'productUnits.unit', 'components.componentProduct'])
            ->joinSub($salesSubquery, 'sales', function ($join) {
                $join->on('products.id', '=', 'sales.product_id');
            })
            ->where('products.is_active', true)
            ->where('products.product_type', '!=', 'ppob')
            ->when($pinnedIds->isNotEmpty(), fn ($query) => $query->whereNotIn('products.id', $pinnedIds))
            ->select('products.*', 'sales.sales_qty')
            ->orderByDesc('sales.sales_qty')
            ->orderBy('products.title')
            ->limit(self::MAX_QUICK_PRODUCTS)
            ->get();
    }

    public function forPos(): array
    {
        $pinned = $this->pinned();
        $remaining = max(0, self::MAX_QUICK_PRODUCTS - $pinned->count());
        $auto = $remaining > 0 ? $this->auto()->take($remaining) : collect();

        return $pinned
            ->concat($auto)
            ->map(fn (Product $product) => $this->formatForPos($product))
            ->values()
            ->all();
    }

    protected function formatForPos(Product $product): array
    {
        $defaultUnit = $product->defaultSellUnit;
        $units = $product->productUnits;

        return [
            'id' => $product->id,
            'title' => $product->title,
            'product_type' => $product->product_type,
            'sell_price' => (int) ($defaultUnit?->sell_price ?? $product->sell_price),
            'unit_count' => $units->count(),
            'stock' => (int) $product->stock,
            'default_sell_unit' => $defaultUnit ? [
                'unit_id' => $defaultUnit->unit_id,
                'sell_price' => (int) $defaultUnit->sell_price,
                'is_default_sell' => (bool) $defaultUnit->is_default_sell,
                'unit' => $defaultUnit->unit ? [
                    'id' => $defaultUnit->unit->id,
                    'name' => $defaultUnit->unit->name,
                    'abbreviation' => $defaultUnit->unit->abbreviation,
                ] : null,
            ] : null,
            'product_units' => $units->map(fn ($unit) => [
                'unit_id' => $unit->unit_id,
                'sell_price' => (int) $unit->sell_price,
                'is_default_sell' => (bool) $unit->is_default_sell,
                'is_base_unit' => (bool) $unit->is_base_unit,
                'conversion_factor' => (float) $unit->conversion_factor,
                'unit' => $unit->unit ? [
                    'id' => $unit->unit->id,
                    'name' => $unit->unit->name,
                    'abbreviation' => $unit->unit->abbreviation,
                ] : null,
            ])->values()->all(),
            'components' => $product->components->map(fn ($row) => [
                'qty_per_unit' => (float) $row->qty_per_unit,
                'component_product' => $row->componentProduct ? [
                    'id' => $row->componentProduct->id,
                    'stock' => (int) $row->componentProduct->stock,
                ] : null,
            ])->values()->all(),
        ];
    }
}
