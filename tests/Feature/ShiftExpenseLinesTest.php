<?php

namespace Tests\Feature;

use App\Models\CashierShift;
use App\Models\CashierShiftExpense;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\Concerns\PosTestHelpers;
use Tests\TestCase;

class ShiftExpenseLinesTest extends TestCase
{
    use PosTestHelpers;
    use RefreshDatabase;

    public function test_report_preview_persists_multiple_expense_lines(): void
    {
        $user = $this->createCashierUser(['cashier_shifts.index']);

        $shift = $this->createClosedShift($user);

        $response = $this->actingAs($user)
            ->postJson(route('account.cashier-shifts.report.preview', $shift), [
                'expenses' => [
                    ['title' => 'Beli bensin', 'amount' => 100_000],
                    ['title' => 'Beli ATK', 'amount' => 25_000],
                ],
            ])
            ->assertOk()
            ->assertJson(['ok' => true]);

        $this->assertSame(2, CashierShiftExpense::query()->where('cashier_shift_id', $shift->id)->count());

        $shift->refresh();

        $this->assertSame(125_000, $shift->expense_amount);
        $this->assertNull($shift->expense_note);

        $text = $response->json('text');
        $this->assertStringContainsString('Beli bensin', $text);
        $this->assertStringContainsString('Beli ATK', $text);
        $this->assertStringContainsString('  - Rp 100.000 Beli bensin', $text);
        $this->assertStringContainsString('  - Rp 25.000 Beli ATK', $text);
    }

    public function test_report_preview_with_empty_expenses_clears_existing_lines(): void
    {
        $user = $this->createCashierUser(['cashier_shifts.index']);

        $shift = $this->createClosedShift($user);

        CashierShiftExpense::create([
            'cashier_shift_id' => $shift->id,
            'title' => 'Pengeluaran lama',
            'amount' => 50_000,
        ]);

        $shift->update([
            'expense_amount' => 50_000,
            'expense_note' => 'Catatan lama',
        ]);

        $this->actingAs($user)
            ->postJson(route('account.cashier-shifts.report.preview', $shift), [
                'expenses' => [],
            ])
            ->assertOk()
            ->assertJson(['ok' => true]);

        $this->assertSame(0, CashierShiftExpense::query()->where('cashier_shift_id', $shift->id)->count());

        $shift->refresh();

        $this->assertSame(0, $shift->expense_amount);
        $this->assertNull($shift->expense_note);
    }

    public function test_report_preview_ignores_empty_expense_line_when_mixed_with_valid_line(): void
    {
        $user = $this->createCashierUser(['cashier_shifts.index']);

        $shift = $this->createClosedShift($user);

        $this->actingAs($user)
            ->postJson(route('account.cashier-shifts.report.preview', $shift), [
                'expenses' => [
                    ['title' => '', 'amount' => 0],
                    ['title' => 'Beli ATK', 'amount' => 25_000],
                ],
            ])
            ->assertOk()
            ->assertJson(['ok' => true]);

        $this->assertSame(1, CashierShiftExpense::query()->where('cashier_shift_id', $shift->id)->count());

        $expense = CashierShiftExpense::query()->where('cashier_shift_id', $shift->id)->first();
        $this->assertSame('Beli ATK', $expense->title);
        $this->assertSame(25_000, $expense->amount);

        $shift->refresh();

        $this->assertSame(25_000, $shift->expense_amount);
    }

    public function test_report_preview_rejects_expense_line_with_amount_but_no_title(): void
    {
        $user = $this->createCashierUser(['cashier_shifts.index']);

        $shift = $this->createClosedShift($user);

        $this->actingAs($user)
            ->postJson(route('account.cashier-shifts.report.preview', $shift), [
                'expenses' => [
                    ['title' => '', 'amount' => 10_000],
                ],
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['expenses']);
    }

    public function test_shift_show_includes_synthesized_expense_for_legacy_data(): void
    {
        $user = $this->createCashierUser(['cashier_shifts.index']);

        $shift = $this->createClosedShift($user);

        $shift->update([
            'expense_amount' => 80_000,
            'expense_note' => 'Operasional harian',
        ]);

        $this->actingAs($user)
            ->get(route('account.cashier-shifts.show', $shift))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('shift.expenses', 1)
                ->where('shift.expenses.0.id', null)
                ->where('shift.expenses.0.title', 'Operasional harian')
                ->where('shift.expenses.0.amount', 80_000));
    }

    protected function createClosedShift(\App\Models\User $user): CashierShift
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
}
