<?php

namespace App\Console\Commands;

use App\Services\StockAlertService;
use Illuminate\Console\Command;

class CheckStockAlerts extends Command
{
    protected $signature = 'stock:check-alerts';

    protected $description = 'Periksa stok produk terpantau dan kirim alert Telegram jika di bawah batas';

    public function handle(StockAlertService $stockAlertService): int
    {
        $results = $stockAlertService->checkAll('pemeriksaan manual stock:check-alerts');

        if ($results === []) {
            $this->info('Tidak ada alert stok yang dikirim.');

            return self::SUCCESS;
        }

        foreach ($results as $row) {
            $this->line(sprintf(
                'Alert dikirim: produk #%d, stok %d',
                $row['product_id'],
                $row['stock'],
            ));
        }

        $this->info(count($results) . ' alert stok diproses.');

        return self::SUCCESS;
    }
}
