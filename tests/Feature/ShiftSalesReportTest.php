<?php

namespace Tests\Feature;

use App\Models\CashierShift;
use App\Models\Expense;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\Concerns\PosTestHelpers;
use Tests\TestCase;

class ShiftSalesReportTest extends TestCase
{
    use PosTestHelpers;
    use RefreshDatabase;

    public function test_report_page_defaults_to_today(): void
    {
        $user = $this->createCashierUser(['reports.sales']);

        $today = now()->toDateString();

        $this->actingAs($user)
            ->get(route('account.reports.shift_sales'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('filters.start_date', $today)
                ->where('filters.end_date', $today));
    }

    public function test_shift_sales_numbers_match_formula(): void
    {
        $user = $this->createCashierUser(['reports.sales']);

        $openedAt = now()->copy()->startOfDay()->addHours(8);
        $closedAt = now()->copy()->startOfDay()->addHours(16);

        $shift = CashierShift::create([
            'user_id' => $user->id,
            'opened_at' => $openedAt,
            'closed_at' => $closedAt,
            'cash_in_hand' => 100_000,
            'status' => 'closed',
            'actual_cash' => 200_000,
            'difference' => 0,
            'cash_overage' => 15_000,
        ]);

        $this->createShiftTransaction($user, $openedAt->copy()->addHour(), 100_000, 'cash', 'paid');
        $this->createShiftTransaction($user, $openedAt->copy()->addHours(2), 50_000, 'qris', 'paid');
        $this->createShiftTransaction($user, $openedAt->copy()->addHours(3), 200_000, 'cash', 'paid', 'voided');
        $this->createShiftTransaction($user, $openedAt->copy()->addHours(4), 75_000, 'transfer', 'pending');

        $this->actingAs($user)
            ->get(route('account.reports.shift_sales'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('shifts.data', 1)
                ->where('shifts.data.0.id', $shift->id)
                ->where('shifts.data.0.tunai', 100_000)
                ->where('shifts.data.0.non_tunai', 50_000)
                ->where('shifts.data.0.total_penjualan', 150_000)
                ->where('shifts.data.0.trx_count', 3)
                ->where('shifts.data.0.paid_count', 2)
                ->where('shifts.data.0.pending_count', 1)
                ->where('shifts.data.0.kelebihan', 15_000)
                ->where('shifts.data.0.kas_disetor', 200_000)
                ->where('summary.tunai', 100_000)
                ->where('summary.non_tunai', 50_000)
                ->where('summary.total_penjualan', 150_000)
                ->where('summary.total_transactions', 3)
                ->where('summary.paid_transactions', 2));
    }

    public function test_non_admin_only_sees_own_shifts(): void
    {
        $cashierA = $this->createCashierUser(['reports.sales']);
        $cashierB = $this->createCashierUser(['reports.sales']);

        $openedAt = now()->copy()->startOfDay()->addHours(8);

        CashierShift::create([
            'user_id' => $cashierA->id,
            'opened_at' => $openedAt,
            'closed_at' => $openedAt->copy()->addHours(8),
            'cash_in_hand' => 50_000,
            'status' => 'closed',
        ]);

        CashierShift::create([
            'user_id' => $cashierB->id,
            'opened_at' => $openedAt,
            'closed_at' => $openedAt->copy()->addHours(8),
            'cash_in_hand' => 50_000,
            'status' => 'closed',
        ]);

        $this->actingAs($cashierA)
            ->get(route('account.reports.shift_sales'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('shifts.data', 1)
                ->where('shifts.data.0.user.id', $cashierA->id));
    }

    public function test_pengeluaran_uses_stored_expense_amount_on_shift(): void
    {
        $user = $this->createCashierUser(['reports.sales']);

        $openedAt = now()->copy()->startOfDay()->addHours(8);
        $closedAt = now()->copy()->startOfDay()->addHours(16);

        CashierShift::create([
            'user_id' => $user->id,
            'opened_at' => $openedAt,
            'closed_at' => $closedAt,
            'cash_in_hand' => 100_000,
            'status' => 'closed',
            'expense_amount' => 45_000,
            'expense_note' => 'Beli galon',
        ]);

        $this->actingAs($user)
            ->get(route('account.reports.shift_sales'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('shifts.data', 1)
                ->where('shifts.data.0.pengeluaran', 45_000)
                ->where('shifts.data.0.expense_note', 'Beli galon')
                ->where('summary.total_pengeluaran', 45_000));
    }

    public function test_pengeluaran_menu_only_sums_expenses_within_shift_range(): void
    {
        $user = $this->createCashierUser(['reports.sales']);

        $openedAt = now()->copy()->startOfDay()->addHours(8);
        $closedAt = now()->copy()->startOfDay()->addHours(16);

        CashierShift::create([
            'user_id' => $user->id,
            'opened_at' => $openedAt,
            'closed_at' => $closedAt,
            'cash_in_hand' => 100_000,
            'status' => 'closed',
            'expense_amount' => 0,
        ]);

        $inRangeExpense = Expense::create([
            'user_id' => $user->id,
            'code' => 'EXP-IN-RANGE',
            'expense_date' => $openedAt->toDateString(),
            'amount' => 30_000,
            'note' => 'Dalam shift',
        ]);
        $inRangeExpense->forceFill([
            'created_at' => $openedAt->copy()->addHours(2),
            'updated_at' => $openedAt->copy()->addHours(2),
        ])->save();

        $outOfRangeExpense = Expense::create([
            'user_id' => $user->id,
            'code' => 'EXP-OUT-RANGE',
            'expense_date' => $openedAt->toDateString(),
            'amount' => 99_000,
            'note' => 'Di luar shift',
        ]);
        $outOfRangeExpense->forceFill([
            'created_at' => $openedAt->copy()->subHour(),
            'updated_at' => $openedAt->copy()->subHour(),
        ])->save();

        $this->actingAs($user)
            ->get(route('account.reports.shift_sales'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('shifts.data', 1)
                ->where('shifts.data.0.pengeluaran', 0)
                ->where('shifts.data.0.pengeluaran_menu', 30_000)
                ->where('summary.total_pengeluaran', 0)
                ->where('summary.total_pengeluaran_menu', 30_000));
    }

    public function test_export_runs_without_error(): void
    {
        $user = $this->createCashierUser(['reports.sales', 'reports.export']);

        CashierShift::create([
            'user_id' => $user->id,
            'opened_at' => now()->copy()->startOfDay()->addHours(8),
            'closed_at' => now()->copy()->startOfDay()->addHours(16),
            'cash_in_hand' => 100_000,
            'status' => 'closed',
        ]);

        $this->actingAs($user)
            ->get(route('account.reports.shift_sales.export'))
            ->assertOk();
    }

    protected function createShiftTransaction(
        User $user,
        Carbon $createdAt,
        int $grandTotal,
        string $paymentMethod,
        string $paymentStatus = 'paid',
        string $status = 'completed',
    ): Transaction {
        $transaction = Transaction::create([
            'cashier_id' => $user->id,
            'invoice' => 'TRX-SHIFT-RPT-' . uniqid(),
            'cash' => $paymentMethod === 'cash' ? $grandTotal : 0,
            'change' => 0,
            'discount' => 0,
            'grand_total' => $grandTotal,
            'payment_method' => $paymentMethod,
            'payment_status' => $paymentStatus,
            'status' => $status,
        ]);

        $transaction->forceFill([
            'created_at' => $createdAt,
            'updated_at' => $createdAt,
        ])->save();

        return $transaction->fresh();
    }
}
