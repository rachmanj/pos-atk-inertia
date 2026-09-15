<?php

namespace Tests\Feature;

use App\Models\CashierShift;
use App\Models\Transaction;
use App\Services\ShiftCashReconciliation;
use App\Services\ShiftReportBuilder;
use App\Services\Telegram\TelegramFormatter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\Concerns\PosTestHelpers;
use Tests\TestCase;

class ShiftCashReconciliationTest extends TestCase
{
    use PosTestHelpers;
    use RefreshDatabase;

    public function test_kas_seharusnya_mengurangi_pengeluaran_dari_laci(): void
    {
        $user = $this->createCashierUser();
        $openedAt = Carbon::parse('2026-09-15 08:00:00');
        $closedAt = Carbon::parse('2026-09-15 16:00:00');

        $shift = CashierShift::create([
            'user_id' => $user->id,
            'opened_at' => $openedAt,
            'closed_at' => $closedAt,
            'cash_in_hand' => 405_000,
            'status' => 'closed',
            'actual_cash' => 2_662_087,
            'expense_amount' => 130_000,
        ]);

        $this->createShiftTransaction($user, $openedAt->copy()->addHour(), 2_225_087, 'cash');
        $this->createShiftTransaction($user, $openedAt->copy()->addHours(2), 51_200, 'qris');

        $reconciliation = app(ShiftCashReconciliation::class)->build($shift);

        $this->assertSame(2_225_087, $reconciliation['hanya_cash_sales']);
        $this->assertSame(51_200, $reconciliation['non_cash_sales']);
        $this->assertSame(130_000, $reconciliation['expense_amount']);
        $this->assertSame(405_000, $reconciliation['kas_awal']);
        $this->assertSame(2_095_087, $reconciliation['tunai_dari_penjualan']);
        $this->assertSame(2_500_087, $reconciliation['kas_seharusnya']);
        $this->assertSame(2_662_087, $reconciliation['kas_disetor']);
        $this->assertSame(162_000, $reconciliation['selisih']);
    }

    public function test_selisih_adalah_kas_disetor_dikurangi_kas_seharusnya(): void
    {
        $user = $this->createCashierUser();
        $openedAt = Carbon::parse('2026-09-12 08:00:00');
        $closedAt = Carbon::parse('2026-09-12 16:00:00');

        $shift = CashierShift::create([
            'user_id' => $user->id,
            'opened_at' => $openedAt,
            'closed_at' => $closedAt,
            'cash_in_hand' => 100_000,
            'status' => 'closed',
            'actual_cash' => 1_050_000,
            'cash_overage' => 50_000,
            'expense_amount' => 0,
        ]);

        $this->createShiftTransaction($user, $openedAt->copy()->addHour(), 1_000_000, 'cash');

        $reconciliation = app(ShiftCashReconciliation::class)->build($shift);

        $this->assertSame(1_100_000, $reconciliation['kas_seharusnya']);
        $this->assertSame(1_050_000, $reconciliation['kas_disetor']);
        $this->assertSame(-50_000, $reconciliation['selisih']);
        $this->assertSame(
            $reconciliation['kas_disetor'] - $reconciliation['kas_seharusnya'],
            $reconciliation['selisih'],
        );
    }

    public function test_report_memuat_kas_awal_pengeluaran_dari_laci_dan_kas_seharusnya(): void
    {
        $user = $this->createCashierUser();
        $openedAt = Carbon::parse('2026-09-15 08:00:00');
        $closedAt = Carbon::parse('2026-09-15 16:00:00');

        $shift = CashierShift::create([
            'user_id' => $user->id,
            'opened_at' => $openedAt,
            'closed_at' => $closedAt,
            'cash_in_hand' => 405_000,
            'status' => 'closed',
            'actual_cash' => 2_662_087,
            'expense_amount' => 130_000,
        ]);

        $this->createShiftTransaction($user, $openedAt->copy()->addHour(), 2_225_087, 'cash');
        $this->createShiftTransaction($user, $openedAt->copy()->addHours(2), 51_200, 'qris');

        $report = app(ShiftReportBuilder::class)->build($shift, 130_000);

        $this->assertStringContainsString(
            str_pad('Kas Awal', 21) . ': ' . TelegramFormatter::idr(405_000),
            $report['messageText'],
        );
        $this->assertStringContainsString(
            str_pad('Pengeluaran dari Laci', 21) . ': -Rp 130.000',
            $report['messageText'],
        );
        $this->assertStringContainsString(
            str_pad('Kas Seharusnya', 21) . ': ' . TelegramFormatter::idr(2_500_087),
            $report['messageText'],
        );
        $this->assertStringContainsString(
            str_pad('Kelebihan Uang', 21) . ': ' . TelegramFormatter::idr(162_000),
            $report['messageText'],
        );
        $this->assertStringContainsString(
            str_pad('Tunai Disetor', 21) . ': ' . TelegramFormatter::idr(2_662_087),
            $report['messageText'],
        );
    }

    public function test_persist_expense_on_closed_shift_recalculates_expected_cash_and_difference(): void
    {
        $user = $this->createCashierUser(['cashier_shifts.index']);
        $openedAt = Carbon::parse('2026-09-15 08:00:00');
        $closedAt = Carbon::parse('2026-09-15 16:00:00');

        $shift = CashierShift::create([
            'user_id' => $user->id,
            'opened_at' => $openedAt,
            'closed_at' => $closedAt,
            'cash_in_hand' => 405_000,
            'status' => 'closed',
            'actual_cash' => 2_662_087,
            'expected_cash' => 2_630_087,
            'difference' => 32_000,
            'expense_amount' => 0,
        ]);

        $this->createShiftTransaction($user, $openedAt->copy()->addHour(), 2_225_087, 'cash');
        $this->createShiftTransaction($user, $openedAt->copy()->addHours(2), 51_200, 'qris');

        $this->actingAs($user)
            ->postJson(route('account.cashier-shifts.report.preview', $shift), [
                'expense_amount' => 130_000,
                'expense_note' => 'Operasional',
            ])
            ->assertOk();

        $shift->refresh();

        $this->assertSame(130_000, $shift->expense_amount);
        $this->assertSame(2_500_087, $shift->expected_cash);
        $this->assertSame(162_000, $shift->difference);
    }

    protected function createShiftTransaction(
        \App\Models\User $user,
        Carbon $createdAt,
        int $grandTotal,
        string $paymentMethod,
    ): Transaction {
        $transaction = Transaction::create([
            'cashier_id' => $user->id,
            'invoice' => 'TRX-RECON-' . uniqid(),
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
