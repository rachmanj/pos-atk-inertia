<?php

namespace App\Services\Telegram;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TelegramBotClient
{
    protected string $baseUrl;

    public function __construct()
    {
        $token = config('telegram.token');
        $this->baseUrl = "https://api.telegram.org/bot{$token}";
    }

    public function sendMessage(int|string $chatId, string $text, ?array $replyMarkup = null): ?array
    {
        $payload = [
            'chat_id' => $chatId,
            'text' => $text,
            'parse_mode' => config('telegram.parse_mode'),
        ];

        if ($replyMarkup !== null) {
            $payload['reply_markup'] = json_encode($replyMarkup);
        }

        return $this->request('sendMessage', $payload);
    }

    public function answerCallbackQuery(string $callbackQueryId, ?string $text = null): ?array
    {
        $payload = ['callback_query_id' => $callbackQueryId];

        if ($text !== null) {
            $payload['text'] = $text;
        }

        return $this->request('answerCallbackQuery', $payload);
    }

    public function getUpdates(int $offset = 0, int $timeout = 30): ?array
    {
        return $this->request('getUpdates', [
            'offset' => $offset,
            'timeout' => $timeout,
            'allowed_updates' => ['message', 'callback_query'],
        ]);
    }

    public function setWebhook(string $url, string $secretToken): ?array
    {
        return $this->request('setWebhook', [
            'url' => $url,
            'secret_token' => $secretToken,
            'allowed_updates' => ['message', 'callback_query'],
        ]);
    }

    public function deleteWebhook(): ?array
    {
        return $this->request('deleteWebhook');
    }

    protected function request(string $method, array $payload = []): ?array
    {
        if (! config('telegram.token')) {
            Log::warning('Telegram bot token belum dikonfigurasi', ['method' => $method]);

            return null;
        }

        try {
            $response = Http::timeout(10)->post("{$this->baseUrl}/{$method}", $payload);

            if (! $response->successful()) {
                Log::warning('Telegram API request gagal', [
                    'method' => $method,
                    'status' => $response->status(),
                    'body' => $response->json(),
                ]);

                return null;
            }

            return $response->json();
        } catch (\Throwable $e) {
            Log::error('Telegram API exception', [
                'method' => $method,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }
}
