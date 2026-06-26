<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class StockMovementController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        abort_unless($user->can('stock_movements.index'), 403);

        $stockMovements = StockMovement::with([
            'product:id,title,barcode,unit',
            'user:id,name',
        ])
            ->when(!$user->isAdminUser(), function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->when($request->q, function ($query) use ($request) {
                $query->where(function ($subQuery) use ($request) {
                    $subQuery->where('note', 'like', '%' . $request->q . '%')
                        ->orWhereHas('product', function ($productQuery) use ($request) {
                            $productQuery->where('title', 'like', '%' . $request->q . '%')
                                ->orWhere('barcode', 'like', '%' . $request->q . '%');
                        })
                        ->orWhereHas('user', function ($userQuery) use ($request) {
                            $userQuery->where('name', 'like', '%' . $request->q . '%');
                        });
                });
            })
            ->when($request->type, function ($query) use ($request) {
                $query->where('type', $request->type);
            })
            ->latest()
            ->paginate(10);

        $stockMovements->appends([
            'q' => $request->q,
            'type' => $request->type,
        ]);

        $stockMovements->getCollection()->transform(function ($movement) {
            $movement->source_label = $this->resolveSourceLabel($movement->reference_type);

            return $movement;
        });

        return Inertia::render('Account/StockMovements/Index', [
            'stockMovements' => $stockMovements,
            'filters' => [
                'q' => $request->q ?? '',
                'type' => $request->type ?? '',
            ],
        ]);
    }

    public function create(Request $request)
    {
        abort_unless($request->user()->can('stock_movements.create'), 403);

        $products = Product::orderBy('title')
            ->get(['id', 'title', 'barcode', 'stock', 'unit']);

        $selectedProductId = $products->contains('id', (int) $request->product_id)
            ? (int) $request->product_id
            : $products->value('id');

        return Inertia::render('Account/StockMovements/Create', [
            'products'          => $products,
            'selectedProductId' => $selectedProductId,
        ]);
    }

    public function store(Request $request)
    {
        abort_unless($request->user()->can('stock_movements.create'), 403);

        $request->validate([
            'product_id'   => 'required|exists:products,id',
            'type'         => 'nullable|in:adjustment',
            'target_stock' => 'required|integer|min:0',
            'note'         => 'required|string|max:1000',
        ]);

        DB::transaction(function () use ($request) {
            $product = Product::query()
                ->lockForUpdate()
                ->findOrFail($request->product_id);

            $stockBefore = (int) $product->stock;
            $targetStock = (int) $request->target_stock;

            if ($targetStock === $stockBefore) {
                throw ValidationException::withMessages([
                    'target_stock' => 'Target stok harus berbeda dari stok saat ini.',
                ]);
            }

            $qty = abs($targetStock - $stockBefore);

            $product->update([
                'stock' => $targetStock,
            ]);

            StockMovement::create([
                'product_id'     => $product->id,
                'user_id'        => $request->user()->id,
                'type'           => 'adjustment',
                'qty'            => $qty,
                'stock_before'   => $stockBefore,
                'stock_after'    => $targetStock,
                'reference_type' => null,
                'reference_id'   => null,
                'note'           => trim($request->note),
            ]);
        });

        return redirect()
            ->route('account.stock-movements.index')
            ->with('success', 'Penyesuaian stok berhasil disimpan.');
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
}
