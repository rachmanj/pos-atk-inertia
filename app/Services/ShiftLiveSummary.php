<?php

namespace App\Services;

use App\Models\CashierShift;
use App\Models\ReturnTransaction;
use App\Models\Transaction;
use Illuminate\Support\Carbon;

class ShiftLiveSummary
{
    public function __construct(
        protected ShiftCashReconciliation $shiftCashReconciliation,
    ) {}

    public function build(CashierShift $shift): array
    {
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

        $totalSales = (int) (clone $paidTransactionsQuery)->sum('grand_total');

        $approvedReturnsQuery = ReturnTransaction::query()
            ->where('cashier_id', $shift->user_id)
            ->where('status', 'approved')
            ->whereBetween('updated_at', [$startedAt, $endedAt]);

        $cashRefunds = (int) (clone $approvedReturnsQuery)
            ->where('refund_method', 'cash')
            ->sum('total_refund');

        $nonCashRefunds = (int) (clone $approvedReturnsQuery)
            ->where('refund_method', '!=', 'cash')
            ->sum('total_refund');

        $reconciliation = $this->shiftCashReconciliation->build($shift, $endedAt);

        return [
            'total_sales'        => $totalSales,
            'cash_sales'         => $cashSales,
            'non_cash_sales'     => $nonCashSales,
            'cash_refunds'       => $cashRefunds,
            'non_cash_refunds'   => $nonCashRefunds,
            'expected_cash'      => $reconciliation['kas_seharusnya'],
            'kas_awal'           => $reconciliation['kas_awal'],
            'kas_seharusnya'     => $reconciliation['kas_seharusnya'],
            'kas_disetor'        => $reconciliation['kas_disetor'],
            'selisih'            => $reconciliation['selisih'],
            'expense_amount'     => $reconciliation['expense_amount'],
            'total_transactions' => (int) (clone $transactionsQuery)->count(),
            'paid_transactions'  => (int) (clone $paidTransactionsQuery)->count(),
        ];
    }
}
