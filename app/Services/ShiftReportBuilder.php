<?php

namespace App\Services;

use App\Models\CashierShift;
use App\Models\Setting;
use App\Models\Transaction;
use App\Services\Telegram\TelegramFormatter;
use Illuminate\Support\Carbon;

class ShiftReportBuilder
{
    public function __construct(
        protected ShiftCashReconciliation $shiftCashReconciliation,
    ) {}

    public function build(CashierShift $shift, int $expenseAmount = 0, ?string $expenseNote = null, array $expenseLines = []): array
    {
        $startedAt = $shift->opened_at instanceof Carbon
            ? $shift->opened_at->copy()
            : Carbon::parse($shift->opened_at);

        $endedAt = $shift->closed_at instanceof Carbon
            ? $shift->closed_at->copy()
            : Carbon::parse($shift->closed_at);

        $shiftForReconciliation = clone $shift;
        $shiftForReconciliation->expense_amount = $expenseAmount;

        $reconciliation = $this->shiftCashReconciliation->build($shiftForReconciliation, $endedAt);

        $totalPenjualan = $reconciliation['total_penjualan'];
        $nonTunai = $reconciliation['non_tunai'];
        $refundTunai = $reconciliation['cash_refunds'];
        $tunaiDariPenjualan = $reconciliation['tunai_dari_penjualan'];
        $kasAwal = $reconciliation['kas_awal'];
        $kasSeharusnya = $reconciliation['kas_seharusnya'];
        $tunaiDisetor = $reconciliation['kas_disetor'];
        $selisih = $reconciliation['selisih'];

        $ppobCashQuery = Transaction::query()
            ->where('cashier_id', $shift->user_id)
            ->where('status', '!=', 'voided')
            ->where('payment_method', 'cash')
            ->where('payment_status', 'paid')
            ->whereBetween('created_at', [$startedAt, $endedAt])
            ->whereHas('details', fn ($query) => $query->whereNotNull('ppob_cost'));

        $ppobTunai = (int) (clone $ppobCashQuery)->sum('grand_total');
        $ppobTransaksi = (int) (clone $ppobCashQuery)->distinct()->count('transactions.id');

        $transactionsQuery = Transaction::query()
            ->with('payments')
            ->where('cashier_id', $shift->user_id)
            ->where('status', '!=', 'voided')
            ->whereBetween('created_at', [$startedAt, $endedAt]);

        $daftarNonTunai = (clone $transactionsQuery)
            ->orderBy('created_at')
            ->get()
            ->filter(fn (Transaction $transaction) => TransactionPaymentAggregator::transactionHasNonCashPart($transaction))
            ->map(fn (Transaction $transaction) => $this->buildNonCashEntry($transaction))
            ->values()
            ->all();

        $shift->loadMissing('user:id,name');

        $messageText = $this->buildMessageText(
            shift: $shift,
            startedAt: $startedAt,
            endedAt: $endedAt,
            kasAwal: $kasAwal,
            totalPenjualan: $totalPenjualan,
            nonTunai: $nonTunai,
            refundTunai: $refundTunai,
            expenseAmount: $expenseAmount,
            expenseNote: $expenseNote,
            expenseLines: $expenseLines,
            tunaiDariPenjualan: $tunaiDariPenjualan,
            kasSeharusnya: $kasSeharusnya,
            selisih: $selisih,
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
            'tunaiDariPenjualan' => $tunaiDariPenjualan,
            'tunaiDisetor' => $tunaiDisetor,
            'kas_awal' => $kasAwal,
            'kas_seharusnya' => $kasSeharusnya,
            'selisih' => $selisih,
            'messageText' => $messageText,
        ];
    }

    protected function buildMessageText(
        CashierShift $shift,
        Carbon $startedAt,
        Carbon $endedAt,
        int $kasAwal,
        int $totalPenjualan,
        int $nonTunai,
        int $refundTunai,
        int $expenseAmount,
        ?string $expenseNote,
        array $expenseLines,
        int $tunaiDariPenjualan,
        int $kasSeharusnya,
        int $selisih,
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
            $this->labelLine('Kas Awal', TelegramFormatter::idr($kasAwal)),
            $this->labelLine('Total Penjualan', TelegramFormatter::idr($totalPenjualan)),
            $this->labelLine('Non-Tunai QRIS/Trf', $this->formatMinus($nonTunai)),
        ];

        if ($refundTunai > 0) {
            $lines[] = $this->labelLine('Retur Tunai', $this->formatMinus($refundTunai));
        }

        if ($expenseAmount > 0) {
            $lines[] = $this->labelLine('Pengeluaran dari Laci', $this->formatMinus($expenseAmount));

            if ($expenseLines !== []) {
                foreach ($expenseLines as $line) {
                    $lines[] = '  - Rp ' . number_format((int) $line['amount'], 0, ',', '.')
                        . ' ' . trim($line['title']);
                }
            } elseif (filled($expenseNote)) {
                $lines[array_key_last($lines)] .= ' (' . trim($expenseNote) . ')';
            }
        }

        $lines[] = $this->labelLine('Tunai dari Penjualan', TelegramFormatter::idr($tunaiDariPenjualan));
        $lines[] = $this->labelLine('Kas Seharusnya', TelegramFormatter::idr($kasSeharusnya));

        if ($selisih > 0) {
            $lines[] = $this->labelLine('Kelebihan Uang', TelegramFormatter::idr($selisih));
            if (filled($shift->overage_note)) {
                $lines[] = '  ' . trim($shift->overage_note);
            }
        }

        if ($selisih < 0) {
            $lines[] = $this->labelLine('Kurang Uang', TelegramFormatter::idr(abs($selisih)));
        }

        $lines[] = '';
        $lines[] = $this->labelLine('Tunai Disetor', TelegramFormatter::idr($tunaiDisetor));
        $lines[] = '';
        $lines[] = 'RINCIAN NON-TUNAI:';

        if ($daftarNonTunai === []) {
            $lines[] = 'Tidak ada transaksi non-tunai.';
        } else {
            foreach ($daftarNonTunai as $item) {
                $line = '- ' . $item['jam'] . ' ' . $item['metode'] . ' '
                    . TelegramFormatter::idr($item['total']);

                if (! empty($item['breakdown'])) {
                    $line .= ' ' . $item['breakdown'];
                }

                $line .= ' (' . $item['invoice'] . ')';
                $lines[] = $line;

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

    protected function labelLine(string $label, string $value): string
    {
        return str_pad($label, 21, ' ', STR_PAD_RIGHT) . ': ' . $value;
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

    protected function buildNonCashEntry(Transaction $transaction): array
    {
        $isSplit = $transaction->isSplitPayment();

        return [
            'jam' => ($transaction->created_at ?? now())->format('H:i'),
            'metode' => $isSplit ? 'CAMPURAN' : $this->paymentMethodLabel((string) $transaction->payment_method),
            'total' => (int) $transaction->grand_total,
            'breakdown' => $isSplit ? $this->formatSplitBreakdown($transaction) : null,
            'invoice' => $transaction->invoice,
            'isPending' => TransactionPaymentAggregator::hasPendingNonCashPart($transaction),
        ];
    }

    protected function formatSplitBreakdown(Transaction $transaction): string
    {
        $parts = [];

        foreach ($transaction->paymentBreakdown() as $method => $amount) {
            $label = $method === 'cash' ? 'Tunai' : $this->paymentMethodLabel($method);
            $parts[] = $label . ' Rp ' . number_format((int) $amount, 0, ',', '.');
        }

        return '(' . implode(' + ', $parts) . ')';
    }
}
