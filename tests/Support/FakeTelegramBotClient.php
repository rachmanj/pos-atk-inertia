<?php

namespace Tests\Support;

use App\Services\Telegram\TelegramBotClient;

class FakeTelegramBotClient extends TelegramBotClient
{
    /** @var list<array{chatId: int|string, text: string, replyMarkup: ?array, useParseMode: bool}> */
    public static array $sentMessages = [];

    /** @var list<array{callbackQueryId: string, text: ?string}> */
    public static array $callbackQueries = [];

    /** @var list<array{method: string, payload: array}> */
    public static array $requests = [];

    public function __construct()
    {
    }

    public static function reset(): void
    {
        self::$sentMessages = [];
        self::$callbackQueries = [];
        self::$requests = [];
    }

    public function sendMessage(int|string $chatId, string $text, ?array $replyMarkup = null, bool $useParseMode = true): ?array
    {
        self::$sentMessages[] = [
            'chatId' => $chatId,
            'text' => $text,
            'replyMarkup' => $replyMarkup,
            'useParseMode' => $useParseMode,
        ];

        return [
            'ok' => true,
            'result' => ['message_id' => count(self::$sentMessages)],
        ];
    }

    public function answerCallbackQuery(string $callbackQueryId, ?string $text = null): ?array
    {
        self::$callbackQueries[] = [
            'callbackQueryId' => $callbackQueryId,
            'text' => $text,
        ];

        return ['ok' => true];
    }

    protected function request(string $method, array $payload = []): ?array
    {
        self::$requests[] = [
            'method' => $method,
            'payload' => $payload,
        ];

        return ['ok' => true, 'result' => []];
    }
}
