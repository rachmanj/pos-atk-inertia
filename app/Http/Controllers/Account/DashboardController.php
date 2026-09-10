<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Models\CashierShift;
use App\Models\Expense;
use App\Models\Product;
use App\Models\Profit;
use App\Models\PpobAccount;
use App\Models\ReturnTransaction;
use App\Models\Transaction;
use App\Models\TransactionDetail;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request)
    {
        $user = $request->user();
        $todayStart = Carbon::now()->startOfDay();
        $todayEnd = Carbon::now()->endOfDay();
        $lowStockThreshold = 5;

        $paidTransactionsToday = Transaction::query();
        $this->applyPaidTransactionPeriod($paidTransactionsToday, $user, $todayStart, $todayEnd);

        $totalSalesToday = (int) (clone $paidTransactionsToday)->sum('grand_total');
        $todayStoreSales = $this->sumTodayDetailSubtotal($user, $todayStart, $todayEnd, false);
        $todayPpobSales = $this->sumTodayDetailSubtotal($user, $todayStart, $todayEnd, true);
        $totalTransactionsToday = (int) (clone $paidTransactionsToday)->count();
        $averageSaleToday = $totalTransactionsToday > 0
            ? (int) round($totalSalesToday / $totalTransactionsToday)
            : 0;

        $grossProfitToday = (int) Profit::query()
            ->whereHas('transaction', function (Builder $query) use ($user, $todayStart, $todayEnd) {
                $this->applyPaidTransactionPeriod($query, $user, $todayStart, $todayEnd);
            })
            ->sum('profit_amount');

        $totalExpenseToday = (int) Expense::query()
            ->where('expense_date', $todayStart->toDateString())
            ->when(!$user->isAdminUser(), function (Builder $query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->sum('amount');

        $lowStockQuery = Product::query()
            ->physical()
            ->where('is_active', true)
            ->where('stock', '<=', $lowStockThreshold);

        $ppobAccount = PpobAccount::activeAccount();

        $recentTransactions = Transaction::with(['cashier:id,name', 'customer:id,name'])
            ->select([
                'id',
                'cashier_id',
                'customer_id',
                'invoice',
                'grand_total',
                'payment_method',
                'payment_status',
                'status',
                'paid_at',
                'created_at',
            ])
            ->when(!$user->isAdminUser(), function (Builder $query) use ($user) {
                $query->where('cashier_id', $user->id);
            })
            ->latest()
            ->limit(5)
            ->get();

        return Inertia::render('Account/Dashboard/Index', [
            'summary' => [
                'today_sales'              => $totalSalesToday,
                'today_store_sales'        => $todayStoreSales,
                'today_ppob_sales'         => $todayPpobSales,
                'today_transactions'       => $totalTransactionsToday,
                'today_average_sale'       => $averageSaleToday,
                'today_gross_profit'       => $grossProfitToday,
                'today_expense'            => $totalExpenseToday,
                'today_net_profit'         => $grossProfitToday - $totalExpenseToday,
                'active_products'          => (int) Product::where('is_active', true)->count(),
                'low_stock_count'          => (int) (clone $lowStockQuery)->count(),
                'low_stock_threshold'      => $lowStockThreshold,
            ],
            'activeShift' => $this->buildActiveShiftSummary($user->activeCashierShift),
            'recentTransactions' => $recentTransactions,
            'lowStockProducts' => (clone $lowStockQuery)
                ->with('baseUnit.unit')
                ->orderBy('stock')
                ->orderBy('title')
                ->limit(5)
                ->get(['id', 'title', 'stock', 'unit']),
            'ppobAccount' => $ppobAccount ? [
                'id' => $ppobAccount->id,
                'name' => $ppobAccount->name,
                'current_balance' => $ppobAccount->current_balance,
                'min_balance_alert' => $ppobAccount->min_balance_alert,
                'is_low_balance' => $ppobAccount->isLowBalance(),
            ] : null,
        ]);
    }

    protected function sumTodayDetailSubtotal(
        User $user,
        Carbon $startDate,
        Carbon $endDate,
        bool $ppobOnly
    ): int {
        $query = TransactionDetail::query()
            ->join('products', 'transaction_details.product_id', '=', 'products.id')
            ->whereHas('transaction', function (Builder $query) use ($user, $startDate, $endDate) {
                $this->applyPaidTransactionPeriod($query, $user, $startDate, $endDate);
            });

        if ($ppobOnly) {
            $query->where('products.product_type', 'ppob');
        } else {
            $query->where('products.product_type', '<>', 'ppob');
        }

        return (int) $query->sum('transaction_details.subtotal');
    }

    protected function applyPaidTransactionPeriod(
        Builder $query,
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
            });
    }

    protected function buildActiveShiftSummary(?CashierShift $shift): ?array
    {
        if (!$shift) {
            return null;
        }

        $startedAt = $shift->opened_at instanceof Carbon
            ? $shift->opened_at->copy()
            : Carbon::parse($shift->opened_at);

        $endedAt = Carbon::now();

        $transactionsQuery = Transaction::query()
            ->where('cashier_id', $shift->user_id)
            ->where('status', '!=', 'voided')
            ->whereBetween('created_at', [$startedAt, $endedAt]);

        $paidTransactionsQuery = (clone $transactionsQuery)
            ->where('payment_status', 'paid');

        $cashSales = (int) (clone $paidTransactionsQuery)
            ->where('payment_method', 'cash')
            ->sum('grand_total');

        $nonCashSales = (int) (clone $paidTransactionsQuery)
            ->where('payment_method', '!=', 'cash')
            ->sum('grand_total');

        $cashRefunds = (int) ReturnTransaction::query()
            ->where('cashier_id', $shift->user_id)
            ->where('status', 'approved')
            ->where('refund_method', 'cash')
            ->whereBetween('updated_at', [$startedAt, $endedAt])
            ->sum('total_refund');

        return [
            'id'                 => $shift->id,
            'opened_at'          => $shift->opened_at,
            'cash_in_hand'       => $shift->cash_in_hand,
            'cash_sales'         => $cashSales,
            'non_cash_sales'     => $nonCashSales,
            'cash_refunds'       => $cashRefunds,
            'expected_cash'      => (int) $shift->cash_in_hand + $cashSales - $cashRefunds,
            'total_transactions' => (int) (clone $transactionsQuery)->count(),
        ];
    }
}
