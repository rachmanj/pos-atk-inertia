<?php

namespace App\Services\Telegram;

class TelegramFormatter
{
    public static function idr(int $amount): string
    {
        return 'Rp ' . number_format($amount, 0, ',', '.');
    }
}
