<?php

namespace Tests\Feature;

use App\Models\Expense;
use App\Models\ExpenseLine;
use App\Models\Transaction;
use App\Models\TransactionDetail;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\Concerns\PosTestHelpers;
use Tests\TestCase;

class PpobReportRekapExpenseTest extends TestCase
{
    use PosTestHelpers;
    use RefreshDatabase;

    private const PERIOD_START = '2026-09-15';

    private const PERIOD_END = '2026-09-20';

    protected function createReportUser(): User
    {
        return $this->createCashierUser(['reports.ppob']);
    }

    protected function createAdministratorUser(): User
    {
        $this->seedPermissions(['reports.ppob']);

        $role = Role::findOrCreate(config('roles.admin', 'admin'));
        $role->givePermissionTo('reports.ppob');

        return User::create([
            'name' => 'Administrator',
            'username' => 'admin-' . uniqid(),
            'email' => 'admin-' . uniqid() . '@example.com',
            'password' => Hash::make('password'),
        ])->assignRole($role);
    }

    protected function createPpobSale(User $cashier, int $ppobCost, int $subtotal, ?string $paidAt = null): void
    {
        $paidAt = $paidAt ?? self::PERIOD_START . ' 10:00:00';
        $catalog = $this->createPpobProduct();

        $transaction = Transaction::create([
            'cashier_id' => $cashier->id,
            'invoice' => 'TRX-PPOB-' . uniqid(),
            'cash' => $subtotal,
            'change' => 0,
            'discount' => 0,
            'grand_total' => $subtotal,
            'payment_method' => 'cash',
            'payment_status' => 'paid',
            'status' => 'completed',
            'paid_at' => $paidAt,
        ]);

        TransactionDetail::create([
            'transaction_id' => $transaction->id,
            'product_id' => $catalog['product']->id,
            'conversion_factor' => 1,
            'qty' => 1,
            'price' => $subtotal,
            'buy_price' => 0,
            'subtotal' => $subtotal,
            'ppob_cost' => $ppobCost,
            'admin_fee' => $subtotal - $ppobCost,
        ]);
    }

    protected function createExpense(
        User $user,
        string $expenseDate,
        int $amount,
        string $paymentSource = Expense::PAYMENT_SOURCE_CASH,
    ): Expense {
        $expense = Expense::create([
            'user_id' => $user->id,
            'code' => 'EXP-' . uniqid(),
            'expense_date' => $expenseDate,
            'amount' => $amount,
            'payment_source' => $paymentSource,
            'note' => null,
        ]);

        ExpenseLine::create([
            'expense_id' => $expense->id,
            'category' => 'utilities',
            'title' => 'Biaya Internet toko',
            'amount' => $amount,
        ]);

        return $expense;
    }

    protected function fetchRekap(User $user, array $query = []): array
    {
        $defaults = [
            'start_date' => self::PERIOD_START,
            'end_date' => self::PERIOD_END,
        ];

        $response = $this->actingAs($user)
            ->get(route('account.reports.ppob', array_merge($defaults, $query)));

        $response->assertOk();

        return $response->original->getData()['page']['props']['rekapKasir'] ?? [];
    }

    public function test_ppob_expense_in_period_appears_in_rekap_with_zero_sales(): void
    {
        $admin = $this->createAdministratorUser();
        $viewer = $this->createReportUser();

        $this->createExpense($admin, '2026-09-19', 396_550, Expense::PAYMENT_SOURCE_PPOB);

        $rekap = $this->fetchRekap($viewer);

        $this->assertCount(1, $rekap);
        $this->assertSame('Administrator', $rekap[0]['cashier_name']);
        $this->assertSame(396_550, $rekap[0]['total_harga_dasar']);
        $this->assertSame(0, $rekap[0]['total_penjualan']);
        $this->assertTrue($rekap[0]['has_expense']);
        $this->assertSame(396_550, $rekap[0]['expense_total']);
    }

    public function test_ppob_expense_outside_period_not_in_rekap(): void
    {
        $admin = $this->createAdministratorUser();
        $viewer = $this->createReportUser();

        $this->createExpense($admin, '2026-09-10', 100_000, Expense::PAYMENT_SOURCE_PPOB);

        $rekap = $this->fetchRekap($viewer);

        $this->assertSame([], $rekap);
    }

    public function test_cash_and_bank_expenses_not_in_rekap(): void
    {
        $admin = $this->createAdministratorUser();
        $viewer = $this->createReportUser();

        $this->createExpense($admin, '2026-09-18', 50_000, Expense::PAYMENT_SOURCE_CASH);
        $this->createExpense($admin, '2026-09-18', 75_000, Expense::PAYMENT_SOURCE_BANK);

        $rekap = $this->fetchRekap($viewer);

        $this->assertSame([], $rekap);
    }

    public function test_sales_rekap_unchanged_by_non_ppob_expenses(): void
    {
        $cashier = $this->createReportUser();
        $this->createPpobSale($cashier, 54_500, 57_000);

        $rekapBefore = $this->fetchRekap($cashier);
        $this->assertSame(54_500, $rekapBefore[0]['total_harga_dasar']);
        $this->assertSame(57_000, $rekapBefore[0]['total_penjualan']);
        $this->assertFalse($rekapBefore[0]['has_expense']);

        $this->createExpense($cashier, '2026-09-17', 25_000, Expense::PAYMENT_SOURCE_CASH);

        $rekapAfter = $this->fetchRekap($cashier);
        $this->assertSame(54_500, $rekapAfter[0]['total_harga_dasar']);
        $this->assertSame(57_000, $rekapAfter[0]['total_penjualan']);
        $this->assertFalse($rekapAfter[0]['has_expense']);
    }

    public function test_merges_ppob_expense_into_existing_cashier_sales_row(): void
    {
        $cashier = $this->createReportUser();
        $this->createPpobSale($cashier, 40_000, 42_000);
        $this->createExpense($cashier, '2026-09-16', 10_000, Expense::PAYMENT_SOURCE_PPOB);

        $rekap = $this->fetchRekap($cashier);

        $this->assertCount(1, $rekap);
        $this->assertSame(50_000, $rekap[0]['total_harga_dasar']);
        $this->assertSame(42_000, $rekap[0]['total_penjualan']);
        $this->assertTrue($rekap[0]['has_expense']);
        $this->assertSame(10_000, $rekap[0]['expense_total']);
    }

    public function test_cashier_filter_limits_ppob_expense_rows(): void
    {
        $cashierA = $this->createReportUser();
        $cashierB = $this->createCashierUser(['reports.ppob']);

        $this->createExpense($cashierA, '2026-09-18', 20_000, Expense::PAYMENT_SOURCE_PPOB);
        $this->createExpense($cashierB, '2026-09-18', 30_000, Expense::PAYMENT_SOURCE_PPOB);

        $rekap = $this->fetchRekap($cashierA, ['cashier_id' => $cashierB->id]);

        $this->assertCount(1, $rekap);
        $this->assertSame($cashierB->id, $rekap[0]['user_id']);
        $this->assertSame(30_000, $rekap[0]['total_harga_dasar']);
    }

    public function test_summary_cards_exclude_ppob_expenses(): void
    {
        $admin = $this->createAdministratorUser();
        $viewer = $this->createReportUser();

        $this->createExpense($admin, '2026-09-19', 396_550, Expense::PAYMENT_SOURCE_PPOB);

        $this->actingAs($viewer)
            ->get(route('account.reports.ppob', [
                'start_date' => self::PERIOD_START,
                'end_date' => self::PERIOD_END,
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('summary.total_omzet', 0)
                ->where('summary.total_cost', 0)
                ->has('rekapKasir', 1)
                ->where('rekapKasir.0.total_harga_dasar', 396_550));
    }
}
