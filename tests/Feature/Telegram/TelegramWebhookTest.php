<?php

namespace Tests\Feature\Telegram;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class TelegramWebhookTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'telegram.token' => 'test-bot-token',
            'telegram.webhook_secret' => 'test-webhook-secret',
        ]);

        Http::fake([
            'api.telegram.org/*' => Http::response(['ok' => true, 'result' => []]),
        ]);
    }

    public function test_webhook_rejects_invalid_secret(): void
    {
        $response = $this->postJson(route('telegram.webhook'), [
            'update_id' => 1,
            'message' => [
                'message_id' => 1,
                'from' => ['id' => 12345],
                'chat' => ['id' => 12345, 'type' => 'private'],
                'text' => '/start',
            ],
        ], [
            'X-Telegram-Bot-Api-Secret-Token' => 'wrong-secret',
        ]);

        $response->assertForbidden();
    }

    public function test_unmapped_user_receives_rejection_on_start(): void
    {
        $response = $this->postJson(route('telegram.webhook'), [
            'update_id' => 2,
            'message' => [
                'message_id' => 2,
                'from' => ['id' => 99999],
                'chat' => ['id' => 99999, 'type' => 'private'],
                'text' => '/start',
            ],
        ], [
            'X-Telegram-Bot-Api-Secret-Token' => 'test-webhook-secret',
        ]);

        $response->assertOk()->assertJson(['ok' => true]);

        Http::assertSent(function ($request) {
            $body = $request->data();

            return str_contains($body['text'] ?? '', 'belum terhubung');
        });
    }

    public function test_webhook_is_idempotent_for_same_update_id(): void
    {
        $payload = [
            'update_id' => 42,
            'message' => [
                'message_id' => 3,
                'from' => ['id' => 88888],
                'chat' => ['id' => 88888, 'type' => 'private'],
                'text' => '/help',
            ],
        ];

        $headers = ['X-Telegram-Bot-Api-Secret-Token' => 'test-webhook-secret'];

        $this->postJson(route('telegram.webhook'), $payload, $headers)->assertOk();
        $this->postJson(route('telegram.webhook'), $payload, $headers)->assertOk();

        Http::assertSentCount(1);
    }
}
