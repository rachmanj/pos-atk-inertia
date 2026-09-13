<?php

namespace Tests\Feature;

use App\Models\CashierShift;
use App\Models\Transaction;
use App\Services\ShiftLiveSummary;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\Concerns\PosTestHelpers;
use Tests\TestCase;

class ShiftLiveSummaryTest extends TestCase
{
    use PosTestHelpers;
    use RefreshDatabase;

    public function test_service_menghitung_ringkasan_live_shift_dengan_benar(): void
    {
        $user = $this->createCashierUser(['cashier_shifts.index']);
        $openedAt = Carbon::parse('2026-09-13 08:00:00');
        $cashInHand = 100_000;

        $shift = CashierShift::create([
            'user_id' => $user->id,
            'opened_at' => $openedAt,
            'cash_in_hand' => $cashInHand,
            'status' => 'open',
        ]);

        $cashSales = 50_000;
        $qrisSales = 75_000;

        $this->createShiftTransaction($user, $openedAt->copy()->addHour(), $cashSales, 'cash', 'paid');
        $this->createShiftTransaction($user, $openedAt->copy()->addHours(2), $qrisSales, 'qris', 'paid');
        $this->createShiftTransaction($user, $openedAt->copy()->addHours(3), 30_000, 'transfer', 'pending');
        $this->createShiftTransaction($user, $openedAt->copy()->addHours(4), 20_000, 'cash', 'paid', 'voided');

        $summary = app(ShiftLiveSummary::class)->build($shift);

        $this->assertSame($cashSales + $qrisSales, $summary['total_sales']);
        $this->assertSame($cashSales, $summary['cash_sales']);
        $this->assertSame($qrisSales, $summary['non_cash_sales']);
        $this->assertSame($cashInHand + $cashSales, $summary['expected_cash']);
        $this->assertSame(3, $summary['total_transactions']);
        $this->assertSame(2, $summary['paid_transactions']);
    }

    public function test_active_summary_endpoint_mengembalikan_angka_shift_aktif(): void
    {
        $user = $this->createCashierUser(['cashier_shifts.index']);
        $openedAt = Carbon::parse('2026-09-13 08:00:00');
        $cashInHand = 100_000;

        $shift = CashierShift::create([
            'user_id' => $user->id,
            'opened_at' => $openedAt,
            'cash_in_hand' => $cashInHand,
            'status' => 'open',
        ]);

        $cashSales = 50_000;
        $qrisSales = 75_000;

        $this->createShiftTransaction($user, $openedAt->copy()->addHour(), $cashSales, 'cash', 'paid');
        $this->createShiftTransaction($user, $openedAt->copy()->addHours(2), $qrisSales, 'qris', 'paid');
        $this->createShiftTransaction($user, $openedAt->copy()->addHours(3), 30_000, 'transfer', 'pending');
        $this->createShiftTransaction($user, $openedAt->copy()->addHours(4), 20_000, 'cash', 'paid', 'voided');

        $this->actingAs($user)
            ->getJson(route('account.cashier-shifts.active-summary'))
            ->assertOk()
            ->assertJson([
                'has_shift' => true,
                'shift' => [
                    'id' => $shift->id,
                    'total_sales' => $cashSales + $qrisSales,
                    'cash_sales' => $cashSales,
                    'non_cash_sales' => $qrisSales,
                    'expected_cash' => $cashInHand + $cashSales,
                    'total_transactions' => 3,
                    'paid_transactions' => 2,
                ],
            ]);
    }

    public function test_active_summary_endpoint_tanpa_shift_aktif(): void
    {
        $user = $this->createCashierUser(['cashier_shifts.index']);

        $this->actingAs($user)
            ->getJson(route('account.cashier-shifts.active-summary'))
            ->assertOk()
            ->assertJson(['has_shift' => false]);
    }

    public function test_active_summary_route_tidak_tertangkap_oleh_show(): void
    {
        $user = $this->createCashierUser(['cashier_shifts.index']);

        $this->actingAs($user)
            ->get(route('account.cashier-shifts.active-summary'))
            ->assertOk()
            ->assertJsonStructure(['has_shift']);
    }

    protected function createShiftTransaction(
        \App\Models\User $user,
        Carbon $createdAt,
        int $grandTotal,
        string $paymentMethod,
        string $paymentStatus = 'paid',
        string $status = 'completed',
    ): Transaction {
        $transaction = Transaction::create([
            'cashier_id' => $user->id,
            'invoice' => 'TRX-LIVE-' . uniqid(),
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
