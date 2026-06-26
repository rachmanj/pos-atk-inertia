<?php

namespace Tests\Feature;

use App\Models\Profit;
use App\Models\Transaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\PosTestHelpers;
use Tests\TestCase;

class MidtransCallbackTest extends TestCase
{
    use PosTestHelpers;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config(['midtrans.server_key' => 'test-server-key']);
    }

    public function test_callback_rejects_invalid_signature(): void
    {
        $user = $this->createCashierUser();

        $transaction = Transaction::create([
            'cashier_id' => $user->id,
            'invoice' => 'TRX-TEST-001',
            'cash' => 0,
            'change' => 0,
            'discount' => 0,
            'grand_total' => 10000,
            'payment_method' => 'digital',
            'payment_channel' => 'midtrans',
            'payment_status' => 'pending',
            'status' => 'pending',
        ]);

        $response = $this->postJson(route('midtrans.callback'), [
            'order_id' => $transaction->invoice,
            'status_code' => '200',
            'gross_amount' => '10000',
            'transaction_status' => 'settlement',
            'signature_key' => 'invalid-signature',
        ]);

        $response->assertForbidden();
    }

    public function test_callback_marks_transaction_paid_and_records_profit(): void
    {
        $user = $this->createCashierUser();
        $catalog = $this->createPhysicalProduct(['stock' => 10, 'avg_cost' => 4000]);

        $transaction = Transaction::create([
            'cashier_id' => $user->id,
            'invoice' => 'TRX-TEST-002',
            'cash' => 0,
            'change' => 0,
            'discount' => 0,
            'grand_total' => 10000,
            'payment_method' => 'digital',
            'payment_channel' => 'midtrans',
            'payment_status' => 'pending',
            'status' => 'pending',
        ]);

        $this->createTransactionDetail($transaction, $catalog['product'], $catalog['unit'], [
            'buy_price' => 4000,
            'price' => 10000,
            'subtotal' => 10000,
        ]);

        $payload = $this->buildMidtransCallbackPayload($transaction, 'settlement');

        $response = $this->postJson(route('midtrans.callback'), $payload);

        $response->assertOk();

        $transaction->refresh();

        $this->assertSame('paid', $transaction->payment_status);
        $this->assertSame('completed', $transaction->status);
        $this->assertNotNull($transaction->paid_at);
        $this->assertDatabaseHas('profits', [
            'transaction_id' => $transaction->id,
            'total_revenue' => 10000,
            'total_cost' => 4000,
            'profit_amount' => 6000,
        ]);
    }

    public function test_callback_is_idempotent_for_paid_transactions(): void
    {
        $user = $this->createCashierUser();
        $catalog = $this->createPhysicalProduct();

        $transaction = Transaction::create([
            'cashier_id' => $user->id,
            'invoice' => 'TRX-TEST-003',
            'cash' => 0,
            'change' => 0,
            'discount' => 0,
            'grand_total' => 10000,
            'payment_method' => 'digital',
            'payment_channel' => 'midtrans',
            'payment_status' => 'paid',
            'status' => 'completed',
            'paid_at' => now(),
        ]);

        $this->createTransactionDetail($transaction, $catalog['product'], $catalog['unit']);

        Profit::create([
            'transaction_id' => $transaction->id,
            'total_revenue' => 10000,
            'total_cost' => 5000,
            'profit_amount' => 5000,
        ]);

        $payload = $this->buildMidtransCallbackPayload($transaction, 'settlement');

        $response = $this->postJson(route('midtrans.callback'), $payload);

        $response->assertOk();
        $this->assertDatabaseCount('profits', 1);
        $this->assertDatabaseHas('profits', [
            'transaction_id' => $transaction->id,
            'profit_amount' => 5000,
        ]);
    }
}
