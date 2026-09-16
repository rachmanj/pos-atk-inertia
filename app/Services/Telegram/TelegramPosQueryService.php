<?php

namespace App\Services\Telegram;

use App\Models\CashierShift;
use App\Models\PpobAccount;
use App\Models\Product;
use App\Models\ReturnTransaction;
use App\Models\Transaction;
use App\Models\TransactionPayment;
use App\Models\User;
use App\Services\TransactionPaymentAggregator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class TelegramPosQueryService
{
    public function handleCari(string $query): string
    {
        if (trim($query) === '') {
            return "❌ Ketik nama produk.\nContoh: <code>/cari pulpen</code>";
        }

        $products = $this->searchProducts($query);

        if ($products->isEmpty()) {
            return '❌ Produk tidak ditemukan untuk: <b>' . e($query) . '</b>';
        }

        $lines = [
            '🔍 <b>Hasil pencarian:</b> "' . e($query) . "\"\n",
        ];

        foreach ($products->values() as $index => $product) {
            $lines[] = $this->formatProductLine($index + 1, $product);
        }

        return implode("\n", $lines);
    }

    public function handleStok(string $query): string
    {
        if (trim($query) === '') {
            return "❌ Ketik nama produk.\nContoh: <code>/stok pulpen</code>";
        }

        $products = $this->searchProducts($query);

        if ($products->isEmpty()) {
            return '❌ Produk tidak ditemukan untuk: <b>' . e($query) . '</b>';
        }

        if ($products->count() === 1) {
            return $this->formatStockDetail($products->first());
        }

        $lines = [
            '📦 <b>Beberapa produk ditemukan.</b> Pilih yang dimaksud:',
            '',
        ];

        foreach ($products->values() as $index => $product) {
            $lines[] = ($index + 1) . '. ' . e($product->title)
                . ' — ' . $this->formatStockLabel($product);
        }

        $lines[] = '';
        $lines[] = 'Gunakan nama lebih spesifik, contoh: <code>/stok ' . e($products->first()->title) . '</code>';

        return implode("\n", $lines);
    }

    public function handleProduk(): string
    {
        $products = Product::query()
            ->where('is_active', true)
            ->inRandomOrder()
            ->limit(5)
            ->get();

        if ($products->isEmpty()) {
            return '❌ Belum ada produk aktif.';
        }

        $lines = [
            '🛍️ <b>Produk aktif (acak):</b>',
            '',
        ];

        foreach ($products->values() as $index => $product) {
            $lines[] = $this->formatProductLine($index + 1, $product);
        }

        return implode("\n", $lines);
    }

    public function handleTransaksi(User $user): string
    {
        $transactions = $this->todayPaidTransactionsQuery($user)
            ->orderByRaw('COALESCE(paid_at, created_at) DESC')
            ->limit(5)
            ->get([
                'id',
                'invoice',
                'grand_total',
                'payment_method',
                'paid_at',
                'created_at',
            ]);

        if ($transactions->isEmpty()) {
            return '📭 Belum ada transaksi hari ini.';
        }

        $lines = [
            '🧾 <b>Transaksi terakhir hari ini:</b>',
            '',
        ];

        foreach ($transactions as $index => $transaction) {
            $paidAt = $transaction->paid_at ?? $transaction->created_at;
            $time = $paidAt instanceof Carbon
                ? $paidAt->format('H:i')
                : Carbon::parse($paidAt)->format('H:i');

            $lines[] = ($index + 1) . '. <b>' . e($transaction->invoice) . '</b>'
                . ' — ' . TelegramFormatter::idr((int) $transaction->grand_total)
                . ' (' . $this->transactionMethodLabel($transaction) . ')'
                . ' · ' . $time;
        }

        return implode("\n", $lines);
    }

    public function handleSaldo(): string
    {
        $ppobAccount = PpobAccount::activeAccount();

        if (! $ppobAccount) {
            return '❌ Akun PPOB aktif belum dikonfigurasi.';
        }

        $lines = [
            '💰 <b>Saldo PPOB</b>',
            'Akun: ' . e($ppobAccount->name),
            'Saldo: <b>' . TelegramFormatter::idr((int) $ppobAccount->current_balance) . '</b>',
            'Batas peringatan: ' . TelegramFormatter::idr((int) $ppobAccount->min_balance_alert),
        ];

        if ($ppobAccount->isLowBalance()) {
            $lines[] = '⚠️ Saldo PPOB rendah!';
        }

        return implode("\n", $lines);
    }

    public function handleShift(User $user): string
    {
        $shift = $user->activeCashierShift;

        if (! $shift) {
            return '❌ Shift belum dibuka. Buka shift di POS Kasir terlebih dahulu.';
        }

        $summary = $this->buildShiftSummary($shift);
        $openedAt = $shift->opened_at instanceof Carbon
            ? $shift->opened_at
            : Carbon::parse($shift->opened_at);

        $lines = [
            '🕐 <b>Status Shift</b>',
            'Shift: #' . $shift->id . ' (buka)',
            'Kasir: ' . e($user->name),
            'Dibuka: ' . $openedAt->format('d/m/Y H:i'),
            'Modal awal: ' . TelegramFormatter::idr((int) $shift->cash_in_hand),
            'Transaksi: ' . $summary['total_transactions'],
            'Penjualan tunai: ' . TelegramFormatter::idr($summary['cash_sales']),
            'Penjualan non-tunai: ' . TelegramFormatter::idr($summary['non_cash_sales']),
            'Kas diharapkan: ' . TelegramFormatter::idr($summary['expected_cash']),
        ];

        if ($shift->ppob_opening_balance !== null) {
            $lines[] = 'Saldo PPOB awal shift: ' . TelegramFormatter::idr((int) $shift->ppob_opening_balance);
        }

        return implode("\n", $lines);
    }

    public function handlePending(User $user): string
    {
        $baseQuery = $this->pendingTransferTransactionsQuery($user);
        $totalCount = (int) (clone $baseQuery)->count();

        if ($totalCount === 0) {
            return '✅ Tidak ada transfer yang menunggu konfirmasi.';
        }

        $transactions = (clone $baseQuery)
            ->with(['cashier:id,name', 'payments'])
            ->orderBy('created_at')
            ->get([
                'id',
                'invoice',
                'grand_total',
                'payment_method',
                'payment_status',
                'cashier_id',
                'created_at',
            ]);

        $totalAmount = (int) $transactions->sum(
            fn (Transaction $transaction) => TransactionPaymentAggregator::pendingTransferAmount($transaction),
        );
        $remainingCount = max(0, $totalCount - 10);
        $transactions = $transactions->take(10);

        $lines = [
            '🏦 <b>Transfer Menunggu Konfirmasi</b>',
            '',
        ];

        foreach ($transactions as $index => $transaction) {
            $createdAt = $transaction->created_at instanceof Carbon
                ? $transaction->created_at
                : Carbon::parse($transaction->created_at);

            $transferAmount = TransactionPaymentAggregator::pendingTransferAmount($transaction);

            $lines[] = ($index + 1) . '. <b>' . e($transaction->invoice) . '</b>'
                . ' — ' . TelegramFormatter::idr($transferAmount)
                . ' · ' . e($transaction->cashier?->name ?? '—')
                . ' · ' . $createdAt->format('H:i')
                . ' (' . $this->formatPendingAge($createdAt) . ')';
        }

        if ($remainingCount > 0) {
            $lines[] = '… dan ' . $remainingCount . ' transaksi lain (total keseluruhan termasuk di bawah)';
        }

        $lines[] = '🏦 Total menunggu: ' . TelegramFormatter::idr($totalAmount) . ' (' . $totalCount . ' transaksi)';
        $lines[] = 'Konfirmasi di app: Transaksi → cari invoice → Konfirmasi Pembayaran.';

        return implode("\n", $lines);
    }

    public function handleLaporan(User $user): string
    {
        $todayStart = Carbon::now()->startOfDay();
        $todayEnd = Carbon::now()->endOfDay();

        $query = $this->todayPaidTransactionsQuery($user);

        $transactions = (clone $query)
            ->with('payments')
            ->get([
                'id',
                'grand_total',
                'payment_method',
                'payment_status',
            ]);

        $totalSales = (int) $transactions->sum('grand_total');
        $totalTransactions = $transactions->count();
        $averageSale = $totalTransactions > 0
            ? (int) round($totalSales / $totalTransactions)
            : 0;

        $methodTotals = TransactionPaymentAggregator::sumPaidByMethod($transactions);
        $cashSales = $methodTotals[TransactionPayment::METHOD_CASH];
        $digitalSales = $methodTotals[TransactionPayment::METHOD_DIGITAL];
        $qrisSales = $methodTotals[TransactionPayment::METHOD_QRIS];
        $transferSales = $methodTotals[TransactionPayment::METHOD_TRANSFER];

        $totalItems = (int) (clone $query)
            ->join('transaction_details', 'transactions.id', '=', 'transaction_details.transaction_id')
            ->sum('transaction_details.qty');

        if ($totalTransactions === 0) {
            return '📊 Belum ada penjualan hari ini (' . $todayStart->format('d/m/Y') . ').';
        }

        return implode("\n", [
            '📊 <b>Laporan Penjualan Hari Ini</b>',
            'Tanggal: ' . $todayStart->format('d/m/Y'),
            '',
            'Total transaksi: ' . $totalTransactions,
            'Total item terjual: ' . $totalItems,
            'Omzet: <b>' . TelegramFormatter::idr($totalSales) . '</b>',
            'Rata-rata per transaksi: ' . TelegramFormatter::idr($averageSale),
            '',
            '💵 Tunai: ' . TelegramFormatter::idr($cashSales),
            '📱 Digital: ' . TelegramFormatter::idr($digitalSales),
            '📲 QRIS: ' . TelegramFormatter::idr($qrisSales),
            '🏦 Transfer: ' . TelegramFormatter::idr($transferSales),
        ]);
    }

    protected function searchProducts(string $query): Collection
    {
        $escaped = str_replace(['%', '_'], ['\%', '\_'], trim($query));

        return Product::query()
            ->where('title', 'LIKE', '%' . $escaped . '%')
            ->where('is_active', true)
            ->limit(5)
            ->get();
    }

    protected function formatProductLine(int $number, Product $product): string
    {
        return $number . '. <b>' . e($product->title) . '</b>'
            . "\n   Barcode: " . e($product->barcode)
            . ' · ' . $this->formatStockLabel($product)
            . ' · ' . TelegramFormatter::idr((int) $product->sell_price)
            . ' · ' . $this->productTypeLabel($product);
    }

    protected function formatStockDetail(Product $product): string
    {
        return implode("\n", [
            '📦 <b>' . e($product->title) . '</b>',
            'Barcode: ' . e($product->barcode),
            'Stok: ' . $this->formatStockLabel($product),
            'Harga jual: ' . TelegramFormatter::idr((int) $product->sell_price),
            'Tipe: ' . $this->productTypeLabel($product),
        ]);
    }

    protected function formatStockLabel(Product $product): string
    {
        if ($product->isPpob()) {
            return '∞ PPOB';
        }

        $unit = e($product->displayUnit() ?? 'pcs');

        return (int) $product->stock . ' ' . $unit;
    }

    protected function productTypeLabel(Product $product): string
    {
        return match (true) {
            $product->isPpob() => 'PPOB',
            $product->isService() => 'Jasa',
            default => 'Fisik',
        };
    }

    protected function paymentMethodLabel(?string $method): string
    {
        return match ($method) {
            'cash' => 'Tunai',
            'digital' => 'Digital',
            'qris' => 'QRIS',
            'transfer' => 'Transfer',
            'split' => 'Campuran',
            default => ucfirst((string) $method),
        };
    }

    protected function transactionMethodLabel(Transaction $transaction): string
    {
        if ($transaction->payment_method === 'split' || $transaction->isSplitPayment()) {
            return 'Campuran';
        }

        return $this->paymentMethodLabel($transaction->payment_method);
    }

    protected function pendingTransferTransactionsQuery(User $user)
    {
        return Transaction::query()
            ->where('status', '!=', 'voided')
            ->where(function ($query) {
                $query->where(function ($legacyQuery) {
                    $legacyQuery
                        ->where('payment_method', TransactionPayment::METHOD_TRANSFER)
                        ->where('payment_status', 'pending');
                })->orWhereHas('payments', function ($paymentQuery) {
                    $paymentQuery
                        ->where('method', TransactionPayment::METHOD_TRANSFER)
                        ->where('payment_status', TransactionPayment::STATUS_PENDING);
                });
            })
            ->when(! $user->isAdminUser(), function ($query) use ($user) {
                $query->where('cashier_id', $user->id);
            });
    }

    protected function formatPendingAge(Carbon $createdAt): string
    {
        $createdDay = $createdAt->copy()->startOfDay();
        $today = Carbon::now()->startOfDay();

        if ($createdDay->equalTo($today)) {
            return 'hari ini';
        }

        if ($createdDay->equalTo($today->copy()->subDay())) {
            return 'kemarin';
        }

        return (int) $createdDay->diffInDays($today) . ' hari lalu';
    }

    protected function todayPaidTransactionsQuery(User $user)
    {
        $todayStart = Carbon::now()->startOfDay();
        $todayEnd = Carbon::now()->endOfDay();

        return Transaction::query()
            ->where('payment_status', 'paid')
            ->where('status', '!=', 'voided')
            ->whereBetween(
                DB::raw('COALESCE(transactions.paid_at, transactions.created_at)'),
                [$todayStart, $todayEnd]
            )
            ->when(! $user->isAdminUser(), function ($query) use ($user) {
                $query->where('cashier_id', $user->id);
            });
    }

    protected function buildShiftSummary(CashierShift $shift): array
    {
        $startedAt = $shift->opened_at instanceof Carbon
            ? $shift->opened_at->copy()
            : Carbon::parse($shift->opened_at);

        $endedAt = Carbon::now();

        $transactions = Transaction::query()
            ->with('payments')
            ->where('cashier_id', $shift->user_id)
            ->where('status', '!=', 'voided')
            ->whereBetween('created_at', [$startedAt, $endedAt])
            ->get();

        $cashRefunds = (int) ReturnTransaction::query()
            ->where('cashier_id', $shift->user_id)
            ->where('status', 'approved')
            ->where('refund_method', 'cash')
            ->whereBetween('updated_at', [$startedAt, $endedAt])
            ->sum('total_refund');

        $reconciliation = app(\App\Services\ShiftCashReconciliation::class)->build($shift, $endedAt);

        return [
            'cash_sales' => $reconciliation['hanya_cash_sales'],
            'non_cash_sales' => $reconciliation['non_cash_sales'],
            'expected_cash' => $reconciliation['kas_seharusnya'],
            'total_transactions' => $transactions->count(),
        ];
    }
}
