<?php

namespace Tests\Feature;

use App\Models\Cart;
use App\Models\Unit;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\PosTestHelpers;
use Tests\TestCase;

/**
 * Regresi: edit harga satuan di keranjang POS.
 *
 * Pemanggil `fetch` (Accept: application/json) mengirim PUT ke
 * /account/carts/{cart}. Endpoint ini dulu selalu membalas `back()` (302);
 * `fetch` mengikuti redirect itu dan mengulang PUT ke URL halaman POS yang
 * hanya menerima GET -> 405, sehingga klien melaporkan "Gagal mengubah harga"
 * dan mengembalikan harga di layar padahal barisnya sudah tersimpan di DB.
 */
class CartPriceUpdateTest extends TestCase
{
    use PosTestHelpers;
    use RefreshDatabase;

    public function test_json_update_persists_manual_unit_price_and_returns_ok(): void
    {
        $user = $this->createCashierUser();
        $this->openCashierShift($user);
        $catalog = $this->createPhysicalProduct(['sell_price' => 2000, 'stock' => 50]);
        $cart = $this->addCartItem($user, $catalog['product'], $catalog['unit'], 1, 2000);

        $response = $this->actingAs($user)->putJson(route('account.carts.update', $cart), [
            'qty' => 1,
            'price' => 12345,
            'discount' => 0,
            'discount_type' => 'nominal',
        ]);

        $response->assertOk()->assertJson([
            'success' => true,
            'cart' => [
                'id' => $cart->id,
                'price' => 12345,
            ],
        ]);

        $this->assertSame(12345, (int) $cart->fresh()->price);
    }

    public function test_json_update_rejects_ppob_price_change_with_422(): void
    {
        $user = $this->createCashierUser();
        $this->openCashierShift($user);
        $catalog = $this->createPpobProduct();
        $unit = Unit::create([
            'name' => 'Lembar',
            'abbreviation' => 'lbr-' . uniqid(),
        ]);

        $cart = Cart::create([
            'cashier_id' => $user->id,
            'product_id' => $catalog['product']->id,
            'unit_id' => $unit->id,
            'qty' => 1,
            'price' => 20000,
            'ppob_cost' => 18000,
            'admin_fee' => 2000,
        ]);

        $response = $this->actingAs($user)->putJson(route('account.carts.update', $cart), [
            'qty' => 1,
            'price' => 999,
            'discount' => 0,
            'discount_type' => 'nominal',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('price');

        $this->assertSame(20000, (int) $cart->fresh()->price);
    }

    public function test_json_update_reports_stock_overage_as_422_instead_of_redirect(): void
    {
        $user = $this->createCashierUser();
        $this->openCashierShift($user);
        $catalog = $this->createPhysicalProduct(['sell_price' => 2000, 'stock' => 3]);
        $cart = $this->addCartItem($user, $catalog['product'], $catalog['unit'], 1, 2000);

        $response = $this->actingAs($user)->putJson(route('account.carts.update', $cart), [
            'qty' => 5,
            'price' => 2000,
            'discount' => 0,
            'discount_type' => 'nominal',
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Qty keranjang melebihi stok tersedia.',
            ]);

        $this->assertSame(1, (int) $cart->fresh()->qty);
    }

    public function test_inertia_update_keeps_manual_price_when_price_is_sent(): void
    {
        $user = $this->createCashierUser();
        $this->openCashierShift($user);
        $catalog = $this->createPhysicalProduct(['sell_price' => 2000, 'stock' => 50]);
        $cart = $this->addCartItem($user, $catalog['product'], $catalog['unit'], 1, 2000);

        // Kasir sudah mengubah harga manual lalu mengubah qty: harga manual harus tetap.
        $response = $this->actingAs($user)->put(route('account.carts.update', $cart), [
            'qty' => 4,
            'price' => 9900,
            'discount' => 0,
            'discount_type' => 'nominal',
        ]);

        $response->assertRedirect();

        $cart->refresh();

        $this->assertSame(4, (int) $cart->qty);
        $this->assertSame(9900, (int) $cart->price);
    }

    public function test_inertia_update_keeps_redirect_response(): void
    {
        $user = $this->createCashierUser();
        $this->openCashierShift($user);
        $catalog = $this->createPhysicalProduct(['sell_price' => 2000, 'stock' => 50]);
        $cart = $this->addCartItem($user, $catalog['product'], $catalog['unit'], 1, 2000);

        $response = $this->actingAs($user)->put(route('account.carts.update', $cart), [
            'qty' => 3,
            'discount' => 500,
            'discount_type' => 'nominal',
        ]);

        $response->assertRedirect();

        $cart->refresh();

        $this->assertSame(3, (int) $cart->qty);
        $this->assertSame(500, (int) $cart->discount);
    }
}
