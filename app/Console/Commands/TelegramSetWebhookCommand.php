<?php

namespace App\Console\Commands;

use App\Services\Telegram\TelegramBotClient;
use Illuminate\Console\Command;

class TelegramSetWebhookCommand extends Command
{
    protected $signature = 'telegram:set-webhook {--url= : URL webhook (default APP_URL/telegram/webhook)}';

    protected $description = 'Daftarkan webhook Telegram untuk produksi';

    public function handle(TelegramBotClient $botClient): int
    {
        $token = config('telegram.token');
        $secret = config('telegram.webhook_secret');

        if (! $token) {
            $this->error('TELEGRAM_BOT_TOKEN belum dikonfigurasi.');

            return self::FAILURE;
        }

        if (! $secret) {
            $this->error('TELEGRAM_WEBHOOK_SECRET belum dikonfigurasi.');

            return self::FAILURE;
        }

        $url = $this->option('url') ?: rtrim((string) config('app.url'), '/') . '/telegram/webhook';

        $response = $botClient->setWebhook($url, $secret);

        if (! is_array($response) || ! ($response['ok'] ?? false)) {
            $this->error('Gagal set webhook: ' . json_encode($response));

            return self::FAILURE;
        }

        $this->info("Webhook terdaftar: {$url}");

        return self::SUCCESS;
    }
}
