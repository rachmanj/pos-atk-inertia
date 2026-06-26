<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\StockOpname;
use App\Models\StockOpnameDetail;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class StockOpnameController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        abort_unless($user->can('stock_opnames.index'), 403);

        $request->validate([
            'q'          => 'nullable|string|max:100',
            'start_date' => 'nullable|date',
            'end_date'   => 'nullable|date|after_or_equal:start_date',
        ]);

        $startDate = $request->start_date
            ? Carbon::parse($request->start_date)->startOfDay()
            : Carbon::now()->startOfMonth();

        $endDate = $request->end_date
            ? Carbon::parse($request->end_date)->endOfDay()
            : Carbon::now()->endOfDay();

        $stockOpnames = StockOpname::query()
            ->with('user:id,name')
            ->when(!$user->isAdminUser(), function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->whereBetween('opname_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->when(filled($request->q), function ($query) use ($request) {
                $search = trim($request->q);

                $query->where(function ($subQuery) use ($search) {
                    $subQuery->where('code', 'like', '%' . $search . '%')
                        ->orWhere('note', 'like', '%' . $search . '%')
                        ->orWhereHas('user', function ($userQuery) use ($search) {
                            $userQuery->where('name', 'like', '%' . $search . '%');
                        });
                });
            })
            ->latest('opname_date')
            ->latest('id')
            ->paginate(10);

        $stockOpnames->appends([
            'q'          => $request->q,
            'start_date' => $startDate->toDateString(),
            'end_date'   => $endDate->toDateString(),
        ]);

        return Inertia::render('Account/StockOpnames/Index', [
            'stockOpnames' => $stockOpnames,
            'filters' => [
                'q'          => $request->q ?? '',
                'start_date' => $startDate->toDateString(),
                'end_date'   => $endDate->toDateString(),
            ],
        ]);
    }

    public function create(Request $request)
    {
        abort_unless($request->user()->can('stock_opnames.create'), 403);

        return Inertia::render('Account/StockOpnames/Create', [
            'products' => Product::query()
                ->orderBy('title')
                ->get(['id', 'title', 'barcode', 'stock', 'unit']),
            'defaultOpnameDate' => now()->toDateString(),
        ]);
    }

    public function store(Request $request)
    {
        abort_unless($request->user()->can('stock_opnames.create'), 403);

        $request->validate([
            'opname_date'            => 'required|date',
            'note'                   => 'nullable|string|max:1000',
            'items'                  => 'required|array|min:1',
            'items.*.product_id'     => 'required|exists:products,id',
            'items.*.physical_stock' => 'required|integer|min:0',
            'items.*.note'           => 'nullable|string|max:255',
        ]);

        $items = collect($request->items)
            ->map(function ($item) {
                return [
                    'product_id'     => (int) $item['product_id'],
                    'physical_stock' => (int) $item['physical_stock'],
                    'note'           => filled($item['note'] ?? null) ? trim($item['note']) : null,
                ];
            })
            ->filter(fn($item) => $item['product_id'] > 0)
            ->values();

        if ($items->isEmpty()) {
            throw ValidationException::withMessages([
                'items' => 'Tambahkan minimal satu produk untuk stock opname.',
            ]);
        }

        if ($items->pluck('product_id')->unique()->count() !== $items->count()) {
            throw ValidationException::withMessages([
                'items' => 'Produk dalam stock opname tidak boleh duplikat.',
            ]);
        }

        $stockOpname = DB::transaction(function () use ($request, $items) {
            $lockedProducts = Product::query()
                ->whereIn('id', $items->pluck('product_id')->all())
                ->orderBy('id')
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            $preparedItems = [];

            foreach ($items as $item) {
                $product = $lockedProducts->get($item['product_id']);

                if (!$product) {
                    throw ValidationException::withMessages([
                        'items' => 'Terdapat produk yang tidak valid pada stock opname.',
                    ]);
                }

                $systemStock = (int) $product->stock;
                $differenceQty = $item['physical_stock'] - $systemStock;

                $preparedItems[] = [
                    'product'        => $product,
                    'system_stock'   => $systemStock,
                    'physical_stock' => $item['physical_stock'],
                    'difference_qty' => $differenceQty,
                    'note'           => $item['note'],
                ];
            }

            $stockOpname = StockOpname::create([
                'user_id'              => $request->user()->id,
                'code'                 => $this->generateCode(),
                'opname_date'          => $request->opname_date,
                'total_items'          => count($preparedItems),
                'total_difference_qty' => collect($preparedItems)->sum('difference_qty'),
                'note'                 => filled($request->note) ? trim($request->note) : null,
            ]);

            foreach ($preparedItems as $item) {
                StockOpnameDetail::create([
                    'stock_opname_id' => $stockOpname->id,
                    'product_id'      => $item['product']->id,
                    'system_stock'    => $item['system_stock'],
                    'physical_stock'  => $item['physical_stock'],
                    'difference_qty'  => $item['difference_qty'],
                    'note'            => $item['note'],
                ]);

                if ($item['difference_qty'] !== 0) {
                    $item['product']->update([
                        'stock' => $item['physical_stock'],
                    ]);

                    StockMovement::create([
                        'product_id'     => $item['product']->id,
                        'user_id'        => $request->user()->id,
                        'type'           => 'adjustment',
                        'qty'            => abs($item['difference_qty']),
                        'stock_before'   => $item['system_stock'],
                        'stock_after'    => $item['physical_stock'],
                        'reference_type' => StockOpname::class,
                        'reference_id'   => $stockOpname->id,
                        'note'           => 'Stock opname ' . $stockOpname->code,
                    ]);
                }
            }

            return $stockOpname;
        });

        return redirect()
            ->route('account.stock-opnames.show', $stockOpname->code)
            ->with('success', 'Stock opname berhasil disimpan.');
    }

    public function show(Request $request, $code)
    {
        $user = $request->user();

        abort_unless($user->can('stock_opnames.show'), 403);

        $stockOpname = StockOpname::query()
            ->with([
                'user:id,name',
                'details.product:id,title,barcode,unit',
            ])
            ->where('code', $code)
            ->when(!$user->isAdminUser(), function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->firstOrFail();

        return Inertia::render('Account/StockOpnames/Show', [
            'stockOpname' => $stockOpname,
        ]);
    }

    protected function generateCode(): string
    {
        do {
            $code = 'OPN-' . now()->format('Ymd') . '-' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 6));
        } while (StockOpname::where('code', $code)->exists());

        return $code;
    }
}
