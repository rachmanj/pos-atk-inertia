<?php

namespace Tests\Feature;

use App\Models\Profit;
use App\Models\Transaction;
use App\Models\TransactionPayment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\PosTestHelpers;
use Tests\TestCase;

class SplitPaymentCheckoutTest extends TestCase
{
    use PosTestHelpers;
    use RefreshDatabase;

    public function test_split_cash_and_qris_checkout_is_saved_as_paid(): void
    {
        $user = $this->createCashierUser();
        $this->openCashierShift($user);
        $catalog = $this->createPhysicalProduct();
        $this->addCartItem($user, $catalog['product'], $catalog['unit'], 10, 10_000);

        $response = $this->actingAs($user)->postJson(route('account.transactions.store'), [
            'payment_method' => 'cash',
            'cash' => 60_000,
            'payments' => [
                ['method' => 'cash', 'amount' => 60_000],
                ['method' => 'qris', 'amount' => 40_000],
            ],
        ]);

        $response->assertOk()->assertJson([
            'success' => true,
            'payment_method' => 'split',
            'payment_status' => 'paid',
        ]);

        $transaction = Transaction::where('invoice', $response->json('invoice'))->firstOrFail();

        $this->assertSame('split', $transaction->payment_method);
        $this->assertSame('paid', $transaction->payment_status);
        $this->assertSame('completed', $transaction->status);
        $this->assertSame(60_000, $transaction->cash);
        $this->assertSame(0, $transaction->change);
        $this->assertNull($transaction->payment_channel);
        $this->assertNotNull($transaction->paid_at);

        $this->assertDatabaseCount('transaction_payments', 2);
        $this->assertDatabaseHas('transaction_payments', [
            'transaction_id' => $transaction->id,
            'method' => 'cash',
            'amount' => 60_000,
            'payment_status' => 'paid',
        ]);
        $this->assertDatabaseHas('transaction_payments', [
            'transaction_id' => $transaction->id,
            'method' => 'qris',
            'amount' => 40_000,
            'payment_status' => 'paid',
        ]);
        $this->assertDatabaseCount('profits', 1);
    }

    public function test_split_cash_change_is_calculated_from_cash_received_only(): void
    {
        $user = $this->createCashierUser();
        $this->openCashierShift($user);
        $catalog = $this->createPhysicalProduct();
        $this->addCartItem($user, $catalog['product'], $catalog['unit'], 10, 10_000);

        $response = $this->actingAs($user)->postJson(route('account.transactions.store'), [
            'payment_method' => 'cash',
            'cash' => 70_000,
            'payments' => [
                ['method' => 'cash', 'amount' => 60_000],
                ['method' => 'qris', 'amount' => 40_000],
            ],
        ]);

        $response->assertOk();

        $transaction = Transaction::where('invoice', $response->json('invoice'))->firstOrFail();

        $this->assertSame(70_000, $transaction->cash);
        $this->assertSame(10_000, $transaction->change);
    }

    public function test_split_payment_rejects_mismatched_total(): void
    {
        $user = $this->createCashierUser();
        $this->openCashierShift($user);
        $catalog = $this->createPhysicalProduct();
        $this->addCartItem($user, $catalog['product'], $catalog['unit'], 10, 10_000);

        $response = $this->actingAs($user)->postJson(route('account.transactions.store'), [
            'payment_method' => 'cash',
            'cash' => 60_000,
            'payments' => [
                ['method' => 'cash', 'amount' => 60_000],
                ['method' => 'qris', 'amount' => 30_000],
            ],
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['payments']);

        $this->assertStringContainsString(
            'Total pembayaran tidak sama dengan total transaksi.',
            $response->json('errors.payments.0'),
        );
    }

    public function test_split_payment_rejects_more_than_three_methods(): void
    {
        $user = $this->createCashierUser();
        $this->openCashierShift($user);
        $catalog = $this->createPhysicalProduct();
        $this->addCartItem($user, $catalog['product'], $catalog['unit'], 10, 10_000);

        $response = $this->actingAs($user)->postJson(route('account.transactions.store'), [
            'payment_method' => 'cash',
            'cash' => 10_000,
            'payments' => [
                ['method' => 'cash', 'amount' => 25_000],
                ['method' => 'qris', 'amount' => 25_000],
                ['method' => 'transfer', 'amount' => 25_000],
                ['method' => 'cash', 'amount' => 25_000],
            ],
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['payments']);

        $this->assertSame(
            'Jumlah metode pembayaran maksimal 3.',
            $response->json('errors.payments.0'),
        );
    }

    public function test_split_payment_rejects_duplicate_methods(): void
    {
        $user = $this->createCashierUser();
        $this->openCashierShift($user);
        $catalog = $this->createPhysicalProduct();
        $this->addCartItem($user, $catalog['product'], $catalog['unit'], 10, 10_000);

        $response = $this->actingAs($user)->postJson(route('account.transactions.store'), [
            'payment_method' => 'cash',
            'cash' => 100_000,
            'payments' => [
                ['method' => 'qris', 'amount' => 50_000],
                ['method' => 'qris', 'amount' => 50_000],
            ],
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['payments']);

        $this->assertSame(
            'Metode pembayaran tidak boleh duplikat.',
            $response->json('errors.payments.0'),
        );
    }

    public function test_split_payment_rejects_non_cash_overpayment_via_total_mismatch(): void
    {
        $user = $this->createCashierUser();
        $this->openCashierShift($user);
        $catalog = $this->createPhysicalProduct();
        $this->addCartItem($user, $catalog['product'], $catalog['unit'], 10, 10_000);

        $response = $this->actingAs($user)->postJson(route('account.transactions.store'), [
            'payment_method' => 'cash',
            'cash' => 50_000,
            'payments' => [
                ['method' => 'cash', 'amount' => 50_000],
                ['method' => 'qris', 'amount' => 60_000],
            ],
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['payments']);
    }

    public function test_split_cash_and_transfer_checkout_is_pending_until_confirmed(): void
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
                ['method' => 'transfer', 'amount' => 60_000, 'reference' => 'TRF-001'],
            ],
        ]);

        $response->assertOk()->assertJson([
            'success' => true,
            'payment_method' => 'split',
            'payment_status' => 'pending',
        ]);

        $transaction = Transaction::where('invoice', $response->json('invoice'))->firstOrFail();

        $this->assertSame('pending', $transaction->payment_status);
        $this->assertSame('pending', $transaction->status);
        $this->assertSame(40_000, $transaction->cash);
        $this->assertSame(0, $transaction->change);
        $this->assertNull($transaction->paid_at);

        $this->assertDatabaseHas('transaction_payments', [
            'transaction_id' => $transaction->id,
            'method' => 'cash',
            'amount' => 40_000,
            'payment_status' => TransactionPayment::STATUS_PAID,
        ]);
        $this->assertDatabaseHas('transaction_payments', [
            'transaction_id' => $transaction->id,
            'method' => 'transfer',
            'amount' => 60_000,
            'payment_status' => TransactionPayment::STATUS_PENDING,
            'reference' => 'TRF-001',
        ]);

        $this->assertDatabaseCount('profits', 0);
    }

    public function test_single_method_checkout_remains_unchanged_without_payments_payload(): void
    {
        $user = $this->createCashierUser();
        $this->openCashierShift($user);
        $catalog = $this->createPhysicalProduct();
        $this->addCartItem($user, $catalog['product'], $catalog['unit'], 2, 10_000);

        $response = $this->actingAs($user)->postJson(route('account.transactions.store'), [
            'payment_method' => 'cash',
            'cash' => 20_000,
        ]);

        $response->assertOk()->assertJson([
            'success' => true,
            'payment_method' => 'cash',
            'payment_status' => 'paid',
        ]);

        $transaction = Transaction::where('invoice', $response->json('invoice'))->firstOrFail();

        $this->assertSame('cash', $transaction->payment_method);
        $this->assertSame(20_000, $transaction->cash);
        $this->assertSame(0, $transaction->change);
        $this->assertDatabaseCount('transaction_payments', 0);
        $this->assertDatabaseCount('profits', 1);
        Profit::firstOrFail();
    }
}
