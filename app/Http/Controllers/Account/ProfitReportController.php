<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\Profit;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ProfitReportController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        abort_unless($user->can('profits.index'), 403);

        $request->validate([
            'q' => 'nullable|string|max:100',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'cashier_id' => 'nullable|exists:users,id',
        ]);

        $startDate = $request->start_date
            ? Carbon::parse($request->start_date)->startOfDay()
            : Carbon::now()->startOfMonth();

        $endDate = $request->end_date
            ? Carbon::parse($request->end_date)->endOfDay()
            : Carbon::now()->endOfDay();

        $baseQuery = Profit::query();
        $this->applyProfitFilters($baseQuery, $request, $user, $startDate, $endDate);

        $profits = (clone $baseQuery)
            ->with([
                'transaction:id,invoice,cashier_id,customer_id,payment_method,paid_at,created_at',
                'transaction.cashier:id,name',
                'transaction.customer:id,name',
            ])
            ->whereHas('transaction')
            ->orderByRaw('(select COALESCE(transactions.paid_at, transactions.created_at) from transactions where transactions.id = profits.transaction_id) DESC')
            ->latest('id')
            ->paginate(10)
            ->withQueryString();

        $summaryQuery = clone $baseQuery;
        $totalRevenue = (int) (clone $summaryQuery)->sum('total_revenue');
        $totalCost = (int) (clone $summaryQuery)->sum('total_cost');
        $grossProfit = (int) (clone $summaryQuery)->sum('profit_amount');
        $totalExpense = $this->calculateExpenses($request, $user, $startDate, $endDate);

        return Inertia::render('Account/Reports/Profit', [
            'profits' => $profits,
            'summary' => [
                'total_revenue' => $totalRevenue,
                'total_cost' => $totalCost,
                'gross_profit' => $grossProfit,
                'total_expense' => $totalExpense,
                'net_profit' => $grossProfit - $totalExpense,
                'total_transactions' => (int) (clone $summaryQuery)->count(),
                'profit_margin' => $totalRevenue > 0
                    ? round(($grossProfit / $totalRevenue) * 100, 2)
                    : 0,
            ],
            'filters' => [
                'q' => $request->q ?? '',
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'cashier_id' => $request->cashier_id ?? '',
            ],
            'cashiers' => $user->isAdminUser()
                ? User::query()
                ->where(function (Builder $query) {
                    $query->whereHas('transactions')
                        ->orWhereHas('expenses');
                })
                ->orderBy('name')
                ->get(['id', 'name'])
                : [],
            'isAdmin' => $user->isAdminUser(),
        ]);
    }

    protected function applyProfitFilters(
        Builder $query,
        Request $request,
        User $user,
        Carbon $startDate,
        Carbon $endDate
    ): void {
        $query->whereHas('transaction', function (Builder $transactionQuery) use ($request, $user, $startDate, $endDate) {
            $transactionQuery
                ->where('payment_status', 'paid')
                ->where('status', '!=', 'voided')
                ->whereBetween(
                    DB::raw('COALESCE(transactions.paid_at, transactions.created_at)'),
                    [$startDate, $endDate]
                )
                ->when(!$user->isAdminUser(), function (Builder $scopedQuery) use ($user) {
                    $scopedQuery->where('cashier_id', $user->id);
                })
                ->when($user->isAdminUser() && filled($request->cashier_id), function (Builder $scopedQuery) use ($request) {
                    $scopedQuery->where('cashier_id', $request->cashier_id);
                })
                ->when(filled($request->q), function (Builder $scopedQuery) use ($request) {
                    $search = trim($request->q);

                    $scopedQuery->where(function (Builder $searchQuery) use ($search) {
                        $searchQuery->where('invoice', 'like', '%' . $search . '%')
                            ->orWhereHas('cashier', function (Builder $cashierQuery) use ($search) {
                                $cashierQuery->where('name', 'like', '%' . $search . '%');
                            })
                            ->orWhereHas('customer', function (Builder $customerQuery) use ($search) {
                                $customerQuery->where('name', 'like', '%' . $search . '%');
                            });
                    });
                });
        });
    }

    protected function calculateExpenses(
        Request $request,
        User $user,
        Carbon $startDate,
        Carbon $endDate
    ): int {
        return (int) Expense::query()
            ->whereBetween('expense_date', [
                $startDate->toDateString(),
                $endDate->toDateString(),
            ])
            ->when(!$user->isAdminUser(), function (Builder $expenseQuery) use ($user) {
                $expenseQuery->where('user_id', $user->id);
            })
            ->when($user->isAdminUser() && filled($request->cashier_id), function (Builder $expenseQuery) use ($request) {
                $expenseQuery->where('user_id', $request->cashier_id);
            })
            ->sum('amount');
    }
}
