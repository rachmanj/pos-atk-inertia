<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Exports\SalesReportExport;
use App\Models\ReturnTransaction;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class SalesReportController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        abort_unless($user->can('reports.sales'), 403);

        $request->validate([
            'q' => 'nullable|string|max:100',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'payment_method' => 'nullable|in:cash,digital',
            'cashier_id' => 'nullable|exists:users,id',
        ]);

        $startDate = $request->start_date
            ? Carbon::parse($request->start_date)->startOfDay()
            : Carbon::now()->startOfMonth();

        $endDate = $request->end_date
            ? Carbon::parse($request->end_date)->endOfDay()
            : Carbon::now()->endOfDay();

        $baseQuery = Transaction::query();
        $this->applyFilters($baseQuery, $request, $user, $startDate, $endDate);

        $sales = (clone $baseQuery)
            ->select([
                'id',
                'cashier_id',
                'customer_id',
                'invoice',
                'discount',
                'grand_total',
                'payment_method',
                'paid_at',
                'created_at',
            ])
            ->with(['cashier:id,name', 'customer:id,name'])
            ->withSum('details as total_items', 'qty')
            ->orderByRaw('COALESCE(transactions.paid_at, transactions.created_at) DESC')
            ->latest('id')
            ->paginate(10)
            ->withQueryString();

        $summaryQuery = clone $baseQuery;
        $totalSales = (int) (clone $summaryQuery)->sum('grand_total');
        $returnsByMethod = $this->calculateApprovedReturnsGrouped($request, $user, $startDate, $endDate);
        $totalReturns = $returnsByMethod['total'];
        $netSales = max(0, $totalSales - $totalReturns);
        $totalTransactions = (int) (clone $summaryQuery)->count();
        $totalItems = (int) (clone $summaryQuery)
            ->join('transaction_details', 'transactions.id', '=', 'transaction_details.transaction_id')
            ->sum('transaction_details.qty');
        $cashGrossSales = (int) (clone $summaryQuery)
            ->where('payment_method', 'cash')
            ->sum('grand_total');
        $digitalGrossSales = (int) (clone $summaryQuery)
            ->where('payment_method', 'digital')
            ->sum('grand_total');

        // Chart data: sales by day
        $salesByDay = (clone $baseQuery)
            ->select(
                DB::raw('DATE(COALESCE(transactions.paid_at, transactions.created_at)) as date'),
                DB::raw('SUM(grand_total) as total'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy(DB::raw('DATE(COALESCE(transactions.paid_at, transactions.created_at))'))
            ->orderBy('date')
            ->get();

        // Chart data: sales by hour
        $salesByHour = (clone $baseQuery)
            ->select(
                DB::raw('HOUR(COALESCE(transactions.paid_at, transactions.created_at)) as hour'),
                DB::raw('SUM(grand_total) as total'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy(DB::raw('HOUR(COALESCE(transactions.paid_at, transactions.created_at))'))
            ->orderBy('hour')
            ->get();

        return Inertia::render('Account/Reports/Sales', [
            'sales' => $sales,
            'salesByDay' => $salesByDay,
            'salesByHour' => $salesByHour,
            'summary' => [
                'total_sales' => $totalSales,
                'total_returns' => $totalReturns,
                'net_sales' => $netSales,
                'total_discount' => (int) (clone $summaryQuery)->sum('discount'),
                'total_transactions' => $totalTransactions,
                'average_sale' => $totalTransactions > 0
                    ? (int) round($netSales / $totalTransactions)
                    : 0,
                'total_items' => $totalItems,
                'cash_sales' => max(0, $cashGrossSales - $returnsByMethod['cash']),
                'digital_sales' => max(0, $digitalGrossSales - $returnsByMethod['digital']),
            ],
            'filters' => [
                'q' => $request->q ?? '',
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'payment_method' => $request->payment_method ?? '',
                'cashier_id' => $request->cashier_id ?? '',
            ],
            'cashiers' => $user->isAdminUser()
                ? User::query()
                ->whereHas('transactions')
                ->orderBy('name')
                ->get(['id', 'name'])
                : [],
            'isAdmin' => $user->isAdminUser(),
        ]);
    }

    protected function applyFilters(
        Builder $query,
        Request $request,
        User $user,
        Carbon $startDate,
        Carbon $endDate
    ): void {
        $query
            ->where('payment_status', 'paid')
            ->where('status', '!=', 'voided')
            ->whereBetween(
                DB::raw('COALESCE(transactions.paid_at, transactions.created_at)'),
                [$startDate, $endDate]
            )
            ->when(!$user->isAdminUser(), function (Builder $transactionQuery) use ($user) {
                $transactionQuery->where('cashier_id', $user->id);
            })
            ->when($user->isAdminUser() && filled($request->cashier_id), function (Builder $transactionQuery) use ($request) {
                $transactionQuery->where('cashier_id', $request->cashier_id);
            })
            ->when(filled($request->payment_method), function (Builder $transactionQuery) use ($request) {
                $transactionQuery->where('payment_method', $request->payment_method);
            })
            ->when(filled($request->q), function (Builder $transactionQuery) use ($request) {
                $search = trim($request->q);

                $transactionQuery->where(function (Builder $searchQuery) use ($search) {
                    $searchQuery->where('invoice', 'like', '%' . $search . '%')
                        ->orWhereHas('cashier', function (Builder $cashierQuery) use ($search) {
                            $cashierQuery->where('name', 'like', '%' . $search . '%');
                        })
                        ->orWhereHas('customer', function (Builder $customerQuery) use ($search) {
                            $customerQuery->where('name', 'like', '%' . $search . '%');
                        });
                });
            });
    }

    protected function calculateApprovedReturnsGrouped(
        Request $request,
        User $user,
        Carbon $startDate,
        Carbon $endDate,
    ): array {
        $filteredPaymentMethod = filled($request->payment_method) ? $request->payment_method : null;

        $rows = ReturnTransaction::query()
            ->join('transactions', 'transactions.id', '=', 'return_transactions.transaction_id')
            ->where('return_transactions.status', 'approved')
            ->whereBetween('return_transactions.updated_at', [$startDate, $endDate])
            ->where('transactions.payment_status', 'paid')
            ->where('transactions.status', '!=', 'voided')
            ->when(!$user->isAdminUser(), function (Builder $query) use ($user) {
                $query->where('transactions.cashier_id', $user->id);
            })
            ->when($user->isAdminUser() && filled($request->cashier_id), function (Builder $query) use ($request) {
                $query->where('transactions.cashier_id', $request->cashier_id);
            })
            ->when(filled($filteredPaymentMethod), function (Builder $query) use ($filteredPaymentMethod) {
                $query->where('transactions.payment_method', $filteredPaymentMethod);
            })
            ->select('transactions.payment_method', DB::raw('SUM(return_transactions.total_refund) as total_refund'))
            ->groupBy('transactions.payment_method')
            ->pluck('total_refund', 'payment_method');

        return [
            'total' => (int) $rows->sum(),
            'cash' => (int) ($rows['cash'] ?? 0),
            'digital' => (int) ($rows['digital'] ?? 0),
            'qris' => (int) ($rows['qris'] ?? 0),
            'transfer' => (int) ($rows['transfer'] ?? 0),
        ];
    }

    protected function calculateApprovedReturns(
        Request $request,
        User $user,
        Carbon $startDate,
        Carbon $endDate,
        ?string $paymentMethod = null
    ): int {
        if ($paymentMethod && filled($request->payment_method) && $request->payment_method !== $paymentMethod) {
            return 0;
        }

        $filteredPaymentMethod = $paymentMethod ?: $request->payment_method;

        return (int) ReturnTransaction::query()
            ->where('status', 'approved')
            ->whereBetween('updated_at', [$startDate, $endDate])
            ->whereHas('transaction', function (Builder $transactionQuery) use ($request, $user, $filteredPaymentMethod) {
                $transactionQuery
                    ->where('payment_status', 'paid')
                    ->where('status', '!=', 'voided')
                    ->when(!$user->isAdminUser(), function (Builder $scopedQuery) use ($user) {
                        $scopedQuery->where('cashier_id', $user->id);
                    })
                    ->when($user->isAdminUser() && filled($request->cashier_id), function (Builder $scopedQuery) use ($request) {
                        $scopedQuery->where('cashier_id', $request->cashier_id);
                    })
                    ->when(filled($filteredPaymentMethod), function (Builder $scopedQuery) use ($filteredPaymentMethod) {
                        $scopedQuery->where('payment_method', $filteredPaymentMethod);
                    });
            })
            ->sum('total_refund');
    }

    public function export(Request $request)
    {
        $user = $request->user();

        abort_unless($user->can('reports.export'), 403);

        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'payment_method' => 'nullable|in:cash,digital',
            'cashier_id' => 'nullable|exists:users,id',
        ]);

        $filters = [
            'start_date' => $request->start_date ?: now()->startOfMonth()->toDateString(),
            'end_date' => $request->end_date ?: now()->toDateString(),
            'payment_method' => $request->payment_method,
            'cashier_id' => !$user->isAdminUser() ? $user->id : $request->cashier_id,
        ];

        return Excel::download(
            new SalesReportExport($filters),
            'laporan-penjualan-' . now()->format('Ymd_His') . '.xlsx'
        );
    }
}
