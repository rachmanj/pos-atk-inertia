<?php

namespace Tests\Feature;

use App\Models\Expense;
use App\Models\ExpenseLine;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\Concerns\PosTestHelpers;
use Tests\TestCase;

class ExpenseTest extends TestCase
{
    use PosTestHelpers;
    use RefreshDatabase;

    protected function createAdminUser(): User
    {
        $this->seedPermissions([
            'expenses.index',
            'expenses.create',
            'expenses.edit',
            'expenses.delete',
        ]);

        $role = Role::findOrCreate(config('roles.admin', 'admin'));
        $role->syncPermissions(Permission::all());

        $user = User::create([
            'name' => 'Test Admin',
            'username' => 'admin-test-' . uniqid(),
            'email' => 'admin-test-' . uniqid() . '@example.com',
            'password' => Hash::make('password'),
        ]);

        $user->assignRole($role);

        return $user;
    }

    public function test_store_multi_line_expense_creates_lines_and_header_total(): void
    {
        $user = $this->createAdminUser();

        $response = $this->actingAs($user)->post(route('account.expenses.store'), [
            'expense_date' => '2026-09-12',
            'note' => 'Catatan pengeluaran',
            'lines' => [
                [
                    'category' => 'operational',
                    'title' => 'ATK kantor',
                    'amount' => 50_000,
                ],
                [
                    'category' => 'transport',
                    'title' => 'Ongkos kirim',
                    'amount' => 25_000,
                ],
            ],
        ]);

        $response->assertRedirect(route('account.expenses.index'));

        $expense = Expense::query()->first();
        $this->assertNotNull($expense);
        $this->assertSame(75_000, $expense->amount);
        $this->assertDatabaseCount('expense_lines', 2);
        $this->assertDatabaseHas('expense_lines', [
            'expense_id' => $expense->id,
            'category' => 'operational',
            'title' => 'ATK kantor',
            'amount' => 50_000,
        ]);
        $this->assertDatabaseHas('expense_lines', [
            'expense_id' => $expense->id,
            'category' => 'transport',
            'title' => 'Ongkos kirim',
            'amount' => 25_000,
        ]);
    }

    public function test_update_replaces_lines_and_recomputes_total(): void
    {
        $user = $this->createAdminUser();

        $expense = Expense::create([
            'user_id' => $user->id,
            'code' => 'EXP-TEST-001',
            'expense_date' => '2026-09-10',
            'amount' => 100_000,
            'note' => 'Awal',
        ]);

        $expense->lines()->createMany([
            [
                'category' => 'operational',
                'title' => 'Baris lama 1',
                'amount' => 60_000,
            ],
            [
                'category' => 'rent',
                'title' => 'Baris lama 2',
                'amount' => 40_000,
            ],
        ]);

        $response = $this->actingAs($user)->put(route('account.expenses.update', $expense), [
            'expense_date' => '2026-09-11',
            'note' => 'Diperbarui',
            'lines' => [
                [
                    'category' => 'utilities',
                    'title' => 'Listrik',
                    'amount' => 30_000,
                ],
                [
                    'category' => 'maintenance',
                    'title' => 'Service AC',
                    'amount' => 20_000,
                ],
                [
                    'category' => 'other',
                    'title' => 'Lainnya',
                    'amount' => 10_000,
                ],
            ],
        ]);

        $response->assertRedirect(route('account.expenses.index'));

        $expense->refresh();

        $this->assertSame(60_000, $expense->amount);
        $this->assertSame('Diperbarui', $expense->note);
        $this->assertDatabaseCount('expense_lines', 3);
        $this->assertDatabaseMissing('expense_lines', [
            'expense_id' => $expense->id,
            'title' => 'Baris lama 1',
        ]);
        $this->assertDatabaseHas('expense_lines', [
            'expense_id' => $expense->id,
            'category' => 'utilities',
            'title' => 'Listrik',
            'amount' => 30_000,
        ]);
    }

    public function test_cashier_can_access_index_create_edit_but_not_delete(): void
    {
        $cashier = $this->createCashierUser([
            'expenses.index',
            'expenses.create',
            'expenses.edit',
        ]);

        $expense = Expense::create([
            'user_id' => $cashier->id,
            'code' => 'EXP-CASHIER-001',
            'expense_date' => '2026-09-12',
            'amount' => 15_000,
            'note' => null,
        ]);

        ExpenseLine::create([
            'expense_id' => $expense->id,
            'category' => 'operational',
            'title' => 'Pengeluaran kasir',
            'amount' => 15_000,
        ]);

        $this->actingAs($cashier)->get(route('account.expenses.index'))->assertOk();
        $this->actingAs($cashier)->get(route('account.expenses.create'))->assertOk();
        $this->actingAs($cashier)->get(route('account.expenses.edit', $expense))->assertOk();
        $this->actingAs($cashier)->delete(route('account.expenses.destroy', $expense))->assertForbidden();
    }
}
