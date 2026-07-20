<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Exports\StockReportExport;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class StockReportController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        abort_unless($user->can('reports.stock'), 403);

        $request->validate([
            'q'             => 'nullable|string|max:100',
            'category_id'   => 'nullable|exists:categories,id',
            'stock_status'  => 'nullable|in:available,low,out,dead_stock',
            'low_threshold' => 'nullable|integer|min:1|max:1000',
            'dead_stock_days' => 'nullable|integer|min:1|max:3650',
        ]);

        $lowThreshold = (int) ($request->low_threshold ?: 10);
        $deadStockDays = (int) ($request->dead_stock_days ?: 90);

        $baseQuery = Product::query()->physical();
        $this->applyFilters($baseQuery, $request, $lowThreshold, $deadStockDays);

        // Load last OUT movement date for dead stock calculation
        $products = (clone $baseQuery)
            ->with([
                'category:id,name',
                'baseUnit.unit',
                'latestStockMovement.user:id,name',
                'latestStockMovement',
            ])
            ->orderBy('title')
            ->paginate(10)
            ->withQueryString();

        $products->through(function (Product $product) use ($deadStockDays) {
            $baseSellPrice = (int) ($product->baseUnit?->sell_price ?? $product->sell_price);
            $inventoryCostValue = (int) $product->stock * (int) $product->avg_cost;
            $inventorySellValue = (int) $product->stock * $baseSellPrice;
            $latestMovement = $product->latestStockMovement;

            // Cari pergerakan OUT terakhir untuk dead stock
            $lastOutMovement = \App\Models\StockMovement::query()
                ->where('product_id', $product->id)
                ->where('type', 'out')
                ->orderBy('created_at', 'desc')
                ->first();

            $daysSinceLastOut = null;
            $isDeadStock = false;

            if ($lastOutMovement) {
                $daysSinceLastOut = (int) Carbon::now()->diffInDays($lastOutMovement->created_at);
                $isDeadStock = $daysSinceLastOut > $deadStockDays && (int) $product->stock > 0;
            } elseif ((int) $product->stock > 0) {
                // Belum pernah ada pergerakan OUT, anggap dead stock
                $daysSinceLastOut = null; // never
                $isDeadStock = (int) $product->stock > 0;
            }

            $needsReorder = (int) $product->stock <= $lowThreshold && (int) $product->stock > 0;

            return [
                'id'                    => $product->id,
                'title'                 => $product->title,
                'barcode'               => $product->barcode,
                'unit'                  => $product->unit,
                'stock'                 => $product->stock,
                'avg_cost'              => $product->avg_cost,
                'buy_price'             => $product->buy_price,
                'sell_price'            => $baseSellPrice,
                'is_active'             => $product->is_active,
                'category'              => $product->category,
                'inventory_cost_value'  => $inventoryCostValue,
                'inventory_sell_value'  => $inventorySellValue,
                'days_since_last_out'   => $daysSinceLastOut,
                'is_dead_stock'         => $isDeadStock,
                'needs_reorder'         => $needsReorder,
                'latest_movement'       => $latestMovement ? [
                    'type'         => $latestMovement->type,
                    'source_label' => $this->resolveSourceLabel($latestMovement->reference_type),
                    'note'         => $latestMovement->note,
                    'created_at'   => $latestMovement->created_at,
                    'user'         => $latestMovement->user,
                ] : null,
            ];
        });

        $summaryQuery = clone $baseQuery;

        $totalProducts = (clone $summaryQuery)->count();
        $activeProducts = (clone $summaryQuery)->where('is_active', true)->count();
        $totalStockQty = (int) (clone $summaryQuery)->sum('stock');
        $outOfStockProducts = (clone $summaryQuery)->where('stock', 0)->count();
        $lowStockProducts = (clone $summaryQuery)
            ->where('stock', '>', 0)
            ->where('stock', '<=', $lowThreshold)
            ->count();

        $inventoryCostValue = (int) ((clone $summaryQuery)
            ->selectRaw('COALESCE(SUM(stock * avg_cost), 0) as aggregate')
            ->value('aggregate') ?? 0);

        $filteredProductIds = (clone $summaryQuery)->pluck('id');

        $inventorySellValue = 0;

        if ($filteredProductIds->isNotEmpty()) {
            $inventorySellValue = (int) (DB::table('products')
                ->join('product_units', function ($join) {
                    $join->on('products.id', '=', 'product_units.product_id')
                        ->where('product_units.is_base_unit', true);
                })
                ->whereIn('products.id', $filteredProductIds)
                ->selectRaw('COALESCE(SUM(products.stock * product_units.sell_price), 0) as aggregate')
                ->value('aggregate') ?? 0);
        }

        return Inertia::render('Account/Reports/Stock', [
            'products' => $products,
            'summary' => [
                'total_products'        => $totalProducts,
                'active_products'       => $activeProducts,
                'total_stock_qty'       => $totalStockQty,
                'out_of_stock_products' => $outOfStockProducts,
                'low_stock_products'    => $lowStockProducts,
                'inventory_cost_value'  => $inventoryCostValue,
                'inventory_sell_value'  => $inventorySellValue,
            ],
            'filters' => [
                'q'             => $request->q ?? '',
                'category_id'   => $request->category_id ?? '',
                'stock_status'  => $request->stock_status ?? '',
                'low_threshold' => $lowThreshold,
                'dead_stock_days' => $deadStockDays,
            ],
            'categories' => Category::query()
                ->orderBy('name')
                ->get(['id', 'name']),
        ]);
    }

    protected function applyFilters(Builder $query, Request $request, int $lowThreshold, int $deadStockDays): void
    {
        $query
            ->when(filled($request->q), function (Builder $productQuery) use ($request) {
                $search = trim($request->q);

                $productQuery->where(function (Builder $searchQuery) use ($search) {
                    $searchQuery->where('title', 'like', '%' . $search . '%')
                        ->orWhere('barcode', 'like', '%' . $search . '%')
                        ->orWhereHas('category', function (Builder $categoryQuery) use ($search) {
                            $categoryQuery->where('name', 'like', '%' . $search . '%');
                        });
                });
            })
            ->when(filled($request->category_id), function (Builder $productQuery) use ($request) {
                $productQuery->where('category_id', $request->category_id);
            })
            ->when(filled($request->stock_status), function (Builder $productQuery) use ($request, $lowThreshold, $deadStockDays) {
                if ($request->stock_status === 'available') {
                    $productQuery->where('stock', '>', $lowThreshold);
                }

                if ($request->stock_status === 'low') {
                    $productQuery->where('stock', '>', 0)
                        ->where('stock', '<=', $lowThreshold);
                }

                if ($request->stock_status === 'out') {
                    $productQuery->where('stock', 0);
                }

                if ($request->stock_status === 'dead_stock') {
                    $productQuery->where('stock', '>', 0)
                        ->where(function (Builder $q) use ($deadStockDays) {
                            $q->whereDoesntHave('stockMovements', function (Builder $mq) {
                                $mq->where('type', 'out');
                            })->orWhereHas('stockMovements', function (Builder $mq) use ($deadStockDays) {
                                $mq->where('type', 'out');
                            }, '<', 1);
                        });
                }
            });
    }

    protected function resolveSourceLabel(?string $referenceType): string
    {
        if (empty($referenceType)) {
            return 'Manual';
        }

        if (str_contains($referenceType, 'ReturnTransaction')) {
            return 'Retur';
        }

        if (str_contains($referenceType, 'Purchase')) {
            return 'Pembelian';
        }

        if (str_contains($referenceType, 'StockOpname')) {
            return 'Stock Opname';
        }

        if (str_contains($referenceType, 'Transaction')) {
            return 'Penjualan';
        }

        return class_basename($referenceType);
    }

    public function export(Request $request)
    {
        $user = $request->user();

        abort_unless($user->can('reports.export'), 403);

        $request->validate([
            'q' => 'nullable|string|max:100',
            'category_id' => 'nullable|exists:categories,id',
            'stock_status' => 'nullable|in:available,low,out,dead_stock',
            'low_threshold' => 'nullable|integer|min:1|max:1000',
        ]);

        $filters = [
            'q' => $request->q,
            'category_id' => $request->category_id,
            'stock_status' => $request->stock_status,
            'low_threshold' => $request->low_threshold ?: 10,
            'dead_stock_days' => $request->dead_stock_days ?: 90,
        ];

        return Excel::download(
            new StockReportExport($filters),
            'laporan-stok-' . now()->format('Ymd_His') . '.xlsx'
        );
    }
}
