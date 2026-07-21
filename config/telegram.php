<?php

return [
    'token' => env('TELEGRAM_BOT_TOKEN'),
    'webhook_secret' => env('TELEGRAM_WEBHOOK_SECRET'),
    'allowed_chat_ids' => array_filter(array_map('trim', explode(',', env('TELEGRAM_ALLOWED_CHAT_IDS', '')))),
    'mode' => env('TELEGRAM_MODE', 'webhook'),
    'parse_mode' => env('TELEGRAM_PARSE_MODE', 'HTML'),
    'admin_fee_default_from_settings' => true,
    'confirmation_threshold' => (int) env('TELEGRAM_CONFIRMATION_THRESHOLD', 500_000),
    'pending_intent_ttl' => 300,
    'buy_rate_limit' => 5,
    'buy_rate_limit_decay' => 60,
];
