<?php

namespace Tests\Feature;

use App\Models\Profit;
use App\Models\ReturnTransaction;
use App\Models\StockMovement;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\PosTestHelpers;
use Tests\TestCase;

class VoidTransactionTest extends TestCase
{
    use PosTestHelpers;
    use RefreshDatabase;

    public function test_void_restores_stock_and_zeroes_profit(): void
    {
        $user = $this->createCashierUser(['transactions.create', 'transactions.void']);
        $catalog = $this->createPhysicalProduct(['stock' => 50, 'avg_cost' => 5000]);
        $transaction = $this->createCompletedCashTransaction($user, $catalog['product'], $catalog['unit']);

        $catalog['product']->refresh();
        $this->assertSame(49, $catalog['product']->stock);

        $response = $this->actingAs($user)->put(route('account.transactions.void', $transaction->invoice));

        $response->assertRedirect(route('account.transactions.show', $transaction->invoice));

        $transaction->refresh();
        $catalog['product']->refresh();

        $this->assertSame('voided', $transaction->status);
        $this->assertSame(50, $catalog['product']->stock);
        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $catalog['product']->id,
            'type' => 'in',
            'qty' => 1,
        ]);
        $this->assertDatabaseHas('profits', [
            'transaction_id' => $transaction->id,
            'total_revenue' => 0,
            'total_cost' => 0,
            'profit_amount' => 0,
        ]);
    }

    public function test_void_rejects_already_voided_transaction(): void
    {
        $user = $this->createCashierUser(['transactions.create', 'transactions.void']);
        $catalog = $this->createPhysicalProduct(['stock' => 50]);
        $transaction = $this->createCompletedCashTransaction($user, $catalog['product'], $catalog['unit']);

        $this->actingAs($user)->put(route('account.transactions.void', $transaction->invoice));

        $response = $this->actingAs($user)->put(route('account.transactions.void', $transaction->invoice));

        $response->assertRedirect(route('account.transactions.show', $transaction->invoice));
        $response->assertSessionHas('error', 'Transaksi sudah dibatalkan sebelumnya.');
    }

    public function test_void_rejects_transaction_with_blocking_return(): void
    {
        $user = $this->createCashierUser(['transactions.create', 'transactions.void']);
        $catalog = $this->createPhysicalProduct(['stock' => 50]);
        $transaction = $this->createCompletedCashTransaction($user, $catalog['product'], $catalog['unit']);

        ReturnTransaction::create([
            'transaction_id' => $transaction->id,
            'cashier_id' => $user->id,
            'invoice' => 'RT-' . uniqid(),
            'status' => 'pending',
            'reason' => 'other',
        ]);

        $response = $this->actingAs($user)->put(route('account.transactions.void', $transaction->invoice));

        $response->assertRedirect(route('account.transactions.show', $transaction->invoice));
        $response->assertSessionHas('error', 'Transaksi yang sudah memiliki retur tidak dapat di-void.');
    }
}
