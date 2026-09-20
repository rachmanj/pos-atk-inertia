<?php

namespace Tests\Feature;

use App\Models\Profit;
use App\Models\Transaction;
use App\Models\TransactionPayment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\PosTestHelpers;
use Tests\TestCase;

class ConfirmTransferTest extends TestCase
{
    use PosTestHelpers;
    use RefreshDatabase;

    public function test_confirm_legacy_pending_transfer_marks_paid_and_creates_profit_once(): void
    {
        $user = $this->createCashierUser(['transactions.edit']);
        $transaction = $this->createPendingLegacyTransfer($user);
        $catalog = $this->createPhysicalProduct();
        $this->createTransactionDetail($transaction, $catalog['product'], $catalog['unit']);

        $this->actingAs($user)
            ->from(route('account.transactions.index'))
            ->post(route('account.transactions.confirm-transfer', $transaction->invoice))
            ->assertRedirect(route('account.transactions.index'))
            ->assertSessionHas('success', 'Pembayaran transfer berhasil dikonfirmasi.');

        $transaction->refresh();

        $this->assertSame('paid', $transaction->payment_status);
        $this->assertSame('completed', $transaction->status);
        $this->assertNotNull($transaction->paid_at);
        $this->assertDatabaseCount('profits', 1);
        $this->assertDatabaseHas('profits', [
            'transaction_id' => $transaction->id,
            'total_revenue' => 10_000,
            'total_cost' => 5_000,
            'profit_amount' => 5_000,
        ]);
    }

    public function test_confirm_from_transaction_show_redirects_back_to_show(): void
    {
        $user = $this->createCashierUser(['transactions.edit']);
        $transaction = $this->createPendingLegacyTransfer($user);
        $catalog = $this->createPhysicalProduct();
        $this->createTransactionDetail($transaction, $catalog['product'], $catalog['unit']);

        $showUrl = route('account.transactions.show', $transaction->invoice);

        $this->actingAs($user)
            ->from($showUrl)
            ->post(route('account.transactions.confirm-transfer', $transaction->invoice))
            ->assertRedirect($showUrl)
            ->assertSessionHas('success', 'Pembayaran transfer berhasil dikonfirmasi.');

        $transaction->refresh();

        $this->assertSame('paid', $transaction->payment_status);
        $this->assertSame('completed', $transaction->status);
    }

    public function test_confirm_without_valid_referer_falls_back_to_index(): void
    {
        $user = $this->createCashierUser(['transactions.edit']);
        $transaction = $this->createPendingLegacyTransfer($user);
        $catalog = $this->createPhysicalProduct();
        $this->createTransactionDetail($transaction, $catalog['product'], $catalog['unit']);

        $this->actingAs($user)
            ->post(route('account.transactions.confirm-transfer', $transaction->invoice))
            ->assertRedirect(route('account.transactions.index'))
            ->assertSessionHas('success', 'Pembayaran transfer berhasil dikonfirmasi.');
    }

    public function test_second_confirm_on_already_paid_transfer_is_idempotent(): void
    {
        $user = $this->createCashierUser(['transactions.edit']);
        $transaction = $this->createPendingLegacyTransfer($user);
        $catalog = $this->createPhysicalProduct();
        $this->createTransactionDetail($transaction, $catalog['product'], $catalog['unit']);

        $showUrl = route('account.transactions.show', $transaction->invoice);

        $this->actingAs($user)
            ->from($showUrl)
            ->post(route('account.transactions.confirm-transfer', $transaction->invoice))
            ->assertRedirect($showUrl);

        $paidAt = $transaction->fresh()->paid_at;

        $this->actingAs($user)
            ->from($showUrl)
            ->post(route('account.transactions.confirm-transfer', $transaction->invoice))
            ->assertRedirect($showUrl)
            ->assertSessionHas('success', 'Transaksi ini sudah dikonfirmasi sebelumnya.');

        $transaction->refresh();

        $this->assertSame('paid', $transaction->payment_status);
        $this->assertSame('completed', $transaction->status);
        $this->assertTrue($transaction->paid_at->equalTo($paidAt));
        $this->assertDatabaseCount('profits', 1);
    }

    public function test_confirm_on_cash_transaction_returns_manual_transfer_only_message(): void
    {
        $user = $this->createCashierUser(['transactions.edit']);
        $transaction = Transaction::create([
            'cashier_id' => $user->id,
            'invoice' => 'TRX-CASH-' . uniqid(),
            'cash' => 100_000,
            'change' => 0,
            'discount' => 0,
            'grand_total' => 100_000,
            'payment_method' => 'cash',
            'payment_status' => 'paid',
            'status' => 'completed',
            'paid_at' => now(),
        ]);

        $this->actingAs($user)
            ->from(route('account.transactions.index'))
            ->post(route('account.transactions.confirm-transfer', $transaction->invoice))
            ->assertRedirect(route('account.transactions.index'))
            ->assertSessionHas('error', 'Konfirmasi hanya untuk transaksi transfer manual.');
    }

    public function test_confirm_split_cash_and_transfer_marks_transfer_part_and_transaction_paid(): void
    {
        $user = $this->createCashierUser(['transactions.edit']);
        $transaction = Transaction::create([
            'cashier_id' => $user->id,
            'invoice' => 'TRX-SPLIT-' . uniqid(),
            'cash' => 40_000,
            'change' => 0,
            'discount' => 0,
            'grand_total' => 100_000,
            'payment_method' => 'split',
            'payment_status' => 'pending',
            'status' => 'pending',
        ]);

        TransactionPayment::create([
            'transaction_id' => $transaction->id,
            'method' => 'cash',
            'amount' => 40_000,
            'payment_status' => 'paid',
            'paid_at' => now(),
        ]);

        TransactionPayment::create([
            'transaction_id' => $transaction->id,
            'method' => 'transfer',
            'amount' => 60_000,
            'payment_status' => 'pending',
        ]);

        $catalog = $this->createPhysicalProduct();
        $this->createTransactionDetail($transaction, $catalog['product'], $catalog['unit'], [
            'qty' => 10,
            'price' => 10_000,
            'buy_price' => 5_000,
            'subtotal' => 100_000,
        ]);

        $this->actingAs($user)
            ->from(route('account.transactions.index'))
            ->post(route('account.transactions.confirm-transfer', $transaction->invoice))
            ->assertRedirect(route('account.transactions.index'))
            ->assertSessionHas('success', 'Pembayaran transfer berhasil dikonfirmasi.');

        $transaction->refresh();

        $this->assertSame('paid', $transaction->payment_status);
        $this->assertSame('completed', $transaction->status);
        $this->assertNotNull($transaction->paid_at);
        $this->assertDatabaseHas('transaction_payments', [
            'transaction_id' => $transaction->id,
            'method' => 'transfer',
            'payment_status' => 'paid',
        ]);
        $this->assertDatabaseHas('transaction_payments', [
            'transaction_id' => $transaction->id,
            'method' => 'cash',
            'payment_status' => 'paid',
        ]);
        $this->assertSame(1, Profit::where('transaction_id', $transaction->id)->count());
    }

    protected function createPendingLegacyTransfer(\App\Models\User $user): Transaction
    {
        return Transaction::create([
            'cashier_id' => $user->id,
            'invoice' => 'TRX-TRANSFER-' . uniqid(),
            'cash' => 0,
            'change' => 0,
            'discount' => 0,
            'grand_total' => 10_000,
            'payment_method' => 'transfer',
            'payment_status' => 'pending',
            'status' => 'pending',
        ]);
    }
}
