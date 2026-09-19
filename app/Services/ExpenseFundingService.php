<?php

namespace App\Services;

use App\Models\Expense;
use App\Models\PpobAccount;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ExpenseFundingService
{
    public function __construct(
        protected PpobBalanceService $ppobBalanceService,
    ) {}

    public function resolveCashierShiftId(User $user, string $paymentSource): ?int
    {
        if ($paymentSource !== 'cash') {
            return null;
        }

        $shift = $user->activeCashierShift;

        return $shift?->id;
    }

    public function applyPpobCharge(Expense $expense, PpobAccount $account, User $user): void
    {
        $this->assertSufficientBalance($account, (int) $expense->amount);

        $log = $this->ppobBalanceService->recordMovement(
            account: $account->fresh(),
            userId: $user->id,
            type: 'adjustment',
            amount: -((int) $expense->amount),
            cashierShiftId: $user->activeCashierShift?->id,
            referenceType: Expense::class,
            referenceId: $expense->id,
            note: $this->movementNote($expense),
        );

        $this->setBalanceLogId($expense->id, $log->id);
    }

    public function reversePpobCharge(Expense $expense, User $user, ?string $note = null): void
    {
        if ($expense->payment_source !== 'ppob' || !$expense->ppob_account_id) {
            return;
        }

        $account = PpobAccount::query()->find($expense->ppob_account_id);

        if (!$account) {
            return;
        }

        $log = $this->ppobBalanceService->recordMovement(
            account: $account,
            userId: $user->id,
            type: 'adjustment',
            amount: (int) $expense->amount,
            cashierShiftId: $user->activeCashierShift?->id,
            referenceType: Expense::class,
            referenceId: $expense->id,
            note: $note ?? 'Pembatalan pengeluaran ' . $expense->code,
        );

        $this->setBalanceLogId($expense->id, $log->id);
    }

    public function syncPpobOnUpdate(
        Expense $expense,
        string $previousPaymentSource,
        ?int $previousPpobAccountId,
        int $previousAmount,
        string $newPaymentSource,
        ?int $newPpobAccountId,
        int $newAmount,
        User $user,
    ): void {
        if ($previousPaymentSource === 'ppob' && $previousPpobAccountId && $previousAmount > 0) {
            $reversalExpense = clone $expense;
            $reversalExpense->payment_source = 'ppob';
            $reversalExpense->ppob_account_id = $previousPpobAccountId;
            $reversalExpense->amount = $previousAmount;

            $this->reversePpobCharge(
                $reversalExpense,
                $user,
                'Penyesuaian pengeluaran ' . $expense->code,
            );
        }

        if ($newPaymentSource === 'ppob' && $newPpobAccountId) {
            $account = PpobAccount::query()->findOrFail($newPpobAccountId);
            $expense->amount = $newAmount;
            $this->applyPpobCharge($expense, $account, $user);

            return;
        }

        $this->setBalanceLogId($expense->id, null);
    }

    protected function setBalanceLogId(int $expenseId, ?int $balanceLogId): void
    {
        Expense::query()->whereKey($expenseId)->update(['balance_log_id' => $balanceLogId]);
    }

    public function movementNote(Expense $expense): string
    {
        $expense->loadMissing('lines:id,expense_id,title');

        $title = $expense->lines->first()?->title ?? 'Pengeluaran';

        return 'Pengeluaran ' . $expense->code . ': ' . $title;
    }

    public function assertSufficientBalance(PpobAccount $account, int $requiredAmount): void
    {
        $balance = (int) $account->current_balance;

        if ($balance < $requiredAmount) {
            throw ValidationException::withMessages([
                'payment_source' => sprintf(
                    'Saldo PPOB tidak cukup (saldo Rp %s, dibutuhkan Rp %s).',
                    number_format($balance, 0, ',', '.'),
                    number_format($requiredAmount, 0, ',', '.'),
                ),
            ]);
        }
    }
}
