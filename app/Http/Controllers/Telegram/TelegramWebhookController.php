<?php

namespace App\Http\Controllers\Telegram;

use App\Http\Controllers\Controller;
use App\Services\Telegram\TelegramUpdateHandler;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class TelegramWebhookController extends Controller
{
    public function __construct(
        protected TelegramUpdateHandler $updateHandler,
    ) {}

    public function handle(Request $request): JsonResponse
    {
        $update = $request->all();

        try {
            $this->updateHandler->handle($update);
        } catch (\Throwable $e) {
            Log::error('Telegram webhook handler error', [
                'update_id' => $update['update_id'] ?? null,
                'error' => $e->getMessage(),
            ]);
        }

        return response()->json(['ok' => true]);
    }
}
