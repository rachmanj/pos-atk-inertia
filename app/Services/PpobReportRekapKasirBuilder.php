<?php

namespace App\Services;

use App\Models\Expense;
use App\Models\TransactionDetail;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class PpobReportRekapKasirBuilder
{
    public static function build(Carbon $startDate, Carbon $endDate, ?int $cashierId = null): Collection
    {
        $byUserId = [];

        foreach (static::salesRows($startDate, $endDate, $cashierId) as $row) {
            $byUserId[$row['user_id']] = $row;
        }

        foreach (static::ppobExpenseRows($startDate, $endDate, $cashierId) as $row) {
            $userId = $row['user_id'];
            $expenseTotal = $row['expense_total'];

            if (isset($byUserId[$userId])) {
                $byUserId[$userId]['total_harga_dasar'] += $expenseTotal;
                $byUserId[$userId]['has_expense'] = true;
                $byUserId[$userId]['expense_total'] += $expenseTotal;

                continue;
            }

            $byUserId[$userId] = [
                'user_id' => $userId,
                'cashier_name' => $row['cashier_name'],
                'total_harga_dasar' => $expenseTotal,
                'total_penjualan' => 0,
                'has_expense' => true,
                'expense_total' => $expenseTotal,
            ];
        }

        return collect($byUserId)
            ->sortByDesc('total_penjualan')
            ->values()
            ->map(fn (array $row) => [
                'user_id' => $row['user_id'],
                'cashier_name' => $row['cashier_name'],
                'total_harga_dasar' => (int) $row['total_harga_dasar'],
                'total_penjualan' => (int) $row['total_penjualan'],
                'has_expense' => (bool) $row['has_expense'],
                'expense_total' => (int) $row['expense_total'],
            ]);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private static function salesRows(Carbon $startDate, Carbon $endDate, ?int $cashierId): array
    {
        $query = static::salesBaseQuery($startDate, $endDate, $cashierId)
            ->join('users', 'users.id', '=', 'transactions.cashier_id')
            ->select([
                'transactions.cashier_id as user_id',
                'users.name as cashier_name',
                DB::raw('SUM(transaction_details.ppob_cost * transaction_details.qty) as total_harga_dasar'),
                DB::raw('SUM(transaction_details.subtotal) as total_penjualan'),
            ])
            ->groupBy('transactions.cashier_id', 'users.name');

        $rows = [];

        foreach ($query->get() as $row) {
            $rows[(int) $row->user_id] = [
                'user_id' => (int) $row->user_id,
                'cashier_name' => $row->cashier_name,
                'total_harga_dasar' => (int) $row->total_harga_dasar,
                'total_penjualan' => (int) $row->total_penjualan,
                'has_expense' => false,
                'expense_total' => 0,
            ];
        }

        return $rows;
    }

    /**
     * @return list<array<string, mixed>>
     */
    private static function ppobExpenseRows(Carbon $startDate, Carbon $endDate, ?int $cashierId): array
    {
        $query = Expense::query()
            ->join('expense_lines', 'expense_lines.expense_id', '=', 'expenses.id')
            ->join('users', 'users.id', '=', 'expenses.user_id')
            ->where('expenses.payment_source', Expense::PAYMENT_SOURCE_PPOB)
            ->whereDate('expenses.expense_date', '>=', $startDate)
            ->whereDate('expenses.expense_date', '<=', $endDate)
            ->when(filled($cashierId), fn (Builder $q) => $q->where('expenses.user_id', $cashierId))
            ->select([
                'expenses.user_id',
                'users.name as cashier_name',
                DB::raw('SUM(expense_lines.amount) as expense_total'),
            ])
            ->groupBy('expenses.user_id', 'users.name');

        return $query->get()->map(fn ($row) => [
            'user_id' => (int) $row->user_id,
            'cashier_name' => $row->cashier_name,
            'expense_total' => (int) $row->expense_total,
        ])->all();
    }

    private static function salesBaseQuery(Carbon $startDate, Carbon $endDate, ?int $cashierId): Builder
    {
        return TransactionDetail::query()
            ->join('transactions', 'transaction_details.transaction_id', '=', 'transactions.id')
            ->whereNotNull('transaction_details.ppob_cost')
            ->where('transactions.payment_status', 'paid')
            ->where('transactions.status', '!=', 'voided')
            ->whereBetween(
                DB::raw('COALESCE(transactions.paid_at, transactions.created_at)'),
                [$startDate, $endDate]
            )
            ->when(filled($cashierId), function (Builder $query) use ($cashierId) {
                $query->where('transactions.cashier_id', $cashierId);
            });
    }
}
