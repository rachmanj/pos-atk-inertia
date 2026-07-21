<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifyTelegramWebhook
{
    public function handle(Request $request, Closure $next): Response
    {
        $secret = config('telegram.webhook_secret');

        if (! $secret) {
            return response()->json(['message' => 'Webhook secret belum dikonfigurasi'], 503);
        }

        $headerToken = $request->header('X-Telegram-Bot-Api-Secret-Token');

        if (! $headerToken || ! hash_equals($secret, $headerToken)) {
            return response()->json(['message' => 'Token webhook tidak valid'], 403);
        }

        return $next($request);
    }
}
