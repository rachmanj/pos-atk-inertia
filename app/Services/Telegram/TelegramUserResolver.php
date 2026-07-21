<?php

namespace App\Services\Telegram;

use App\Models\PpobAccount;
use App\Models\User;

class TelegramUserResolver
{
    public function resolve(int $telegramId, ?string $telegramUsername = null): ?User
    {
        $allowedChatIds = config('telegram.allowed_chat_ids', []);

        if ($allowedChatIds !== [] && ! in_array((string) $telegramId, $allowedChatIds, true)) {
            return null;
        }

        $user = User::query()
            ->where('telegram_id', $telegramId)
            ->first();

        if (! $user) {
            return null;
        }

        if ($telegramUsername && $user->telegram_username !== $telegramUsername) {
            $user->update([
                'telegram_username' => $telegramUsername,
            ]);
        }

        if (! $user->can('transactions.create')) {
            return null;
        }

        return $user;
    }

    public function getStatusMessage(?User $user, int $telegramId): string
    {
        if (! $user) {
            return "Halo. Akun Telegram ini belum terhubung ke POS Kasir.\n"
                . "Minta admin mengisi Telegram ID: <code>{$telegramId}</code> pada master User.";
        }

        $shift = $user->activeCashierShift;
        $ppobAccount = PpobAccount::activeAccount();

        $lines = [
            "👤 <b>{$user->name}</b> ({$user->username})",
            'Shift: ' . ($shift ? "✅ #{$shift->id} (buka)" : '❌ belum dibuka'),
            'Akun PPOB: ' . ($ppobAccount ? "✅ {$ppobAccount->name}" : '❌ belum dikonfigurasi'),
        ];

        if ($ppobAccount) {
            $lines[] = 'Saldo PPOB: ' . TelegramFormatter::idr($ppobAccount->current_balance);
            if ($ppobAccount->isLowBalance()) {
                $lines[] = '⚠️ Saldo PPOB rendah!';
            }
        }

        return implode("\n", $lines);
    }
}
