<?php

namespace Tests\Feature;

use App\Models\CashierShift;
use App\Models\CashierShiftExpense;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\Concerns\PosTestHelpers;
use Tests\TestCase;

class ShiftExpenseBeforeCloseTest extends TestCase
{
    use PosTestHelpers;
    use RefreshDatabase;

    protected function shiftPermissions(): array
    {
        return ['cashier_shifts.close', 'cashier_shifts.index'];
    }

    protected function createAdminUser(): User
    {
        $this->seedPermissions($this->shiftPermissions());

        $role = Role::findOrCreate(config('roles.admin', 'admin'));
        $role->syncPermissions(Permission::all());

        $user = User::create([
            'name' => 'Admin Shift',
            'username' => 'admin-shift-' . uniqid(),
            'email' => 'admin-shift-' . uniqid() . '@example.com',
            'password' => Hash::make('password'),
        ]);

        $user->assignRole($role);

        return $user;
    }

    public function test_save_expenses_while_shift_open_persists_lines_and_total(): void
    {
        $user = $this->createCashierUser($this->shiftPermissions());
        $shift = $this->openCashierShift($user, 100_000);

        $this->actingAs($user)
            ->put(route('account.cashier-shifts.expenses.save', $shift), [
                'expenses' => [
                    ['title' => 'Beli ATK', 'amount' => 25_000],
                    ['title' => 'Bensin', 'amount' => 15_000],
                ],
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertSame(2, CashierShiftExpense::query()->where('cashier_shift_id', $shift->id)->count());

        $shift->refresh();
        $this->assertSame(40_000, $shift->expense_amount);
    }

    public function test_close_with_expenses_reduces_expected_cash_and_sets_difference(): void
    {
        $user = $this->createCashierUser($this->shiftPermissions());
        $openedAt = Carbon::parse('2026-09-18 08:00:00');
        Carbon::setTestNow($openedAt->copy()->addHours(4));

        $shift = CashierShift::create([
            'user_id' => $user->id,
            'opened_at' => $openedAt,
            'cash_in_hand' => 100_000,
            'status' => 'open',
        ]);

        $this->createShiftTransaction($user, $openedAt->copy()->addHour(), 500_000, 'cash');

        $this->actingAs($user)
            ->put(route('account.cashier-shifts.close', $shift), [
                'actual_cash' => 550_000,
                'expenses' => [
                    ['title' => 'Operasional', 'amount' => 50_000],
                ],
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $shift->refresh();

        $this->assertSame('closed', $shift->status);
        $this->assertSame(1, CashierShiftExpense::query()->where('cashier_shift_id', $shift->id)->count());
        $this->assertSame(50_000, $shift->expense_amount);
        $this->assertSame(550_000, $shift->expected_cash);
        $this->assertSame(550_000, $shift->actual_cash);
        $this->assertSame(0, $shift->difference);
        $this->assertSame(0, $shift->cash_overage);
    }

    public function test_close_computes_cash_overage_from_actual_minus_expected(): void
    {
        $user = $this->createCashierUser($this->shiftPermissions());
        $openedAt = Carbon::parse('2026-09-18 09:00:00');
        Carbon::setTestNow($openedAt->copy()->addHours(2));

        $shift = CashierShift::create([
            'user_id' => $user->id,
            'opened_at' => $openedAt,
            'cash_in_hand' => 100_000,
            'status' => 'open',
        ]);

        $this->createShiftTransaction($user, $openedAt->copy()->addHour(), 500_000, 'cash');

        $this->actingAs($user)
            ->put(route('account.cashier-shifts.close', $shift), [
                'actual_cash' => 650_000,
                'cash_overage' => 5_000,
            ])
            ->assertSessionHasErrors('overage_note');

        $this->actingAs($user)
            ->put(route('account.cashier-shifts.close', $shift), [
                'actual_cash' => 650_000,
                'overage_note' => 'Lebih fisik',
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $shift->refresh();

        $this->assertSame(600_000, $shift->expected_cash);
        $this->assertSame(650_000, $shift->actual_cash);
        $this->assertSame(50_000, $shift->difference);
        $this->assertSame(50_000, $shift->cash_overage);
        $this->assertSame('Lebih fisik', $shift->overage_note);
    }

    public function test_close_with_short_cash_sets_negative_difference_and_zero_overage(): void
    {
        $user = $this->createCashierUser($this->shiftPermissions());
        $openedAt = Carbon::parse('2026-09-18 09:00:00');
        Carbon::setTestNow($openedAt->copy()->addHours(2));

        $shift = CashierShift::create([
            'user_id' => $user->id,
            'opened_at' => $openedAt,
            'cash_in_hand' => 100_000,
            'status' => 'open',
        ]);

        $this->createShiftTransaction($user, $openedAt->copy()->addHour(), 500_000, 'cash');

        $this->actingAs($user)
            ->put(route('account.cashier-shifts.close', $shift), [
                'actual_cash' => 450_000,
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $shift->refresh();

        $this->assertSame(600_000, $shift->expected_cash);
        $this->assertSame(-150_000, $shift->difference);
        $this->assertSame(0, $shift->cash_overage);
    }

    public function test_close_without_expenses_payload_keeps_zero_expense_amount(): void
    {
        $user = $this->createCashierUser($this->shiftPermissions());
        $shift = $this->openCashierShift($user, 50_000);

        $this->actingAs($user)
            ->put(route('account.cashier-shifts.close', $shift), [
                'actual_cash' => 50_000,
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $shift->refresh();

        $this->assertSame(0, $shift->expense_amount);
        $this->assertSame(50_000, $shift->expected_cash);
        $this->assertSame(0, $shift->difference);
    }

    public function test_save_expenses_on_closed_shift_returns_422(): void
    {
        $user = $this->createCashierUser($this->shiftPermissions());
        $shift = $this->createClosedShift($user);

        $this->actingAs($user)
            ->put(route('account.cashier-shifts.expenses.save', $shift), [
                'expenses' => [
                    ['title' => 'Tes', 'amount' => 10_000],
                ],
            ])
            ->assertSessionHasErrors('expenses');
    }

    public function test_save_expenses_by_non_owner_non_admin_returns_403(): void
    {
        $owner = $this->createCashierUser($this->shiftPermissions());
        $other = $this->createCashierUser($this->shiftPermissions());
        $shift = $this->openCashierShift($owner, 100_000);

        $this->actingAs($other)
            ->put(route('account.cashier-shifts.expenses.save', $shift), [
                'expenses' => [
                    ['title' => 'Tes', 'amount' => 10_000],
                ],
            ])
            ->assertForbidden();
    }

    public function test_admin_can_reopen_closed_shift_and_preserves_expenses(): void
    {
        $cashier = $this->createCashierUser($this->shiftPermissions());
        $admin = $this->createAdminUser();

        $openedAt = Carbon::parse('2026-09-18 08:00:00');
        $closedAt = Carbon::parse('2026-09-18 16:00:00');

        $shift = CashierShift::create([
            'user_id' => $cashier->id,
            'opened_at' => $openedAt,
            'closed_at' => $closedAt,
            'cash_in_hand' => 100_000,
            'expected_cash' => 500_000,
            'actual_cash' => 500_000,
            'difference' => 0,
            'cash_overage' => 0,
            'status' => 'closed',
            'expense_amount' => 30_000,
        ]);

        CashierShiftExpense::create([
            'cashier_shift_id' => $shift->id,
            'title' => 'ATK',
            'amount' => 30_000,
        ]);

        $this->actingAs($admin)
            ->put(route('account.cashier-shifts.reopen', $shift), [
                'reason' => 'Koreksi pengeluaran',
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $shift->refresh();

        $this->assertSame('open', $shift->status);
        $this->assertNull($shift->closed_at);
        $this->assertNull($shift->difference);
        $this->assertNull($shift->actual_cash);
        $this->assertSame(0, $shift->cash_overage);
        $this->assertNull($shift->overage_note);
        $this->assertNull($shift->expected_cash);
        $this->assertSame(30_000, $shift->expense_amount);
        $this->assertSame(1, CashierShiftExpense::query()->where('cashier_shift_id', $shift->id)->count());
        $this->assertStringContainsString('[BUKA KEMBALI', $shift->note);
        $this->assertStringContainsString('Koreksi pengeluaran', $shift->note);
        $this->assertStringContainsString('Admin Shift', $shift->note);
    }

    public function test_reopen_by_cashier_returns_403(): void
    {
        $user = $this->createCashierUser($this->shiftPermissions());
        $shift = $this->createClosedShift($user);

        $this->actingAs($user)
            ->put(route('account.cashier-shifts.reopen', $shift), [
                'reason' => 'Ingin ubah',
            ])
            ->assertForbidden();
    }

    public function test_reopen_open_shift_returns_422(): void
    {
        $admin = $this->createAdminUser();
        $shift = $this->openCashierShift($admin, 100_000);

        $this->actingAs($admin)
            ->put(route('account.cashier-shifts.reopen', $shift), [
                'reason' => 'Tidak valid',
            ])
            ->assertSessionHasErrors('reason');
    }

    public function test_shift_index_exposes_can_reopen_for_admin_only(): void
    {
        $admin = $this->createAdminUser();
        $cashier = $this->createCashierUser($this->shiftPermissions());

        $this->actingAs($admin)
            ->get(route('account.cashier-shifts.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('canReopen', true));

        $this->actingAs($cashier)
            ->get(route('account.cashier-shifts.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('canReopen', false));
    }

    protected function createClosedShift(User $user): CashierShift
    {
        $openedAt = now()->copy()->startOfDay()->addHours(8);
        $closedAt = now()->copy()->startOfDay()->addHours(16);

        return CashierShift::create([
            'user_id' => $user->id,
            'opened_at' => $openedAt,
            'closed_at' => $closedAt,
            'cash_in_hand' => 100_000,
            'status' => 'closed',
        ]);
    }

    protected function createShiftTransaction(
        User $user,
        Carbon $createdAt,
        int $grandTotal,
        string $paymentMethod,
    ): Transaction {
        $transaction = Transaction::create([
            'cashier_id' => $user->id,
            'invoice' => 'TRX-BEFORE-CLOSE-' . uniqid(),
            'cash' => $paymentMethod === 'cash' ? $grandTotal : 0,
            'change' => 0,
            'discount' => 0,
            'grand_total' => $grandTotal,
            'payment_method' => $paymentMethod,
            'payment_status' => 'paid',
            'status' => 'completed',
        ]);

        $transaction->forceFill([
            'created_at' => $createdAt,
            'updated_at' => $createdAt,
        ])->save();

        return $transaction->fresh();
    }
}
