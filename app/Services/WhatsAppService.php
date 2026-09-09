<?php

namespace App\Services;

use DomainException;
use Illuminate\Support\Facades\Http;
use InvalidArgumentException;

class WhatsAppService
{
    public function normalizePhone(string $phone): string
    {
        $normalized = preg_replace('/[\s\-]/', '', $phone) ?? '';
        $normalized = ltrim($normalized, '+');

        if (str_starts_with($normalized, '0')) {
            $normalized = '62' . substr($normalized, 1);
        }

        if (! preg_match('/^\d{10,15}$/', $normalized)) {
            throw new InvalidArgumentException('Nomor WhatsApp tidak valid.');
        }

        return $normalized;
    }

    public function sendText(string $to, string $text): string
    {
        $baseUrl = rtrim((string) config('services.whatsapp.base_url'), '/');
        $apiKey = (string) config('services.whatsapp.api_key');
        $timeout = (int) config('services.whatsapp.timeout', 10);

        $normalized = $this->normalizePhone($to);

        $response = Http::timeout($timeout)
            ->withToken($apiKey)
            ->acceptJson()
            ->post("{$baseUrl}/api/v1/messages", [
                'to' => $normalized,
                'text' => $text,
            ]);

        if ($response->successful()) {
            $messageId = $response->json('message_id');

            if (filled($messageId)) {
                return (string) $messageId;
            }
        }

        $message = $response->json('message')
            ?? $response->json('error')
            ?? 'Permintaan ke WA-Hub gagal.';

        if (is_array($message)) {
            $message = json_encode($message, JSON_UNESCAPED_UNICODE);
        }

        throw new DomainException((string) $message);
    }
}
