<?php

namespace Tests\Feature;

use App\Models\Transaction;
use App\Models\TransactionPayment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\PosTestHelpers;
use Tests\TestCase;

class TransactionPaymentBreakdownTest extends TestCase
{
    use PosTestHelpers;
    use RefreshDatabase;

    public function test_legacy_cash_transaction_uses_grand_total_fallback(): void
    {
        $transaction = $this->createLegacyTransaction('cash', 100_000);

        $this->assertSame(['cash' => 100_000], $transaction->paymentBreakdown());
        $this->assertSame(100_000, $transaction->cashPart());
        $this->assertSame(0, $transaction->nonCashPart());
        $this->assertFalse($transaction->isSplitPayment());
    }

    public function test_legacy_qris_transaction_uses_grand_total_fallback(): void
    {
        $transaction = $this->createLegacyTransaction('qris', 75_000);

        $this->assertSame(['qris' => 75_000], $transaction->paymentBreakdown());
        $this->assertSame(0, $transaction->cashPart());
        $this->assertSame(75_000, $transaction->nonCashPart());
        $this->assertFalse($transaction->isSplitPayment());
    }

    public function test_legacy_transfer_transaction_uses_grand_total_fallback(): void
    {
        $transaction = $this->createLegacyTransaction('transfer', 120_000);

        $this->assertSame(['transfer' => 120_000], $transaction->paymentBreakdown());
        $this->assertSame(0, $transaction->cashPart());
        $this->assertSame(120_000, $transaction->nonCashPart());
        $this->assertFalse($transaction->isSplitPayment());
    }

    public function test_split_transaction_with_payment_rows(): void
    {
        $transaction = $this->createLegacyTransaction('split', 100_000);

        $this->createPayment($transaction, TransactionPayment::METHOD_CASH, 50_000);
        $this->createPayment($transaction, TransactionPayment::METHOD_QRIS, 50_000);

        $transaction->refresh();

        $this->assertSame(
            ['cash' => 50_000, 'qris' => 50_000],
            $transaction->paymentBreakdown(),
        );
        $this->assertTrue($transaction->isSplitPayment());
        $this->assertSame(50_000, $transaction->cashPart());
        $this->assertSame(50_000, $transaction->nonCashPart());
    }

    public function test_failed_payment_rows_are_excluded_from_breakdown(): void
    {
        $transaction = $this->createLegacyTransaction('split', 100_000);

        $this->createPayment($transaction, TransactionPayment::METHOD_CASH, 50_000);
        $this->createPayment(
            $transaction,
            TransactionPayment::METHOD_QRIS,
            50_000,
            TransactionPayment::STATUS_FAILED,
        );

        $transaction->refresh();

        $this->assertSame(['cash' => 50_000], $transaction->paymentBreakdown());
        $this->assertSame(50_000, $transaction->cashPart());
        $this->assertSame(0, $transaction->nonCashPart());
    }

    public function test_multiple_payment_rows_detect_split_even_without_split_payment_method(): void
    {
        $transaction = $this->createLegacyTransaction('cash', 100_000);

        $this->createPayment($transaction, TransactionPayment::METHOD_CASH, 60_000);
        $this->createPayment($transaction, TransactionPayment::METHOD_TRANSFER, 40_000);

        $transaction->refresh();

        $this->assertTrue($transaction->isSplitPayment());
        $this->assertSame(
            ['cash' => 60_000, 'transfer' => 40_000],
            $transaction->paymentBreakdown(),
        );
        $this->assertSame(60_000, $transaction->cashPart());
        $this->assertSame(40_000, $transaction->nonCashPart());
    }

    protected function createLegacyTransaction(string $paymentMethod, int $grandTotal): Transaction
    {
        $user = $this->createCashierUser();

        return Transaction::create([
            'cashier_id' => $user->id,
            'invoice' => 'TRX-BREAKDOWN-' . uniqid(),
            'cash' => $paymentMethod === 'cash' ? $grandTotal : 0,
            'change' => 0,
            'discount' => 0,
            'grand_total' => $grandTotal,
            'payment_method' => $paymentMethod,
            'payment_status' => 'paid',
            'status' => 'completed',
        ]);
    }

    protected function createPayment(
        Transaction $transaction,
        string $method,
        int $amount,
        string $paymentStatus = TransactionPayment::STATUS_PAID,
    ): TransactionPayment {
        return TransactionPayment::create([
            'transaction_id' => $transaction->id,
            'method' => $method,
            'amount' => $amount,
            'payment_status' => $paymentStatus,
            'paid_at' => $paymentStatus === TransactionPayment::STATUS_PAID ? now() : null,
        ]);
    }
}
