<?php

namespace Tests\Feature;

use App\Models\Expense;
use App\Models\PpobAccount;
use App\Models\User;
use App\Services\PpobBalanceService;
use App\Services\ShiftCashReconciliation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\Concerns\PosTestHelpers;
use Tests\TestCase;

class ExpensePaymentSourceTest extends TestCase
{
    use PosTestHelpers;
    use RefreshDatabase;

    protected function createExpenseAdmin(): User
    {
        $this->seedPermissions([
            'expenses.index',
            'expenses.create',
            'expenses.edit',
            'expenses.delete',
            'ppob-balance-logs.store',
            'reports.expense',
        ]);

        $role = Role::findOrCreate(config('roles.admin', 'admin'));
        $role->syncPermissions(Permission::all());

        $user = User::create([
            'name' => 'Expense Admin',
            'username' => 'expense-admin-' . uniqid(),
            'email' => 'expense-admin-' . uniqid() . '@example.com',
            'password' => Hash::make('password'),
        ]);

        $user->assignRole($role);

        return $user;
    }

    protected function createPpobAccount(int $balance = 500_000): PpobAccount
    {
        return PpobAccount::create([
            'name' => 'KIOSK Test',
            'current_balance' => $balance,
            'min_balance_alert' => 50_000,
            'is_active' => true,
        ]);
    }

    protected function expensePayload(array $overrides = []): array
    {
        return array_merge([
            'expense_date' => '2026-09-19',
            'note' => null,
            'payment_source' => 'cash',
            'lines' => [
                [
                    'category' => 'utilities',
                    'title' => 'Internet toko',
                    'amount' => 50_000,
                ],
            ],
        ], $overrides);
    }

    public function test_ppob_expense_deducts_balance_and_sets_balance_log(): void
    {
        $user = $this->createExpenseAdmin();
        $account = $this->createPpobAccount(300_000);

        $this->actingAs($user)->post(route('account.expenses.store'), $this->expensePayload([
            'payment_source' => 'ppob',
            'ppob_account_id' => $account->id,
        ]))->assertRedirect(route('account.expenses.index'));

        $expense = Expense::query()->first();
        $account->refresh();

        $this->assertSame(250_000, $account->current_balance);
        $this->assertNotNull($expense->balance_log_id);
        $this->assertDatabaseHas('ppob_balance_logs', [
            'id' => $expense->balance_log_id,
            'type' => 'adjustment',
            'amount' => -50_000,
            'reference_type' => Expense::class,
            'reference_id' => $expense->id,
        ]);
    }

    public function test_ppob_insufficient_balance_rejects_store(): void
    {
        $user = $this->createExpenseAdmin();
        $account = $this->createPpobAccount(20_000);

        $this->actingAs($user)->from(route('account.expenses.create'))
            ->post(route('account.expenses.store'), $this->expensePayload([
                'payment_source' => 'ppob',
                'ppob_account_id' => $account->id,
            ]))
            ->assertSessionHasErrors('payment_source');

        $this->assertDatabaseCount('expenses', 0);
        $this->assertDatabaseCount('ppob_balance_logs', 0);
        $account->refresh();
        $this->assertSame(20_000, $account->current_balance);
    }

    public function test_ppob_edit_amount_adjusts_balance(): void
    {
        $user = $this->createExpenseAdmin();
        $account = $this->createPpobAccount(300_000);

        $this->actingAs($user)->post(route('account.expenses.store'), $this->expensePayload([
            'payment_source' => 'ppob',
            'ppob_account_id' => $account->id,
        ]));

        $expense = Expense::query()->firstOrFail();

        $this->actingAs($user)->put(route('account.expenses.update', $expense), $this->expensePayload([
            'payment_source' => 'ppob',
            'ppob_account_id' => $account->id,
            'lines' => [
                [
                    'category' => 'utilities',
                    'title' => 'Internet toko',
                    'amount' => 80_000,
                ],
            ],
        ]))->assertRedirect(route('account.expenses.index'));

        $account->refresh();
        $expense->refresh();

        $this->assertSame(220_000, $account->current_balance);
        $this->assertSame(80_000, $expense->amount);
        $this->assertDatabaseHas('ppob_balance_logs', [
            'id' => $expense->balance_log_id,
            'amount' => -80_000,
        ]);
    }

    public function test_ppob_delete_restores_balance(): void
    {
        $user = $this->createExpenseAdmin();
        $account = $this->createPpobAccount(300_000);

        $this->actingAs($user)->post(route('account.expenses.store'), $this->expensePayload([
            'payment_source' => 'ppob',
            'ppob_account_id' => $account->id,
        ]));

        $expense = Expense::query()->firstOrFail();

        $this->actingAs($user)->delete(route('account.expenses.destroy', $expense))
            ->assertRedirect(route('account.expenses.index'));

        $account->refresh();
        $this->assertSame(300_000, $account->current_balance);
        $this->assertDatabaseMissing('expenses', ['id' => $expense->id]);
    }

    public function test_cash_expense_with_open_shift_reduces_kas_seharusnya(): void
    {
        $user = $this->createExpenseAdmin();
        $shift = $this->openCashierShift($user, 100_000);

        $this->actingAs($user)->post(route('account.expenses.store'), $this->expensePayload([
            'payment_source' => 'cash',
            'lines' => [
                [
                    'category' => 'operational',
                    'title' => 'Beli tissue',
                    'amount' => 25_000,
                ],
            ],
        ]))->assertRedirect(route('account.expenses.index'));

        $expense = Expense::query()->first();
        $this->assertSame($shift->id, $expense->cashier_shift_id);

        $reconciliation = app(ShiftCashReconciliation::class)->build($shift->fresh());
        $this->assertSame(25_000, $reconciliation['module_expense_amount']);
        $this->assertSame(75_000, $reconciliation['kas_seharusnya']);
    }

    public function test_cash_expense_without_open_shift_has_null_shift_id(): void
    {
        $user = $this->createExpenseAdmin();

        $this->actingAs($user)->post(route('account.expenses.store'), $this->expensePayload([
            'payment_source' => 'cash',
        ]))->assertRedirect(route('account.expenses.index'));

        $expense = Expense::query()->first();
        $this->assertNull($expense->cashier_shift_id);
    }

    public function test_bank_expense_does_not_touch_ppob_or_shift_cash(): void
    {
        $user = $this->createExpenseAdmin();
        $account = $this->createPpobAccount(200_000);
        $shift = $this->openCashierShift($user, 100_000);

        $this->actingAs($user)->post(route('account.expenses.store'), $this->expensePayload([
            'payment_source' => 'bank',
        ]))->assertRedirect(route('account.expenses.index'));

        $account->refresh();
        $reconciliation = app(ShiftCashReconciliation::class)->build($shift->fresh());

        $this->assertSame(200_000, $account->current_balance);
        $this->assertSame(0, $reconciliation['module_expense_amount']);
        $this->assertSame(100_000, $reconciliation['kas_seharusnya']);
        $this->assertDatabaseCount('ppob_balance_logs', 0);
    }

    public function test_expense_report_filters_and_summarizes_by_payment_source(): void
    {
        $user = $this->createExpenseAdmin();
        $account = $this->createPpobAccount(500_000);

        $this->actingAs($user)->post(route('account.expenses.store'), $this->expensePayload([
            'payment_source' => 'cash',
            'lines' => [['category' => 'operational', 'title' => 'Kas', 'amount' => 10_000]],
        ]));
        $this->actingAs($user)->post(route('account.expenses.store'), $this->expensePayload([
            'payment_source' => 'bank',
            'lines' => [['category' => 'operational', 'title' => 'Bank', 'amount' => 20_000]],
        ]));
        $this->actingAs($user)->post(route('account.expenses.store'), $this->expensePayload([
            'payment_source' => 'ppob',
            'ppob_account_id' => $account->id,
            'lines' => [['category' => 'utilities', 'title' => 'PPOB', 'amount' => 30_000]],
        ]));

        $this->actingAs($user)
            ->get(route('account.reports.expense', [
                'payment_source' => 'ppob',
                'start_date' => '2026-09-01',
                'end_date' => '2026-09-30',
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('summary.total_amount', 30_000)
                ->has('byPaymentSource', 1)
                ->where('byPaymentSource.0.payment_source', 'ppob')
                ->where('byPaymentSource.0.total_amount', 30_000));
    }

    public function test_report_expense_date_is_parseable_for_frontend(): void
    {
        $user = $this->createExpenseAdmin();

        $this->actingAs($user)->post(route('account.expenses.store'), $this->expensePayload([
            'expense_date' => '2026-09-19',
            'lines' => [['category' => 'operational', 'title' => 'ATK', 'amount' => 15_000]],
        ]));

        $response = $this->actingAs($user)
            ->get(route('account.reports.expense', [
                'start_date' => '2026-09-01',
                'end_date' => '2026-09-30',
            ]));

        $response->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('expenses.data', 1));

        $expense = Expense::query()->firstOrFail();
        $this->assertSame('2026-09-19', $expense->expense_date->toDateString());

        $expenseDate = $response->original->getData()['page']['props']['expenses']['data'][0]['expense']['expense_date'];
        $this->assertNotEmpty($expenseDate);
        $this->assertMatchesRegularExpression(
            '/^\d{4}-\d{2}-\d{2}(T|\s|$)/',
            $expenseDate,
            'expense_date must be YYYY-MM-DD or ISO datetime for frontend Date parsing',
        );
    }

    public function test_shift_drawer_expense_and_ppob_sale_remain_unaffected(): void
    {
        $user = $this->createExpenseAdmin();
        $shift = $this->openCashierShift($user, 100_000);
        $account = $this->createPpobAccount(400_000);

        $shift->update(['expense_amount' => 15_000]);

        $reconciliationBefore = app(ShiftCashReconciliation::class)->build($shift->fresh());
        $this->assertSame(15_000, $reconciliationBefore['expense_amount']);
        $this->assertSame(85_000, $reconciliationBefore['kas_seharusnya']);

        app(PpobBalanceService::class)->recordMovement(
            account: $account,
            userId: $user->id,
            type: 'sale',
            amount: -40_000,
            cashierShiftId: $shift->id,
            note: 'Penjualan PPOB test',
        );

        $account->refresh();
        $this->assertSame(360_000, $account->current_balance);
        $this->assertDatabaseHas('ppob_balance_logs', [
            'ppob_account_id' => $account->id,
            'type' => 'sale',
            'amount' => -40_000,
        ]);

        $reconciliationAfter = app(ShiftCashReconciliation::class)->build($shift->fresh());
        $this->assertSame(85_000, $reconciliationAfter['kas_seharusnya']);
        $this->assertSame(15_000, $reconciliationAfter['expense_amount']);
    }
}
