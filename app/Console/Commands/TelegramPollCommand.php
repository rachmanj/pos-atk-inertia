<?php

namespace App\Console\Commands;

use App\Services\Telegram\TelegramBotClient;
use App\Services\Telegram\TelegramUpdateHandler;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class TelegramPollCommand extends Command
{
    protected $signature = 'telegram:poll {--timeout=30 : Long polling timeout detik}';

    protected $description = 'Polling update Telegram (mode dev lokal)';

    public function handle(TelegramBotClient $botClient, TelegramUpdateHandler $updateHandler): int
    {
        if (! config('telegram.token')) {
            $this->error('TELEGRAM_BOT_TOKEN belum dikonfigurasi.');

            return self::FAILURE;
        }

        $this->info('Memulai polling Telegram. Tekan Ctrl+C untuk berhenti.');

        $offset = (int) Cache::get('telegram:poll:offset', 0);
        $timeout = (int) $this->option('timeout');

        while (true) {
            $response = $botClient->getUpdates($offset, $timeout);

            if (! is_array($response) || ! ($response['ok'] ?? false)) {
                sleep(2);

                continue;
            }

            foreach ($response['result'] ?? [] as $update) {
                $updateHandler->handle($update);
                $offset = max($offset, (int) ($update['update_id'] ?? 0) + 1);
                Cache::forever('telegram:poll:offset', $offset);
            }
        }
    }
}
