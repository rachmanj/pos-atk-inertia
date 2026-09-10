<?php

namespace App\Services;

use App\Models\CashierShift;
use App\Models\ReturnTransaction;
use App\Models\Setting;
use App\Models\Transaction;
use App\Services\Telegram\TelegramFormatter;
use Illuminate\Support\Carbon;

class ShiftReportBuilder
{
    public function build(CashierShift $shift, int $expenseAmount = 0, ?string $expenseNote = null): array
    {
        $startedAt = $shift->opened_at instanceof Carbon
            ? $shift->opened_at->copy()
            : Carbon::parse($shift->opened_at);

        $endedAt = $shift->closed_at instanceof Carbon
            ? $shift->closed_at->copy()
            : Carbon::parse($shift->closed_at);

        $transactionsQuery = Transaction::query()
            ->where('cashier_id', $shift->user_id)
            ->where('status', '!=', 'voided')
            ->whereBetween('created_at', [$startedAt, $endedAt]);

        $totalPenjualan = (int) (clone $transactionsQuery)->sum('grand_total');

        $nonTunai = (int) (clone $transactionsQuery)
            ->whereIn('payment_method', ['qris', 'transfer', 'digital'])
            ->sum('grand_total');

        $approvedReturnsQuery = ReturnTransaction::query()
            ->where('cashier_id', $shift->user_id)
            ->where('status', 'approved')
            ->whereBetween('updated_at', [$startedAt, $endedAt]);

        $refundTunai = (int) (clone $approvedReturnsQuery)
            ->where('refund_method', 'cash')
            ->sum('total_refund');

        $ppobCashQuery = Transaction::query()
            ->where('cashier_id', $shift->user_id)
            ->where('status', '!=', 'voided')
            ->where('payment_method', 'cash')
            ->where('payment_status', 'paid')
            ->whereBetween('created_at', [$startedAt, $endedAt])
            ->whereHas('details', fn ($query) => $query->whereNotNull('ppob_cost'));

        $ppobTunai = (int) (clone $ppobCashQuery)->sum('grand_total');
        $ppobTransaksi = (int) (clone $ppobCashQuery)->distinct()->count('transactions.id');

        $nonCashTransactions = (clone $transactionsQuery)
            ->whereIn('payment_method', ['qris', 'transfer', 'digital'])
            ->orderBy('created_at')
            ->get(['invoice', 'grand_total', 'payment_method', 'payment_status', 'created_at']);

        $daftarNonTunai = $nonCashTransactions->map(function (Transaction $transaction) {
            return [
                'jam' => ($transaction->created_at ?? now())->format('H:i'),
                'metode' => $this->paymentMethodLabel($transaction->payment_method),
                'total' => (int) $transaction->grand_total,
                'invoice' => $transaction->invoice,
                'isPending' => $transaction->payment_status !== 'paid',
            ];
        })->values()->all();

        $tunaiDisetor = $totalPenjualan - $nonTunai - $refundTunai - $expenseAmount;

        $shift->loadMissing('user:id,name');

        $messageText = $this->buildMessageText(
            shift: $shift,
            startedAt: $startedAt,
            endedAt: $endedAt,
            totalPenjualan: $totalPenjualan,
            nonTunai: $nonTunai,
            refundTunai: $refundTunai,
            expenseAmount: $expenseAmount,
            expenseNote: $expenseNote,
            tunaiDisetor: $tunaiDisetor,
            daftarNonTunai: $daftarNonTunai,
            ppobTunai: $ppobTunai,
            ppobTransaksi: $ppobTransaksi,
        );

        return [
            'totalPenjualan' => $totalPenjualan,
            'nonTunai' => $nonTunai,
            'refundTunai' => $refundTunai,
            'ppobTunai' => $ppobTunai,
            'ppobTransaksi' => $ppobTransaksi,
            'daftarNonTunai' => $daftarNonTunai,
            'tunaiDisetor' => $tunaiDisetor,
            'messageText' => $messageText,
        ];
    }

    protected function buildMessageText(
        CashierShift $shift,
        Carbon $startedAt,
        Carbon $endedAt,
        int $totalPenjualan,
        int $nonTunai,
        int $refundTunai,
        int $expenseAmount,
        ?string $expenseNote,
        int $tunaiDisetor,
        array $daftarNonTunai,
        int $ppobTunai,
        int $ppobTransaksi,
    ): string {
        $storeName = Setting::value('store.name') ?: 'VASIA Stationery';
        $cashierName = $shift->user?->name ?? '-';

        $lines = [
            '🏪 REKAP SHIFT — ' . $storeName,
            'Kasir : ' . $cashierName,
            'Shift : ' . $startedAt->format('d/m/Y H:i') . ' - ' . $endedAt->format('d/m/Y H:i'),
            '',
            'Total Penjualan      : ' . TelegramFormatter::idr($totalPenjualan),
            'Non-Tunai QRIS/Trf   : ' . $this->formatMinus($nonTunai),
        ];

        if ($refundTunai > 0) {
            $lines[] = 'Retur Tunai          : ' . $this->formatMinus($refundTunai);
        }

        if ($expenseAmount > 0) {
            $expenseLine = 'Pengeluaran Lain     : ' . $this->formatMinus($expenseAmount);
            if (filled($expenseNote)) {
                $expenseLine .= ' (' . trim($expenseNote) . ')';
            }
            $lines[] = $expenseLine;
        }

        $cashOverage = (int) ($shift->cash_overage ?? 0);
        if ($cashOverage > 0) {
            $lines[] = 'Kelebihan Uang       : ' . TelegramFormatter::idr($cashOverage);
            if (filled($shift->overage_note)) {
                $lines[] = '  ' . trim($shift->overage_note);
            }
        }

        $lines[] = '';
        $lines[] = 'Tunai Disetor        : ' . TelegramFormatter::idr($tunaiDisetor);
        $lines[] = '';
        $lines[] = 'RINCIAN NON-TUNAI:';

        if ($daftarNonTunai === []) {
            $lines[] = 'Tidak ada transaksi non-tunai.';
        } else {
            foreach ($daftarNonTunai as $item) {
                $lines[] = '- ' . $item['jam'] . ' ' . $item['metode'] . ' '
                    . TelegramFormatter::idr($item['total']) . ' (' . $item['invoice'] . ')';

                if ($item['isPending']) {
                    $lines[] = '  *menunggu konfirmasi — cek rekening*';
                }
            }
        }

        if ($ppobTunai > 0) {
            $lines[] = 'PPOB tunai: ' . TelegramFormatter::idr($ppobTunai)
                . ' (' . $ppobTransaksi . ' trx) termasuk di atas';
        }

        return implode("\n", $lines);
    }

    protected function formatMinus(int $amount): string
    {
        return '-Rp ' . number_format($amount, 0, ',', '.');
    }

    protected function paymentMethodLabel(string $method): string
    {
        return match ($method) {
            'qris' => 'QRIS',
            'transfer' => 'Transfer',
            'digital' => 'Digital',
            default => ucfirst($method),
        };
    }
}
