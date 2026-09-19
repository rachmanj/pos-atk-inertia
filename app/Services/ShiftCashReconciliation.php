<?php

namespace App\Services;

use App\Models\CashierShift;
use App\Models\Expense;
use App\Models\ReturnTransaction;
use App\Models\Transaction;
use Illuminate\Support\Carbon;

class ShiftCashReconciliation
{
    public function build(CashierShift $shift, ?Carbon $endedAt = null): array
    {
        $startedAt = $shift->opened_at instanceof Carbon
            ? $shift->opened_at->copy()
            : Carbon::parse($shift->opened_at);

        $endedAt = $endedAt ?? ($shift->closed_at instanceof Carbon
            ? $shift->closed_at->copy()
            : ($shift->closed_at ? Carbon::parse($shift->closed_at) : now()));

        $transactions = Transaction::query()
            ->with('payments')
            ->where('cashier_id', $shift->user_id)
            ->where('status', '!=', 'voided')
            ->whereBetween('created_at', [$startedAt, $endedAt])
            ->get();

        $hanyaCashSales = TransactionPaymentAggregator::sumPaidCash($transactions);
        $nonCashSales = TransactionPaymentAggregator::sumPaidNonCash($transactions);

        $totalPenjualan = (int) $transactions->sum('grand_total');
        $nonTunai = TransactionPaymentAggregator::sumNonCashForDrawer($transactions);

        $approvedReturnsQuery = ReturnTransaction::query()
            ->where('cashier_id', $shift->user_id)
            ->where('status', 'approved')
            ->whereBetween('updated_at', [$startedAt, $endedAt]);

        $cashRefunds = (int) (clone $approvedReturnsQuery)
            ->where('refund_method', 'cash')
            ->sum('total_refund');

        $expenseAmount = (int) ($shift->expense_amount ?? 0);
        $moduleExpenseAmount = (int) Expense::query()
            ->where('cashier_shift_id', $shift->id)
            ->where('payment_source', Expense::PAYMENT_SOURCE_CASH)
            ->sum('amount');
        $kasAwal = (int) $shift->cash_in_hand;

        $penjualanTunai = $totalPenjualan - $nonTunai;
        $tunaiDariPenjualan = $penjualanTunai - $cashRefunds - $expenseAmount;
        $kasSeharusnya = $kasAwal + $tunaiDariPenjualan - $moduleExpenseAmount;

        $shiftOpen = $shift->isOpen() || $shift->closed_at === null;
        $cashOverage = (int) ($shift->cash_overage ?? 0);

        if ($shiftOpen) {
            $kasDisetor = $kasSeharusnya + $cashOverage;
            $selisih = $cashOverage;
        } else {
            $kasDisetor = (int) $shift->actual_cash;
            $selisih = $kasDisetor - $kasSeharusnya;
        }

        return [
            'shift_open'          => $shiftOpen,
            'hanya_cash_sales'    => $hanyaCashSales,
            'non_cash_sales'      => $nonCashSales,
            'cash_refunds'        => $cashRefunds,
            'expense_amount'      => $expenseAmount,
            'module_expense_amount' => $moduleExpenseAmount,
            'kas_awal'            => $kasAwal,
            'kas_seharusnya'      => $kasSeharusnya,
            'kas_disetor'         => $kasDisetor,
            'selisih'             => $selisih,
            'tunai_dari_penjualan' => $tunaiDariPenjualan,
            'penjualan_tunai'     => $penjualanTunai,
            'total_penjualan'     => $totalPenjualan,
            'non_tunai'           => $nonTunai,
        ];
    }
}
