<?php

namespace App\Services\Telegram;

use InvalidArgumentException;

class TelegramMoneyParser
{
    public function parse(string $input): int
    {
        $normalized = mb_strtolower(trim($input));
        $normalized = preg_replace('/\brp\.?\s*/u', '', $normalized) ?? $normalized;
        $normalized = str_replace([' ', "\u{00A0}"], '', $normalized);

        if ($normalized === '') {
            throw new InvalidArgumentException('Jumlah uang tidak valid.');
        }

        if (preg_match('/^(\d+(?:[.,]\d{3})*)(jt|juta)$/u', $normalized, $matches)) {
            $base = $this->digitsOnly($matches[1]);

            return (int) $base * 1_000_000;
        }

        if (preg_match('/^(\d+(?:[.,]\d{3})*)(rb|ribu)$/u', $normalized, $matches)) {
            $base = $this->digitsOnly($matches[1]);

            return (int) $base * 1_000;
        }

        if (preg_match('/^(\d+(?:[.,]\d{3})*)$/u', $normalized, $matches)) {
            $amount = $this->digitsOnly($matches[1]);

            if ($amount <= 0) {
                throw new InvalidArgumentException('Jumlah uang harus lebih dari 0.');
            }

            return (int) $amount;
        }

        throw new InvalidArgumentException('Format uang tidak dikenali: ' . $input);
    }

    protected function digitsOnly(string $value): int
    {
        $digits = preg_replace('/[^\d]/', '', $value) ?? '';

        if ($digits === '') {
            throw new InvalidArgumentException('Jumlah uang tidak valid.');
        }

        return (int) $digits;
    }
}
