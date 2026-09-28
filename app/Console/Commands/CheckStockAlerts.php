<?php

namespace App\Console\Commands;

use App\Services\PpobBalanceAlertService;
use App\Services\StockAlertService;
use Illuminate\Console\Command;

class CheckStockAlerts extends Command
{
    protected $signature = 'stock:check-alerts';

    protected $description = 'Periksa stok produk terpantau dan saldo PPOB; kirim alert Telegram jika di bawah batas';

    public function handle(
        StockAlertService $stockAlertService,
        PpobBalanceAlertService $ppobBalanceAlertService,
    ): int {
        $stockResults = $stockAlertService->checkAll('pemeriksaan manual stock:check-alerts');
        $ppobResults = $ppobBalanceAlertService->check();

        if ($stockResults === [] && $ppobResults === []) {
            $this->info('Tidak ada alert yang dikirim.');

            return self::SUCCESS;
        }

        foreach ($stockResults as $row) {
            $this->line(sprintf(
                'Alert stok dikirim: produk #%d, stok %d',
                $row['product_id'],
                $row['stock'],
            ));
        }

        foreach ($ppobResults as $row) {
            $this->line(sprintf(
                'Alert saldo PPOB dikirim: akun #%d, saldo %d',
                $row['account_id'],
                $row['balance'],
            ));
        }

        $total = count($stockResults) + count($ppobResults);
        $this->info($total . ' alert diproses.');

        return self::SUCCESS;
    }
}
