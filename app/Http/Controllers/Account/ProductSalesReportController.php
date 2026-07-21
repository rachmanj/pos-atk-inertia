<?php

namespace App\Http\Controllers\Account;

use App\Exports\ProductSalesReportExport;
use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\TransactionDetail;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class ProductSalesReportController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        abort_unless($user->can('reports.product_sales'), 403);

        $request->validate([
            'q' => 'nullable|string|max:100',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'category_id' => 'nullable|exists:categories,id',
            'cashier_id' => 'nullable|exists:users,id',
        ]);

        $startDate = $request->start_date
            ? Carbon::parse($request->start_date)->startOfDay()
            : Carbon::now()->startOfMonth();

        $endDate = $request->end_date
            ? Carbon::parse($request->end_date)->endOfDay()
            : Carbon::now()->endOfDay();

        // Sub-tab: selected category filter
        $categoryId = $request->category_id;

        $baseQuery = TransactionDetail::query()
            ->select([
                'transaction_details.product_id',
                DB::raw('SUM(transaction_details.qty) as total_qty'),
                DB::raw('SUM(transaction_details.subtotal) as total_omzet'),
                DB::raw('SUM(transaction_details.buy_price * transaction_details.qty) as total_cogs'),
            ])
            ->join('transactions', 'transaction_details.transaction_id', '=', 'transactions.id')
            ->join('products', 'transaction_details.product_id', '=', 'products.id')
            ->where('transactions.payment_status', 'paid')
            ->where('transactions.status', '!=', 'voided')
            ->whereBetween(
                DB::raw('COALESCE(transactions.paid_at, transactions.created_at)'),
                [$startDate, $endDate]
            )
            ->when(!$user->isAdminUser(), function (Builder $query) use ($user) {
                $query->where('transactions.cashier_id', $user->id);
            })
            ->when($user->isAdminUser() && filled($request->cashier_id), function (Builder $query) use ($request) {
                $query->where('transactions.cashier_id', $request->cashier_id);
            })
            ->when(filled($categoryId), function (Builder $query) use ($categoryId) {
                $query->where('products.category_id', $categoryId);
            })
            ->when(filled($request->q), function (Builder $query) use ($request) {
                $search = trim($request->q);
                $query->where(function (Builder $searchQuery) use ($search) {
                    $searchQuery->where('products.title', 'like', '%' . $search . '%')
                        ->orWhere('products.barcode', 'like', '%' . $search . '%');
                });
            })
            ->groupBy('transaction_details.product_id');

        $productSales = (clone $baseQuery)
            ->with(['product:id,title,barcode,unit,category_id', 'product.category:id,name'])
            ->orderByDesc('total_omzet')
            ->paginate(20)
            ->withQueryString();

        // Enrich data with laba = omzet - cogs, margin = laba/omzet
        $productSales->getCollection()->transform(function ($item) {
            $item->total_laba = (int) ($item->total_omzet - $item->total_cogs);
            $item->margin = $item->total_omzet > 0
                ? round(($item->total_laba / $item->total_omzet) * 100, 1)
                : 0;
            return $item;
        });

        // Summary totals
        $summaryQuery = TransactionDetail::query()
            ->join('transactions', 'transaction_details.transaction_id', '=', 'transactions.id')
            ->where('transactions.payment_status', 'paid')
            ->where('transactions.status', '!=', 'voided')
            ->whereBetween(
                DB::raw('COALESCE(transactions.paid_at, transactions.created_at)'),
                [$startDate, $endDate]
            )
            ->when(!$user->isAdminUser(), function (Builder $query) use ($user) {
                $query->where('transactions.cashier_id', $user->id);
            })
            ->when($user->isAdminUser() && filled($request->cashier_id), function (Builder $query) use ($request) {
                $query->where('transactions.cashier_id', $request->cashier_id);
            })
            ->when(filled($categoryId), function (Builder $query) use ($categoryId) {
                $query->join('products', 'transaction_details.product_id', '=', 'products.id')
                    ->where('products.category_id', $categoryId);
            });

        $totalOmzet = (int) (clone $summaryQuery)->sum('transaction_details.subtotal');
        $totalCogs = (int) ((clone $summaryQuery)
            ->selectRaw('SUM(transaction_details.buy_price * transaction_details.qty) as total')
            ->value('total') ?? 0);
        $totalLaba = $totalOmzet - $totalCogs;
        $totalQty = (int) (clone $summaryQuery)->sum('transaction_details.qty');

        return Inertia::render('Account/Reports/ProductSales', [
            'productSales' => $productSales,
            'summary' => [
                'total_omzet' => $totalOmzet,
                'total_cogs' => $totalCogs,
                'total_laba' => $totalLaba,
                'total_qty' => $totalQty,
                'margin' => $totalOmzet > 0 ? round(($totalLaba / $totalOmzet) * 100, 1) : 0,
            ],
            'filters' => [
                'q' => $request->q ?? '',
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'category_id' => $categoryId ?? '',
                'cashier_id' => $request->cashier_id ?? '',
            ],
            'categories' => Category::query()->orderBy('name')->get(['id', 'name']),
            'cashiers' => $user->isAdminUser()
                ? User::query()
                    ->whereHas('transactions')
                    ->orderBy('name')
                    ->get(['id', 'name'])
                : [],
            'isAdmin' => $user->isAdminUser(),
        ]);
    }

    public function export(Request $request)
    {
        $user = $request->user();

        abort_unless($user->can('reports.export'), 403);
        abort_unless($user->can('reports.product_sales'), 403);

        $request->validate([
            'q' => 'nullable|string|max:100',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'category_id' => 'nullable|exists:categories,id',
            'cashier_id' => 'nullable|exists:users,id',
        ]);

        $filters = [
            'q' => $request->q,
            'start_date' => $request->start_date ?: now()->startOfMonth()->toDateString(),
            'end_date' => $request->end_date ?: now()->toDateString(),
            'category_id' => $request->category_id,
            'cashier_id' => !$user->isAdminUser() ? $user->id : $request->cashier_id,
        ];

        return Excel::download(
            new ProductSalesReportExport($filters),
            'laporan-produk-terlaris-' . now()->format('Ymd_His') . '.xlsx'
        );
    }
}
