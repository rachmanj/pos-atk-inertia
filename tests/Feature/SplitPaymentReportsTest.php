<?php

namespace Tests\Feature;

use App\Exports\SalesReportExport;
use App\Models\Transaction;
use App\Models\TransactionPayment;
use App\Services\TransactionPaymentAggregator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\Concerns\PosTestHelpers;
use Tests\TestCase;

class SplitPaymentReportsTest extends TestCase
{
    use PosTestHelpers;
    use RefreshDatabase;

    public function test_sales_report_summary_uses_payment_breakdown_for_split_transactions(): void
    {
        $user = $this->createCashierUser(['reports.sales']);
        $paidAt = Carbon::parse('2026-09-16 12:00:00');

        $this->createSplitTransaction($user, $paidAt, 100_000, [
            ['method' => 'cash', 'amount' => 40_000, 'payment_status' => 'paid'],
            ['method' => 'qris', 'amount' => 60_000, 'payment_status' => 'paid'],
        ]);

        $this->createLegacyTransaction($user, $paidAt->copy()->addHour(), 50_000, 'cash');

        $this->actingAs($user)
            ->get(route('account.reports.sales', [
                'start_date' => '2026-09-16',
                'end_date' => '2026-09-16',
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('summary.total_sales', 150_000)
                ->where('summary.cash_sales', 90_000)
                ->where('summary.qris_sales', 60_000)
                ->where('summary.transfer_sales', 0)
                ->where('summary.digital_sales', 0));
    }

    public function test_sales_report_cash_filter_includes_split_transactions_with_cash_part_only(): void
    {
        $user = $this->createCashierUser(['reports.sales']);
        $paidAt = Carbon::parse('2026-09-16 12:00:00');

        $split = $this->createSplitTransaction($user, $paidAt, 100_000, [
            ['method' => 'cash', 'amount' => 40_000, 'payment_status' => 'paid'],
            ['method' => 'qris', 'amount' => 60_000, 'payment_status' => 'paid'],
        ]);

        $this->createLegacyTransaction($user, $paidAt->copy()->addHour(), 50_000, 'qris');

        $this->actingAs($user)
            ->get(route('account.reports.sales', [
                'start_date' => '2026-09-16',
                'end_date' => '2026-09-16',
                'payment_method' => 'cash',
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('sales.data', 1)
                ->where('sales.data.0.invoice', $split->invoice)
                ->where('summary.total_sales', 100_000)
                ->where('summary.cash_sales', 40_000)
                ->where('summary.qris_sales', 0)
                ->where('summary.digital_sales', 0)
                ->where('summary.transfer_sales', 0));
    }

    public function test_sales_report_total_omzet_unchanged_for_legacy_single_method_transactions(): void
    {
        $user = $this->createCashierUser(['reports.sales']);
        $paidAt = Carbon::parse('2026-09-16 12:00:00');

        $this->createLegacyTransaction($user, $paidAt, 75_000, 'cash');
        $this->createLegacyTransaction($user, $paidAt->copy()->addHour(), 25_000, 'qris');

        $this->actingAs($user)
            ->get(route('account.reports.sales', [
                'start_date' => '2026-09-16',
                'end_date' => '2026-09-16',
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('summary.total_sales', 100_000)
                ->where('summary.cash_sales', 75_000)
                ->where('summary.qris_sales', 25_000));
    }

    public function test_dashboard_method_totals_use_payment_breakdown(): void
    {
        $user = $this->createCashierUser(['dashboard.index']);

        $paidAt = Carbon::now();

        $this->createSplitTransaction($user, $paidAt, 100_000, [
            ['method' => 'cash', 'amount' => 30_000, 'payment_status' => 'paid'],
            ['method' => 'transfer', 'amount' => 70_000, 'payment_status' => 'paid'],
        ]);

        $this->createLegacyTransaction($user, $paidAt->copy()->addMinute(), 20_000, 'qris');

        $this->actingAs($user)
            ->get(route('account.dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('summary.today_sales', 120_000)
                ->where('summary.today_cash_sales', 30_000)
                ->where('summary.today_qris_sales', 20_000)
                ->where('summary.today_transfer_sales', 70_000)
                ->where('summary.today_digital_sales', 0));
    }

    public function test_sales_report_export_matches_on_screen_method_totals(): void
    {
        $user = $this->createCashierUser(['reports.sales', 'reports.export']);
        $paidAt = Carbon::parse('2026-09-16 12:00:00');

        $this->createSplitTransaction($user, $paidAt, 100_000, [
            ['method' => 'cash', 'amount' => 40_000, 'payment_status' => 'paid'],
            ['method' => 'qris', 'amount' => 60_000, 'payment_status' => 'paid'],
        ]);

        $this->createLegacyTransaction($user, $paidAt->copy()->addHour(), 50_000, 'cash');

        $this->actingAs($user)
            ->get(route('account.reports.sales', [
                'start_date' => '2026-09-16',
                'end_date' => '2026-09-16',
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('summary.total_sales', 150_000)
                ->where('summary.cash_sales', 90_000)
                ->where('summary.qris_sales', 60_000));

        $exportTransactions = (new SalesReportExport([
            'start_date' => '2026-09-16',
            'end_date' => '2026-09-16',
            'cashier_id' => $user->id,
        ]))->query()->with('payments')->get();

        $exportTotals = TransactionPaymentAggregator::sumPaidByMethod($exportTransactions);

        $this->assertCount(2, $exportTransactions);
        $this->assertSame(150_000, (int) $exportTransactions->sum('grand_total'));
        $this->assertSame(90_000, $exportTotals[TransactionPayment::METHOD_CASH]);
        $this->assertSame(60_000, $exportTotals[TransactionPayment::METHOD_QRIS]);

        $this->actingAs($user)
            ->get(route('account.reports.sales.export', [
                'start_date' => '2026-09-16',
                'end_date' => '2026-09-16',
            ]))
            ->assertOk()
            ->assertDownload();
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
            'paid_at' => $paymentStatus === 'paid' ? $createdAt : null,
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
