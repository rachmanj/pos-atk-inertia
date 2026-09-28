<?php

namespace App\Services;

use App\Models\PpobAccount;
use App\Models\Setting;
use App\Services\Telegram\TelegramFormatter;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

class PpobBalanceAlertService
{
    public function __construct(
        protected TelegramNotificationService $telegram,
    ) {}

    public function enabled(): bool
    {
        return filter_var(
            Setting::value('ppob_balance_alert.enabled', '1'),
            FILTER_VALIDATE_BOOLEAN,
        );
    }

    public function thresholdFor(PpobAccount $account): int
    {
        return (int) ($account->min_balance_alert ?: Setting::value('ppob_min_balance_default', 100000));
    }

    /**
     * @return list<array{account_id: int, balance: int, message: string}>
     */
    public function check(?PpobAccount $account = null): array
    {
        if (! $this->enabled()) {
            return [];
        }

        $accounts = $account !== null
            ? collect([$account])
            : PpobAccount::query()
                ->where('is_active', true)
                ->orderBy('id')
                ->get();

        $sent = [];
        $recipients = null;

        foreach ($accounts as $ppobAccount) {
            $balance = (int) $ppobAccount->current_balance;
            $threshold = $this->thresholdFor($ppobAccount);

            if ($balance > $threshold) {
                continue;
            }

            if ($this->wasAlertSentRecently((int) $ppobAccount->id)) {
                continue;
            }

            $message = $this->buildMessage($ppobAccount);

            if ($recipients === null) {
                $recipients = $this->telegram->recipients();
            }

            if ($recipients === []) {
                Log::warning('PPOB balance alert skipped: no Telegram recipients configured.', [
                    'account_id' => $ppobAccount->id,
                    'balance' => $balance,
                ]);

                continue;
            }

            $anySent = false;

            foreach ($recipients as $chatId) {
                try {
                    $this->telegram->sendText($chatId, $message);
                    $anySent = true;
                } catch (\Throwable $e) {
                    Log::warning('PPOB balance alert Telegram send failed.', [
                        'account_id' => $ppobAccount->id,
                        'chat_id' => $chatId,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            if ($anySent) {
                $this->markAlertSent((int) $ppobAccount->id);
            }

            $sent[] = [
                'account_id' => (int) $ppobAccount->id,
                'balance' => $balance,
                'message' => $message,
            ];
        }

        return $sent;
    }

    public function buildMessage(PpobAccount $account): string
    {
        $threshold = $this->thresholdFor($account);
        $timestamp = now()->timezone(config('app.timezone'))->format('d M Y H:i');

        return implode("\n", [
            '⚠️ SALDO PPOB MENIPIS — VASIA',
            'Akun  : ' . $account->name,
            'Saldo : ' . TelegramFormatter::idr((int) $account->current_balance),
            'Batas : ' . TelegramFormatter::idr($threshold),
            'Waktu : ' . $timestamp,
        ]);
    }

    protected function wasAlertSentRecently(int $accountId): bool
    {
        $raw = Setting::value('ppob_balance_alert.last_sent.' . $accountId);

        if (blank($raw)) {
            return false;
        }

        try {
            $lastSent = Carbon::parse($raw);
        } catch (\Throwable) {
            return false;
        }

        return $lastSent->greaterThan(now()->subHours(24));
    }

    protected function markAlertSent(int $accountId): void
    {
        Setting::updateOrCreate(
            ['key' => 'ppob_balance_alert.last_sent.' . $accountId],
            [
                'value' => now()->toDateTimeString(),
                'group' => 'ppob_balance_alert',
            ],
        );
    }
}
