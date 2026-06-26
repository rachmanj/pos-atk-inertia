<?php

namespace Tests\Feature;

use App\Models\Cart;
use App\Models\Profit;
use App\Models\StockMovement;
use App\Models\Transaction;
use App\Services\CheckoutService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\PosTestHelpers;
use Tests\TestCase;

class CheckoutTest extends TestCase
{
    use PosTestHelpers;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config(['midtrans.server_key' => 'test-server-key']);
    }

    public function test_cash_checkout_decrements_stock_records_profit_and_clears_cart(): void
    {
        $user = $this->createCashierUser();
        $this->openCashierShift($user);
        $catalog = $this->createPhysicalProduct(['stock' => 50, 'avg_cost' => 5000]);
        $this->addCartItem($user, $catalog['product'], $catalog['unit'], 2, 10000);

        $response = $this->actingAs($user)->postJson(route('account.transactions.store'), [
            'payment_method' => 'cash',
            'cash' => 20000,
        ]);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'payment_method' => 'cash',
                'payment_status' => 'paid',
            ]);

        $catalog['product']->refresh();

        $this->assertSame(48, $catalog['product']->stock);
        $this->assertDatabaseCount('stock_movements', 1);
        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $catalog['product']->id,
            'type' => 'out',
            'qty' => 2,
        ]);
        $this->assertDatabaseCount('profits', 1);
        $this->assertDatabaseHas('profits', [
            'total_revenue' => 20000,
            'total_cost' => 10000,
            'profit_amount' => 10000,
        ]);
        $this->assertDatabaseCount('carts', 0);
    }

    public function test_checkout_rejects_empty_cart(): void
    {
        $user = $this->createCashierUser();
        $this->openCashierShift($user);

        $response = $this->actingAs($user)->postJson(route('account.transactions.store'), [
            'payment_method' => 'cash',
            'cash' => 10000,
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Keranjang masih kosong!',
            ]);
    }

    public function test_checkout_rejects_discount_greater_than_subtotal(): void
    {
        $user = $this->createCashierUser();
        $this->openCashierShift($user);
        $catalog = $this->createPhysicalProduct();
        $this->addCartItem($user, $catalog['product'], $catalog['unit'], 1, 10000);

        $response = $this->actingAs($user)->postJson(route('account.transactions.store'), [
            'payment_method' => 'cash',
            'cash' => 10000,
            'discount' => 15000,
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Diskon tidak boleh melebihi subtotal belanja.',
            ]);
    }

    public function test_checkout_rejects_insufficient_cash(): void
    {
        $user = $this->createCashierUser();
        $this->openCashierShift($user);
        $catalog = $this->createPhysicalProduct();
        $this->addCartItem($user, $catalog['product'], $catalog['unit'], 1, 10000);

        $response = $this->actingAs($user)->postJson(route('account.transactions.store'), [
            'payment_method' => 'cash',
            'cash' => 5000,
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Uang pembayaran kurang dari total belanja.',
            ]);
    }

    public function test_checkout_rejects_insufficient_stock(): void
    {
        $user = $this->createCashierUser();
        $this->openCashierShift($user);
        $catalog = $this->createPhysicalProduct(['stock' => 1]);
        $this->addCartItem($user, $catalog['product'], $catalog['unit'], 5, 10000);

        $response = $this->actingAs($user)->postJson(route('account.transactions.store'), [
            'payment_method' => 'cash',
            'cash' => 50000,
        ]);

        $response->assertStatus(422)
            ->assertJsonFragment([
                'success' => false,
            ]);
    }

    public function test_digital_checkout_deducts_stock_without_profit(): void
    {
        $user = $this->createCashierUser();
        $this->openCashierShift($user);
        $catalog = $this->createPhysicalProduct(['stock' => 20]);
        $this->addCartItem($user, $catalog['product'], $catalog['unit'], 1, 10000);

        $transaction = app(CheckoutService::class)->checkout($user, [
            'payment_method' => 'digital',
            'discount' => 0,
        ]);

        $catalog['product']->refresh();

        $this->assertSame('digital', $transaction->payment_method);
        $this->assertSame('pending', $transaction->payment_status);
        $this->assertSame('pending', $transaction->status);
        $this->assertSame(19, $catalog['product']->stock);
        $this->assertDatabaseCount('profits', 0);
        $this->assertDatabaseCount('carts', 0);
    }
}
