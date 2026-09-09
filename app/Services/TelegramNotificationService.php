<?php

namespace App\Services;

use App\Services\Telegram\TelegramBotClient;
use DomainException;
use InvalidArgumentException;

class TelegramNotificationService
{
    public function sendText(string $chatId, string $text): string
    {
        $chatId = trim($chatId);

        if (! preg_match('/^-?\d+$/', $chatId)) {
            throw new InvalidArgumentException('Chat ID Telegram tidak valid.');
        }

        try {
            $response = app(TelegramBotClient::class)->sendMessage((int) $chatId, $text, null, false);

            if ($response === null) {
                throw new DomainException('Permintaan ke Telegram gagal.');
            }

            if (! ($response['ok'] ?? false)) {
                $message = $response['description'] ?? 'Permintaan ke Telegram gagal.';

                if (is_array($message)) {
                    $message = json_encode($message, JSON_UNESCAPED_UNICODE);
                }

                throw new DomainException((string) $message);
            }

            $messageId = $response['result']['message_id'] ?? null;

            if ($messageId !== null) {
                return (string) $messageId;
            }

            return 'sent';
        } catch (DomainException $e) {
            throw $e;
        } catch (\Throwable $e) {
            throw new DomainException('Permintaan ke Telegram gagal.');
        }
    }
}
