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
            ->with('payments')
            ->where('cashier_id', $shift->user_id)
            ->where('status', '!=', 'voided')
            ->whereBetween('created_at', [$startedAt, $endedAt]);

        $transactions = (clone $transactionsQuery)->get();

        $paidTransactionsQuery = (clone $transactionsQuery)
            ->where('payment_status', 'paid');

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
            'total_sales'        => (int) (clone $paidTransactionsQuery)->sum('grand_total'),
            'cash_sales'         => $reconciliation['hanya_cash_sales'],
            'non_cash_sales'     => $reconciliation['non_cash_sales'],
            'cash_refunds'       => $cashRefunds,
            'non_cash_refunds'   => $nonCashRefunds,
            'expected_cash'      => $reconciliation['kas_seharusnya'],
            'kas_awal'           => $reconciliation['kas_awal'],
            'kas_seharusnya'     => $reconciliation['kas_seharusnya'],
            'kas_disetor'        => $reconciliation['kas_disetor'],
            'selisih'            => $reconciliation['selisih'],
            'shift_open'         => $reconciliation['shift_open'],
            'expense_amount'     => $reconciliation['expense_amount'],
            'total_transactions' => $transactions->count(),
            'paid_transactions'  => (int) (clone $paidTransactionsQuery)->count(),
        ];
    }
}
