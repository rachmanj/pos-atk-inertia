<?php

namespace Tests\Feature;

use App\Models\CashierShift;
use App\Models\Transaction;
use App\Services\ShiftReportBuilder;
use App\Services\Telegram\TelegramFormatter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\Concerns\PosTestHelpers;
use Tests\TestCase;

/**
 * Rekap shift: "Tunai Disetor" = uang fisik (actual_cash), bukan kas dari penjualan.
 */
class ShiftReportTest extends TestCase
{
    use PosTestHelpers;
    use RefreshDatabase;

    public function test_report_menampilkan_tunai_dari_penjualan_dan_tunai_disetor_fisik_dengan_kelebihan(): void
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
            'actual_cash' => 1_150_000,
            'cash_overage' => 50_000,
            'overage_note' => 'lebih',
            'difference' => 50_000,
        ]);

        $this->createShiftTransaction($user, $openedAt->copy()->addHour(), 1_000_000, 'cash');

        $report = app(ShiftReportBuilder::class)->build($shift);

        $tunaiDariPenjualan = 1_000_000;
        $kasSeharusnya = 1_100_000;
        $actualCash = 1_150_000;
        $selisih = 50_000;

        $this->assertSame($tunaiDariPenjualan, $report['tunaiDariPenjualan']);
        $this->assertSame($kasSeharusnya, $report['kas_seharusnya']);
        $this->assertSame($actualCash, $report['tunaiDisetor']);
        $this->assertSame($selisih, $report['selisih']);
        $this->assertStringContainsString(
            str_pad('Tunai dari Penjualan', 21) . ': ' . TelegramFormatter::idr($tunaiDariPenjualan),
            $report['messageText']
        );
        $this->assertStringContainsString(
            str_pad('Kas Seharusnya', 21) . ': ' . TelegramFormatter::idr($kasSeharusnya),
            $report['messageText']
        );
        $this->assertStringContainsString(
            str_pad('Kelebihan Uang', 21) . ': ' . TelegramFormatter::idr($selisih),
            $report['messageText']
        );
        $this->assertStringContainsString('  lebih', $report['messageText']);
        $this->assertStringContainsString(
            str_pad('Tunai Disetor', 21) . ': ' . TelegramFormatter::idr($actualCash),
            $report['messageText']
        );
    }

    public function test_report_menampilkan_kurang_uang_bila_fisik_lebih_kecil_dari_estimasi(): void
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
            'actual_cash' => 450_000,
            'cash_overage' => 0,
            'difference' => -150_000,
        ]);

        $this->createShiftTransaction($user, $openedAt->copy()->addHour(), 500_000, 'cash');

        $report = app(ShiftReportBuilder::class)->build($shift);

        $tunaiDariPenjualan = 500_000;
        $kasSeharusnya = 600_000;
        $actualCash = 450_000;
        $kurangUang = 150_000;

        $this->assertSame($tunaiDariPenjualan, $report['tunaiDariPenjualan']);
        $this->assertSame($kasSeharusnya, $report['kas_seharusnya']);
        $this->assertSame($actualCash, $report['tunaiDisetor']);
        $this->assertStringContainsString(
            str_pad('Kurang Uang', 21) . ': ' . TelegramFormatter::idr($kurangUang),
            $report['messageText']
        );
        $this->assertStringContainsString(
            str_pad('Tunai Disetor', 21) . ': ' . TelegramFormatter::idr($actualCash),
            $report['messageText']
        );
        $this->assertStringNotContainsString('Kelebihan Uang', $report['messageText']);
    }

    public function test_report_fallback_tunai_disetor_bila_actual_cash_null(): void
    {
        $user = $this->createCashierUser();
        $openedAt = Carbon::parse('2026-09-12 08:00:00');
        $closedAt = Carbon::parse('2026-09-12 16:00:00');

        $shift = CashierShift::create([
            'user_id' => $user->id,
            'opened_at' => $openedAt,
            'closed_at' => $closedAt,
            'cash_in_hand' => 100_000,
            'status' => 'open',
            'cash_overage' => 20_000,
        ]);

        $this->createShiftTransaction($user, $openedAt->copy()->addHour(), 300_000, 'cash');

        $shift->actual_cash = null;

        $report = app(ShiftReportBuilder::class)->build($shift);

        $tunaiDariPenjualan = 300_000;
        $tunaiDisetorFallback = 420_000;

        $this->assertSame($tunaiDariPenjualan, $report['tunaiDariPenjualan']);
        $this->assertSame($tunaiDisetorFallback, $report['tunaiDisetor']);
        $this->assertStringContainsString(
            str_pad('Tunai Disetor', 21) . ': ' . TelegramFormatter::idr($tunaiDisetorFallback),
            $report['messageText']
        );
    }

    protected function createShiftTransaction(
        \App\Models\User $user,
        Carbon $createdAt,
        int $grandTotal,
        string $paymentMethod,
    ): Transaction {
        $transaction = Transaction::create([
            'cashier_id' => $user->id,
            'invoice' => 'TRX-SHIFT-' . uniqid(),
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
