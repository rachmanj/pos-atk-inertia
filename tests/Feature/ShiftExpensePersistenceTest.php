<?php

namespace Tests\Feature;

use App\Models\CashierShift;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\Concerns\PosTestHelpers;
use Tests\TestCase;

class ShiftExpensePersistenceTest extends TestCase
{
    use PosTestHelpers;
    use RefreshDatabase;

    public function test_report_preview_persists_expense_fields_on_shift(): void
    {
        $user = $this->createCashierUser(['cashier_shifts.index']);

        $openedAt = now()->copy()->startOfDay()->addHours(8);
        $closedAt = now()->copy()->startOfDay()->addHours(16);

        $shift = CashierShift::create([
            'user_id' => $user->id,
            'opened_at' => $openedAt,
            'closed_at' => $closedAt,
            'cash_in_hand' => 100_000,
            'status' => 'closed',
        ]);

        $this->actingAs($user)
            ->postJson(route('account.cashier-shifts.report.preview', $shift), [
                'expense_amount' => 75_000,
                'expense_note' => 'Beli bensin operasional',
            ])
            ->assertOk()
            ->assertJson(['ok' => true]);

        $shift->refresh();

        $this->assertSame(75_000, $shift->expense_amount);
        $this->assertSame('Beli bensin operasional', $shift->expense_note);
    }

    public function test_shift_show_page_includes_persisted_expense_fields(): void
    {
        $user = $this->createCashierUser(['cashier_shifts.index']);

        $openedAt = now()->copy()->startOfDay()->addHours(8);
        $closedAt = now()->copy()->startOfDay()->addHours(16);

        $shift = CashierShift::create([
            'user_id' => $user->id,
            'opened_at' => $openedAt,
            'closed_at' => $closedAt,
            'cash_in_hand' => 100_000,
            'status' => 'closed',
        ]);

        $this->actingAs($user)
            ->postJson(route('account.cashier-shifts.report.preview', $shift), [
                'expense_amount' => 50_000,
                'expense_note' => 'Pembelian ATK',
            ])
            ->assertOk();

        $this->actingAs($user)
            ->get(route('account.cashier-shifts.show', $shift))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('shift.expense_amount', 50_000)
                ->where('shift.expense_note', 'Pembelian ATK'));
    }
}
