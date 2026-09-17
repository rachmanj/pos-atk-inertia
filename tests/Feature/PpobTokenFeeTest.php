<?php

namespace Tests\Feature;

use App\Models\Cart;
use App\Models\PpobAccount;
use App\Models\Setting;
use App\Models\Transaction;
use App\Models\TransactionDetail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\PosTestHelpers;
use Tests\TestCase;

class PpobTokenFeeTest extends TestCase
{
    use PosTestHelpers;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Setting::create(['key' => 'ppob_admin_fee', 'value' => '2000', 'group' => 'ppob']);
        Setting::create(['key' => 'ppob_min_balance_default', 'value' => '100000', 'group' => 'ppob']);
        Setting::create(['key' => 'ppob_token_fee', 'value' => '4500', 'group' => 'ppob']);
    }

    public function test_token_checkout_debits_provider_cost_and_splits_admin_fee(): void
    {
        $user = $this->createCashierUser();
        $shift = $this->openCashierShift($user);
        $catalog = $this->createPpobProduct(['title' => 'PLN TOKEN PRABAYAR']);

        Setting::create([
            'key' => 'ppob_token_product_ids',
            'value' => (string) $catalog['product']->id,
            'group' => 'ppob',
        ]);

        $account = PpobAccount::create([
            'name' => 'Provider PPOB',
            'current_balance' => 5_000_000,
            'min_balance_alert' => 100_000,
            'is_active' => true,
        ]);

        $response = $this->actingAs($user)->post(route('account.carts.store'), [
            'product_id' => $catalog['product']->id,
            'ppob_cost' => 54_500,
            'admin_fee' => 2_500,
            'token_nominal' => 50_000,
            'customer_ref' => '12345678901',
        ]);

        $response->assertRedirect();

        $checkout = $this->actingAs($user)->postJson(route('account.transactions.store'), [
            'payment_method' => 'cash',
            'cash' => 57_000,
        ]);

        $checkout->assertOk()->assertJson(['success' => true]);

        $transaction = Transaction::query()->where('invoice', $checkout->json('invoice'))->firstOrFail();

        $this->assertDatabaseHas('transaction_details', [
            'transaction_id' => $transaction->id,
            'product_id' => $catalog['product']->id,
            'qty' => 1,
            'price' => 57_000,
            'ppob_cost' => 54_500,
            'admin_fee' => 2_500,
            'token_nominal' => 50_000,
            'customer_ref' => '12345678901',
        ]);

        $this->assertDatabaseHas('ppob_balance_logs', [
            'ppob_account_id' => $account->id,
            'type' => 'sale',
            'amount' => -54_500,
            'cashier_shift_id' => $shift->id,
        ]);
    }

    public function test_token_ppob_cost_follows_configured_provider_fee(): void
    {
        $user = $this->createCashierUser();
        $this->openCashierShift($user);
        $catalog = $this->createPpobProduct(['title' => 'PLN TOKEN PRABAYAR']);

        Setting::create([
            'key' => 'ppob_token_product_ids',
            'value' => (string) $catalog['product']->id,
            'group' => 'ppob',
        ]);

        Setting::updateOrCreate(
            ['key' => 'ppob_token_fee'],
            ['value' => '4000', 'group' => 'ppob'],
        );

        PpobAccount::create([
            'name' => 'Provider PPOB',
            'current_balance' => 5_000_000,
            'min_balance_alert' => 100_000,
            'is_active' => true,
        ]);

        $response = $this->actingAs($user)->post(route('account.carts.store'), [
            'product_id' => $catalog['product']->id,
            'ppob_cost' => 104_000,
            'admin_fee' => 2_000,
            'token_nominal' => 100_000,
        ]);

        $response->assertRedirect();

        $cart = Cart::query()->where('cashier_id', $user->id)->firstOrFail();

        $this->assertSame(104_000, (int) $cart->ppob_cost);
        $this->assertSame(100_000, (int) $cart->token_nominal);
    }

    public function test_non_token_ppob_still_uses_manual_cost_and_admin_fee(): void
    {
        $user = $this->createCashierUser();
        $shift = $this->openCashierShift($user);
        $catalog = $this->createPpobProduct(['title' => 'Meterai Tempel']);

        Setting::create([
            'key' => 'ppob_token_product_ids',
            'value' => '999999',
            'group' => 'ppob',
        ]);

        $account = PpobAccount::create([
            'name' => 'Provider PPOB',
            'current_balance' => 5_000_000,
            'min_balance_alert' => 100_000,
            'is_active' => true,
        ]);

        $response = $this->actingAs($user)->post(route('account.carts.store'), [
            'product_id' => $catalog['product']->id,
            'ppob_cost' => 18_000,
            'admin_fee' => 2_000,
        ]);

        $response->assertRedirect();

        $checkout = $this->actingAs($user)->postJson(route('account.transactions.store'), [
            'payment_method' => 'cash',
            'cash' => 20_000,
        ]);

        $checkout->assertOk()->assertJson(['success' => true]);

        $transaction = Transaction::query()->where('invoice', $checkout->json('invoice'))->firstOrFail();
        $detail = TransactionDetail::query()
            ->where('transaction_id', $transaction->id)
            ->firstOrFail();

        $this->assertSame(18_000, (int) $detail->ppob_cost);
        $this->assertSame(2_000, (int) $detail->admin_fee);
        $this->assertSame(20_000, (int) $detail->price);
        $this->assertNull($detail->token_nominal);

        $this->assertDatabaseHas('ppob_balance_logs', [
            'ppob_account_id' => $account->id,
            'type' => 'sale',
            'amount' => -18_000,
            'cashier_shift_id' => $shift->id,
        ]);
    }

    public function test_token_rejects_sell_price_below_provider_cost(): void
    {
        $user = $this->createCashierUser();
        $this->openCashierShift($user);
        $catalog = $this->createPpobProduct(['title' => 'PLN TOKEN PRABAYAR']);

        Setting::create([
            'key' => 'ppob_token_product_ids',
            'value' => (string) $catalog['product']->id,
            'group' => 'ppob',
        ]);

        $response = $this->actingAs($user)->post(route('account.carts.store'), [
            'product_id' => $catalog['product']->id,
            'ppob_cost' => 54_500,
            'admin_fee' => -500,
            'token_nominal' => 50_000,
        ]);

        $response->assertSessionHasErrors('admin_fee');
    }
}
