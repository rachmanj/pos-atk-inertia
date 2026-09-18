<?php

namespace Tests\Feature;

use App\Models\CashierShift;
use App\Models\Transaction;
use App\Models\TransactionPayment;
use App\Services\ShiftCashReconciliation;
use App\Services\ShiftLiveSummary;
use App\Services\ShiftReportBuilder;
use App\Services\Telegram\TelegramPosQueryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\Concerns\PosTestHelpers;
use Tests\TestCase;

class SplitPaymentShiftReconciliationTest extends TestCase
{
    use PosTestHelpers;
    use RefreshDatabase;

    protected TelegramPosQueryService $telegram;

    protected function setUp(): void
    {
        parent::setUp();

        $this->telegram = app(TelegramPosQueryService::class);
    }

    public function test_split_cash_and_qris_reconciliation_counts_each_part(): void
    {
        $user = $this->createCashierUser(['transactions.edit']);
        $shift = $this->createClosedShift($user, 100_000);
        $transaction = $this->createSplitTransaction(
            $user,
            $shift->opened_at->copy()->addHour(),
            100_000,
            [
                ['method' => 'cash', 'amount' => 40_000, 'payment_status' => 'paid'],
                ['method' => 'qris', 'amount' => 60_000, 'payment_status' => 'paid'],
            ],
        );

        $reconciliation = app(ShiftCashReconciliation::class)->build($shift);

        $this->assertSame(40_000, $reconciliation['hanya_cash_sales']);
        $this->assertSame(60_000, $reconciliation['non_cash_sales']);
        $this->assertSame(60_000, $reconciliation['non_tunai']);
        $this->assertSame(40_000, $reconciliation['penjualan_tunai']);
        $this->assertSame(40_000, $reconciliation['tunai_dari_penjualan']);
        $this->assertSame(140_000, $reconciliation['kas_seharusnya']);

        $report = app(ShiftReportBuilder::class)->build($shift);
        $this->assertStringNotContainsString('Tunai dari Penjualan', $report['messageText']);
        $this->assertStringContainsString('CAMPURAN', $report['messageText']);
        $this->assertStringContainsString('Tunai Rp 40.000 + QRIS Rp 60.000', $report['messageText']);
        $this->assertStringContainsString($transaction->invoice, $report['messageText']);
        $this->assertStringNotContainsString('menunggu konfirmasi', $report['messageText']);
    }

    public function test_split_cash_and_pending_transfer_keeps_cash_in_drawer_and_marks_pending(): void
    {
        $user = $this->createCashierUser(['transactions.edit']);
        $shift = $this->createClosedShift($user, 100_000);
        $transaction = $this->createSplitTransaction(
            $user,
            $shift->opened_at->copy()->addHour(),
            100_000,
            [
                ['method' => 'cash', 'amount' => 40_000, 'payment_status' => 'paid'],
                ['method' => 'transfer', 'amount' => 60_000, 'payment_status' => 'pending'],
            ],
            paymentStatus: 'pending',
            status: 'pending',
        );

        $reconciliation = app(ShiftCashReconciliation::class)->build($shift);

        $this->assertSame(40_000, $reconciliation['hanya_cash_sales']);
        $this->assertSame(0, $reconciliation['non_cash_sales']);
        $this->assertSame(60_000, $reconciliation['non_tunai']);
        $this->assertSame(40_000, $reconciliation['tunai_dari_penjualan']);
        $this->assertSame(140_000, $reconciliation['kas_seharusnya']);

        $report = app(ShiftReportBuilder::class)->build($shift);
        $this->assertStringContainsString('CAMPURAN', $report['messageText']);
        $this->assertStringContainsString('Tunai Rp 40.000 + Transfer Rp 60.000', $report['messageText']);
        $this->assertStringContainsString('menunggu konfirmasi', $report['messageText']);

        $pendingMessage = $this->telegram->handlePending($user);
        $this->assertStringContainsString($transaction->invoice, $pendingMessage);
        $this->assertStringContainsString('Rp 60.000', $pendingMessage);
        $this->assertStringContainsString('Total menunggu: Rp 60.000 (1 transaksi)', $pendingMessage);
    }

    public function test_confirm_transfer_on_split_marks_transaction_paid_and_clears_pending(): void
    {
        $user = $this->createCashierUser(['transactions.create', 'transactions.edit']);
        $shift = $this->createClosedShift($user, 100_000);
        $transaction = $this->checkoutSplitCashTransfer($user, $shift->opened_at->copy()->addHour());

        $this->actingAs($user)
            ->post(route('account.transactions.confirm-transfer', $transaction->invoice))
            ->assertRedirect(route('account.transactions.show', $transaction->invoice));

        $transaction->refresh();

        $this->assertSame('paid', $transaction->payment_status);
        $this->assertSame('completed', $transaction->status);
        $this->assertNotNull($transaction->paid_at);
        $this->assertDatabaseHas('transaction_payments', [
            'transaction_id' => $transaction->id,
            'method' => 'transfer',
            'payment_status' => 'paid',
        ]);

        $pendingMessage = $this->telegram->handlePending($user);
        $this->assertSame('✅ Tidak ada transfer yang menunggu konfirmasi.', $pendingMessage);

        $reconciliation = app(ShiftCashReconciliation::class)->build($shift);
        $this->assertSame(40_000, $reconciliation['hanya_cash_sales']);
        $this->assertSame(60_000, $reconciliation['non_cash_sales']);

        $report = app(ShiftReportBuilder::class)->build($shift);
        $this->assertStringNotContainsString('menunggu konfirmasi', $report['messageText']);
    }

    public function test_void_split_transaction_marks_payment_parts_failed_and_restores_reconciliation(): void
    {
        $user = $this->createCashierUser(['transactions.create', 'transactions.void']);
        $shift = $this->createClosedShift($user, 100_000);
        $transaction = $this->checkoutSplitCashQris($user, $shift->opened_at->copy()->addHour());

        $before = app(ShiftCashReconciliation::class)->build($shift);
        $this->assertSame(100_000, $before['total_penjualan']);

        $this->actingAs($user)
            ->put(route('account.transactions.void', $transaction->invoice), [
                'void_reason' => 'Salah input',
            ])
            ->assertRedirect(route('account.transactions.show', $transaction->invoice));

        $transaction->refresh();
        $this->assertSame('voided', $transaction->status);
        $this->assertDatabaseHas('transaction_payments', [
            'transaction_id' => $transaction->id,
            'method' => 'cash',
            'payment_status' => 'failed',
        ]);
        $this->assertDatabaseHas('transaction_payments', [
            'transaction_id' => $transaction->id,
            'method' => 'qris',
            'payment_status' => 'failed',
        ]);

        $after = app(ShiftCashReconciliation::class)->build($shift);
        $this->assertSame(0, $after['total_penjualan']);
        $this->assertSame(0, $after['hanya_cash_sales']);
        $this->assertSame(0, $after['non_cash_sales']);
        $this->assertSame(100_000, $after['kas_seharusnya']);
    }

    public function test_legacy_single_method_transaction_reconciliation_is_unchanged(): void
    {
        $user = $this->createCashierUser();
        $shift = $this->createClosedShift($user, 405_000);

        $this->createLegacyTransaction($user, $shift->opened_at->copy()->addHour(), 2_225_087, 'cash');
        $this->createLegacyTransaction($user, $shift->opened_at->copy()->addHours(2), 51_200, 'qris');

        $reconciliation = app(ShiftCashReconciliation::class)->build($shift);

        $this->assertSame(2_225_087, $reconciliation['hanya_cash_sales']);
        $this->assertSame(51_200, $reconciliation['non_cash_sales']);
        $this->assertSame(51_200, $reconciliation['non_tunai']);
        $this->assertSame(2_225_087, $reconciliation['tunai_dari_penjualan']);
        $this->assertSame(2_630_087, $reconciliation['kas_seharusnya']);
    }

    public function test_telegram_laporan_uses_payment_breakdown_for_split_transactions(): void
    {
        $user = $this->createCashierUser();
        $this->openCashierShift($user);
        $catalog = $this->createPhysicalProduct();
        $this->addCartItem($user, $catalog['product'], $catalog['unit'], 10, 10_000);

        $response = $this->actingAs($user)->postJson(route('account.transactions.store'), [
            'payment_method' => 'cash',
            'cash' => 40_000,
            'payments' => [
                ['method' => 'cash', 'amount' => 40_000],
                ['method' => 'qris', 'amount' => 60_000],
            ],
        ]);

        $response->assertOk();

        Carbon::setTestNow(Carbon::now());

        $message = $this->telegram->handleLaporan($user);

        $this->assertStringContainsString('Tunai: Rp 40.000', $message);
        $this->assertStringContainsString('QRIS: Rp 60.000', $message);
        $this->assertStringContainsString('Omzet:', $message);
        $this->assertStringContainsString('Rp 100.000', $message);
    }

    public function test_live_summary_is_consistent_with_reconciliation_for_split_payment(): void
    {
        $user = $this->createCashierUser(['cashier_shifts.index']);
        $openedAt = Carbon::parse('2026-09-16 08:00:00');

        $shift = CashierShift::create([
            'user_id' => $user->id,
            'opened_at' => $openedAt,
            'cash_in_hand' => 100_000,
            'status' => 'open',
        ]);

        $this->createSplitTransaction(
            $user,
            $openedAt->copy()->addHour(),
            100_000,
            [
                ['method' => 'cash', 'amount' => 40_000, 'payment_status' => 'paid'],
                ['method' => 'transfer', 'amount' => 60_000, 'payment_status' => 'pending'],
            ],
            paymentStatus: 'pending',
            status: 'pending',
        );

        Carbon::setTestNow($openedAt->copy()->addHours(2));

        $summary = app(ShiftLiveSummary::class)->build($shift);
        $reconciliation = app(ShiftCashReconciliation::class)->build($shift, Carbon::now());

        $this->assertSame($reconciliation['hanya_cash_sales'], $summary['cash_sales']);
        $this->assertSame($reconciliation['non_cash_sales'], $summary['non_cash_sales']);
        $this->assertSame($reconciliation['kas_seharusnya'], $summary['expected_cash']);
    }

    public function test_open_shift_without_overage_has_zero_selisih_and_kas_disetor_equals_kas_seharusnya(): void
    {
        $user = $this->createCashierUser();
        $openedAt = Carbon::parse('2026-09-16 08:00:00');

        $shift = CashierShift::create([
            'user_id' => $user->id,
            'opened_at' => $openedAt,
            'cash_in_hand' => 100_000,
            'actual_cash' => 0,
            'status' => 'open',
        ]);

        $this->createSplitTransaction(
            $user,
            $openedAt->copy()->addHour(),
            100_000,
            [
                ['method' => 'cash', 'amount' => 40_000, 'payment_status' => 'paid'],
                ['method' => 'qris', 'amount' => 60_000, 'payment_status' => 'paid'],
            ],
        );

        Carbon::setTestNow($openedAt->copy()->addHours(2));

        $reconciliation = app(ShiftCashReconciliation::class)->build($shift, Carbon::now());

        $this->assertTrue($reconciliation['shift_open']);
        $this->assertSame(140_000, $reconciliation['kas_seharusnya']);
        $this->assertSame(140_000, $reconciliation['kas_disetor']);
        $this->assertSame(0, $reconciliation['selisih']);
    }

    public function test_open_shift_with_cash_overage_reports_positive_selisih(): void
    {
        $user = $this->createCashierUser();
        $openedAt = Carbon::parse('2026-09-16 08:00:00');

        $shift = CashierShift::create([
            'user_id' => $user->id,
            'opened_at' => $openedAt,
            'cash_in_hand' => 100_000,
            'cash_overage' => 5_000,
            'actual_cash' => 0,
            'status' => 'open',
        ]);

        $this->createLegacyTransaction($user, $openedAt->copy()->addHour(), 50_000, 'cash');

        Carbon::setTestNow($openedAt->copy()->addHours(2));

        $reconciliation = app(ShiftCashReconciliation::class)->build($shift, Carbon::now());

        $this->assertTrue($reconciliation['shift_open']);
        $this->assertSame(150_000, $reconciliation['kas_seharusnya']);
        $this->assertSame(155_000, $reconciliation['kas_disetor']);
        $this->assertSame(5_000, $reconciliation['selisih']);
    }

    public function test_closed_shift_reconciliation_uses_actual_cash_for_kas_disetor(): void
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
        ]);

        $this->createLegacyTransaction($user, $openedAt->copy()->addHour(), 1_000_000, 'cash');

        $reconciliation = app(ShiftCashReconciliation::class)->build($shift);

        $this->assertFalse($reconciliation['shift_open']);
        $this->assertSame(1_100_000, $reconciliation['kas_seharusnya']);
        $this->assertSame(1_050_000, $reconciliation['kas_disetor']);
        $this->assertSame(-50_000, $reconciliation['selisih']);
    }

    public function test_shift_show_summary_includes_shift_open_flag(): void
    {
        $user = $this->createCashierUser(['cashier_shifts.index']);
        $openedAt = Carbon::parse('2026-09-16 08:00:00');

        $openShift = CashierShift::create([
            'user_id' => $user->id,
            'opened_at' => $openedAt,
            'cash_in_hand' => 100_000,
            'status' => 'open',
        ]);

        $this->actingAs($user)
            ->get(route('account.cashier-shifts.show', $openShift))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('shift.summary.shift_open', true));

        $closedShift = $this->createClosedShift($user, 100_000);

        $this->actingAs($user)
            ->get(route('account.cashier-shifts.show', $closedShift))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('shift.summary.shift_open', false));
    }

    public function test_open_shift_report_does_not_show_false_kurang_uang_line(): void
    {
        $user = $this->createCashierUser();
        $openedAt = Carbon::parse('2026-09-16 08:00:00');

        $shift = CashierShift::create([
            'user_id' => $user->id,
            'opened_at' => $openedAt,
            'cash_in_hand' => 405_000,
            'actual_cash' => 0,
            'status' => 'open',
        ]);

        $this->createLegacyTransaction($user, $openedAt->copy()->addHour(), 2_225_087, 'cash');
        $this->createLegacyTransaction($user, $openedAt->copy()->addHours(2), 51_200, 'qris');

        Carbon::setTestNow($openedAt->copy()->addHours(3));

        $report = app(ShiftReportBuilder::class)->build($shift);

        $this->assertStringNotContainsString('Kurang Uang', $report['messageText']);
        $this->assertSame(0, $report['selisih']);
    }

    public function test_telegram_transaksi_shows_campuran_label_for_split_payment(): void
    {
        $user = $this->createCashierUser();
        $this->createSplitTransaction(
            $user,
            Carbon::now(),
            100_000,
            [
                ['method' => 'cash', 'amount' => 40_000, 'payment_status' => 'paid'],
                ['method' => 'qris', 'amount' => 60_000, 'payment_status' => 'paid'],
            ],
        );

        $message = $this->telegram->handleTransaksi($user);

        $this->assertStringContainsString('Campuran', $message);
    }

    protected function createClosedShift(\App\Models\User $user, int $cashInHand): CashierShift
    {
        return CashierShift::create([
            'user_id' => $user->id,
            'opened_at' => Carbon::parse('2026-09-16 08:00:00'),
            'closed_at' => Carbon::parse('2026-09-16 16:00:00'),
            'cash_in_hand' => $cashInHand,
            'status' => 'closed',
        ]);
    }

    protected function createSplitTransaction(
        \App\Models\User $user,
        Carbon $createdAt,
        int $grandTotal,
        array $parts,
        string $paymentStatus = 'paid',
        string $status = 'completed',
    ): Transaction {
        $transaction = Transaction::create([
            'cashier_id' => $user->id,
            'invoice' => 'TRX-SPLIT-' . uniqid(),
            'cash' => collect($parts)->firstWhere('method', 'cash')['amount'] ?? 0,
            'change' => 0,
            'discount' => 0,
            'grand_total' => $grandTotal,
            'payment_method' => 'split',
            'payment_status' => $paymentStatus,
            'status' => $status,
            'paid_at' => $paymentStatus === 'paid' ? $createdAt : null,
        ]);

        foreach ($parts as $part) {
            TransactionPayment::create([
                'transaction_id' => $transaction->id,
                'method' => $part['method'],
                'amount' => $part['amount'],
                'payment_status' => $part['payment_status'],
                'paid_at' => $part['payment_status'] === 'paid' ? $createdAt : null,
            ]);
        }

        $transaction->forceFill([
            'created_at' => $createdAt,
            'updated_at' => $createdAt,
        ])->save();

        return $transaction->fresh(['payments']);
    }

    protected function checkoutSplitCashQris(\App\Models\User $user, Carbon $createdAt): Transaction
    {
        $this->openCashierShift($user, 100_000);
        $catalog = $this->createPhysicalProduct();
        $this->addCartItem($user, $catalog['product'], $catalog['unit'], 10, 10_000);

        $response = $this->actingAs($user)->postJson(route('account.transactions.store'), [
            'payment_method' => 'cash',
            'cash' => 40_000,
            'payments' => [
                ['method' => 'cash', 'amount' => 40_000],
                ['method' => 'qris', 'amount' => 60_000],
            ],
        ]);

        $response->assertOk();

        $transaction = Transaction::where('invoice', $response->json('invoice'))->firstOrFail();
        $transaction->forceFill([
            'created_at' => $createdAt,
            'updated_at' => $createdAt,
            'paid_at' => $createdAt,
        ])->save();

        return $transaction->fresh(['payments']);
    }

    protected function checkoutSplitCashTransfer(\App\Models\User $user, Carbon $createdAt): Transaction
    {
        $this->openCashierShift($user, 100_000);
        $catalog = $this->createPhysicalProduct();
        $this->addCartItem($user, $catalog['product'], $catalog['unit'], 10, 10_000);

        $response = $this->actingAs($user)->postJson(route('account.transactions.store'), [
            'payment_method' => 'cash',
            'cash' => 40_000,
            'payments' => [
                ['method' => 'cash', 'amount' => 40_000],
                ['method' => 'transfer', 'amount' => 60_000, 'reference' => 'TRF-TEST'],
            ],
        ]);

        $response->assertOk();

        $transaction = Transaction::where('invoice', $response->json('invoice'))->firstOrFail();
        $transaction->forceFill([
            'created_at' => $createdAt,
            'updated_at' => $createdAt,
        ])->save();

        return $transaction->fresh(['payments']);
    }

    protected function createLegacyTransaction(
        \App\Models\User $user,
        Carbon $createdAt,
        int $grandTotal,
        string $paymentMethod,
    ): Transaction {
        $transaction = Transaction::create([
            'cashier_id' => $user->id,
            'invoice' => 'TRX-LEGACY-' . uniqid(),
            'cash' => $paymentMethod === 'cash' ? $grandTotal : 0,
            'change' => 0,
            'discount' => 0,
            'grand_total' => $grandTotal,
            'payment_method' => $paymentMethod,
            'payment_status' => 'paid',
            'status' => 'completed',
            'paid_at' => $createdAt,
        ]);

        $transaction->forceFill([
            'created_at' => $createdAt,
            'updated_at' => $createdAt,
        ])->save();

        return $transaction->fresh();
    }
}
