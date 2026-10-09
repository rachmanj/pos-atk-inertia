<?php

namespace App\Services;

use App\Models\PpobAccount;
use App\Models\PpobBalanceLog;
use App\Models\Setting;
use DomainException;

class PpobBalanceService
{
    public function recordMovement(
        PpobAccount $account,
        int $userId,
        string $type,
        int $amount,
        ?int $cashierShiftId = null,
        ?string $referenceType = null,
        ?int $referenceId = null,
        ?string $note = null,
    ): PpobBalanceLog {
        if (!in_array($type, ['opening_balance', 'top_up', 'sale', 'adjustment'], true)) {
            throw new DomainException('Tipe mutasi saldo PPOB tidak valid.');
        }

        $balanceBefore = (int) $account->current_balance;
        $balanceAfter = $balanceBefore + $amount;

        if ($balanceAfter < 0) {
            throw new DomainException('Saldo PPOB tidak mencukupi untuk transaksi ini.');
        }

        $log = PpobBalanceLog::create([
            'ppob_account_id' => $account->id,
            'user_id' => $userId,
            'cashier_shift_id' => $cashierShiftId,
            'type' => $type,
            'amount' => $amount,
            'balance_before' => $balanceBefore,
            'balance_after' => $balanceAfter,
            'reference_type' => $referenceType,
            'reference_id' => $referenceId,
            'note' => $note,
        ]);

        $account->update([
            'current_balance' => $balanceAfter,
        ]);

        if ($type === 'top_up') {
            $this->recordTopUpDepositFeeIfApplicable(
                $account,
                $userId,
                $cashierShiftId,
            );
        }

        try {
            app(PpobBalanceAlertService::class)->check($account->fresh());
        } catch (\Throwable) {
            // notifikasi tidak boleh menggagalkan pencatatan saldo
        }

        return $log;
    }

    protected function recordTopUpDepositFeeIfApplicable(
        PpobAccount $account,
        int $userId,
        ?int $cashierShiftId,
    ): void {
        $settings = Setting::ppobSettings();

        if (!$settings['ppob_topup_fee_enabled']) {
            return;
        }

        $fee = (int) $settings['ppob_topup_fee'];

        if ($fee <= 0) {
            return;
        }

        $formatted = 'Rp ' . number_format($fee, 0, ',', '.');

        $this->recordMovement(
            account: $account,
            userId: $userId,
            type: 'adjustment',
            amount: -$fee,
            cashierShiftId: $cashierShiftId,
            note: "Biaya administrasi setoran otomatis ({$formatted})",
        );
    }
}
