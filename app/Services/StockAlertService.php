<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Setting;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

class StockAlertService
{
    public function __construct(
        protected TelegramNotificationService $telegram,
    ) {}

    public function enabled(): bool
    {
        return filter_var(
            Setting::value('stock_alert.enabled', '1'),
            FILTER_VALIDATE_BOOLEAN,
        );
    }

    public function threshold(): int
    {
        return (int) Setting::value('stock_alert.threshold', '10');
    }

    /**
     * @return list<int>
     */
    public function alertProductIds(): array
    {
        $raw = trim((string) Setting::value('stock_alert.product_ids', ''));

        if ($raw !== '') {
            $ids = [];

            foreach (explode(',', $raw) as $part) {
                $part = trim($part);

                if ($part !== '' && ctype_digit($part)) {
                    $ids[] = (int) $part;
                }
            }

            return array_values(array_unique($ids));
        }

        $keyword = trim((string) Setting::value('stock_alert.keyword', 'METERAI'));

        if ($keyword === '') {
            return [];
        }

        return Product::query()
            ->where('is_active', true)
            ->whereRaw('LOWER(title) LIKE ?', ['%' . mb_strtolower($keyword) . '%'])
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values()
            ->all();
    }

    /**
     * @param  list<int>|null  $productIds
     * @return list<array{product_id: int, stock: int, message: string}>
     */
    public function check(?array $productIds = null, ?string $context = null): array
    {
        if (! $this->enabled()) {
            return [];
        }

        $monitored = $this->alertProductIds();

        if ($monitored === []) {
            return [];
        }

        if ($productIds !== null) {
            $productIds = array_values(array_unique(array_map('intval', $productIds)));
            $ids = array_values(array_intersect($productIds, $monitored));
        } else {
            $ids = $monitored;
        }

        if ($ids === []) {
            return [];
        }

        $threshold = $this->threshold();
        $sent = [];
        $recipients = null;

        $products = Product::query()
            ->whereIn('id', $ids)
            ->get()
            ->keyBy('id');

        foreach ($ids as $productId) {
            $product = $products->get($productId);

            if (! $product) {
                continue;
            }

            $stock = (int) $product->stock;

            if ($stock > $threshold) {
                continue;
            }

            if ($this->wasAlertSentRecently($productId)) {
                continue;
            }

            $message = $this->buildMessage($product, $context);

            if ($recipients === null) {
                $recipients = $this->telegram->recipients();
            }

            if ($recipients === []) {
                Log::warning('Stock alert skipped: no Telegram recipients configured.', [
                    'product_id' => $productId,
                    'stock' => $stock,
                ]);

                continue;
            }

            $anySent = false;

            foreach ($recipients as $chatId) {
                try {
                    $this->telegram->sendText($chatId, $message);
                    $anySent = true;
                } catch (\Throwable $e) {
                    Log::warning('Stock alert Telegram send failed.', [
                        'product_id' => $productId,
                        'chat_id' => $chatId,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            if ($anySent) {
                $this->markAlertSent($productId);
            }

            $sent[] = [
                'product_id' => $productId,
                'stock' => $stock,
                'message' => $message,
            ];
        }

        return $sent;
    }

    /**
     * @return list<array{product_id: int, stock: int, message: string}>
     */
    public function checkAll(?string $context = null): array
    {
        return $this->check(null, $context);
    }

    public function buildMessage(Product $product, ?string $context = null): string
    {
        $threshold = $this->threshold();
        $unit = trim((string) ($product->unit ?: 'pcs'));
        $timestamp = now()->timezone(config('app.timezone'))->format('d M Y H:i');

        $lines = [
            '⚠️ STOK MENIPIS — VASIA',
            'Produk : ' . $product->title,
            'Sisa   : ' . (int) $product->stock . ' ' . $unit . ' (batas ' . $threshold . ')',
            'Waktu  : ' . $timestamp,
        ];

        if (filled($context)) {
            $lines[] = 'Sumber : ' . trim($context);
        }

        return implode("\n", $lines);
    }

    protected function wasAlertSentRecently(int $productId): bool
    {
        $raw = Setting::value('stock_alert.last_sent.' . $productId);

        if (blank($raw)) {
            return false;
        }

        try {
            $lastSent = Carbon::parse($raw);
        } catch (\Throwable) {
            return false;
        }

        return $lastSent->greaterThan(now()->subHours(24));
    }

    protected function markAlertSent(int $productId): void
    {
        Setting::updateOrCreate(
            ['key' => 'stock_alert.last_sent.' . $productId],
            [
                'value' => now()->toDateTimeString(),
                'group' => 'stock_alert',
            ],
        );
    }
}
