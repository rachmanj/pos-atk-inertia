<?php

namespace App\Console\Commands;

use App\Services\Telegram\TelegramBotClient;
use App\Services\Telegram\TelegramBotCommands;
use Illuminate\Console\Command;

class TelegramSetCommandsCommand extends Command
{
    protected $signature = 'telegram:set-commands';

    protected $description = 'Daftarkan menu perintah bot Telegram (setMyCommands)';

    public function handle(TelegramBotClient $botClient): int
    {
        if (! config('telegram.token')) {
            $this->error('TELEGRAM_BOT_TOKEN belum dikonfigurasi.');

            return self::FAILURE;
        }

        $response = $botClient->setMyCommands(TelegramBotCommands::definitions());

        if (! is_array($response) || ! ($response['ok'] ?? false)) {
            $this->error('Gagal setMyCommands: ' . json_encode($response));

            return self::FAILURE;
        }

        $this->info('Menu perintah bot berhasil diperbarui (' . count(TelegramBotCommands::definitions()) . ' perintah).');

        return self::SUCCESS;
    }
}
