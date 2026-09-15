<?php

namespace App\Services;

use App\Models\CashierShift;
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

        $transactionsQuery = Transaction::query()
            ->where('cashier_id', $shift->user_id)
            ->where('status', '!=', 'voided')
            ->whereBetween('created_at', [$startedAt, $endedAt]);

        $paidTransactionsQuery = (clone $transactionsQuery)
            ->where('payment_status', 'paid');

        $hanyaCashSales = (int) (clone $paidTransactionsQuery)
            ->where('payment_method', 'cash')
            ->sum('grand_total');

        $nonCashSales = (int) (clone $paidTransactionsQuery)
            ->where('payment_method', '!=', 'cash')
            ->sum('grand_total');

        $totalPenjualan = (int) (clone $transactionsQuery)->sum('grand_total');

        $nonTunai = (int) (clone $transactionsQuery)
            ->whereIn('payment_method', ['qris', 'transfer', 'digital'])
            ->sum('grand_total');

        $approvedReturnsQuery = ReturnTransaction::query()
            ->where('cashier_id', $shift->user_id)
            ->where('status', 'approved')
            ->whereBetween('updated_at', [$startedAt, $endedAt]);

        $cashRefunds = (int) (clone $approvedReturnsQuery)
            ->where('refund_method', 'cash')
            ->sum('total_refund');

        $expenseAmount = (int) ($shift->expense_amount ?? 0);
        $kasAwal = (int) $shift->cash_in_hand;

        $tunaiDariPenjualan = $totalPenjualan - $nonTunai - $cashRefunds - $expenseAmount;
        $kasSeharusnya = $kasAwal + $tunaiDariPenjualan;

        $kasDisetor = $shift->actual_cash !== null
            ? (int) $shift->actual_cash
            : $kasSeharusnya + (int) ($shift->cash_overage ?? 0);

        $selisih = $kasDisetor - $kasSeharusnya;

        return [
            'hanya_cash_sales'    => $hanyaCashSales,
            'non_cash_sales'      => $nonCashSales,
            'cash_refunds'        => $cashRefunds,
            'expense_amount'      => $expenseAmount,
            'kas_awal'            => $kasAwal,
            'kas_seharusnya'      => $kasSeharusnya,
            'kas_disetor'         => $kasDisetor,
            'selisih'             => $selisih,
            'tunai_dari_penjualan' => $tunaiDariPenjualan,
            'total_penjualan'     => $totalPenjualan,
            'non_tunai'           => $nonTunai,
        ];
    }
}
