<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\Transaction;
use App\Models\Unit;
use App\Services\QuickProductService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\Concerns\PosTestHelpers;
use Tests\TestCase;

class QuickProductTest extends TestCase
{
    use PosTestHelpers;
    use RefreshDatabase;

    public function test_for_pos_returns_pinned_products_before_auto_ranked_sales(): void
    {
        $pinnedCatalog = $this->createPhysicalProduct([
            'title' => 'Pinned Product',
            'is_quick_access' => true,
            'quick_access_order' => 1,
        ]);

        $topSeller = $this->createPhysicalProduct(['title' => 'Top Seller']);
        $secondSeller = $this->createPhysicalProduct(['title' => 'Second Seller']);

        $this->seedSales($topSeller['product'], $topSeller['unit'], 50);
        $this->seedSales($secondSeller['product'], $secondSeller['unit'], 20);

        $results = app(QuickProductService::class)->forPos();

        $this->assertSame($pinnedCatalog['product']->id, $results[0]['id']);
        $this->assertSame($topSeller['product']->id, $results[1]['id']);
        $this->assertSame($secondSeller['product']->id, $results[2]['id']);
    }

    public function test_for_pos_limits_total_quick_products_to_twelve(): void
    {
        for ($i = 1; $i <= 14; $i++) {
            $catalog = $this->createPhysicalProduct(['title' => "Product {$i}"]);
            $this->seedSales($catalog['product'], $catalog['unit'], $i);
        }

        $results = app(QuickProductService::class)->forPos();

        $this->assertCount(12, $results);
    }

    public function test_auto_excludes_ppob_but_pinned_ppob_can_appear_in_for_pos(): void
    {
        $ppobCatalog = $this->createPpobProduct(['title' => 'Pinned PPOB']);
        $ppobCatalog['product']->update([
            'is_quick_access' => true,
            'quick_access_order' => 1,
        ]);

        $physicalCatalog = $this->createPhysicalProduct(['title' => 'Physical Seller']);
        $this->seedSales($physicalCatalog['product'], $physicalCatalog['unit'], 30);
        $this->seedSales($ppobCatalog['product'], Unit::create([
            'name' => 'Lembar',
            'abbreviation' => 'lbr-' . uniqid(),
        ]), 100);

        $auto = app(QuickProductService::class)->auto();
        $forPos = app(QuickProductService::class)->forPos();

        $this->assertFalse(
            $auto->contains(fn (Product $product) => $product->id === $ppobCatalog['product']->id),
        );
        $this->assertTrue(
            collect($forPos)->contains(fn (array $row) => $row['id'] === $ppobCatalog['product']->id),
        );
    }

    public function test_toggle_quick_access_requires_products_edit_permission(): void
    {
        $catalog = $this->createPhysicalProduct();
        $user = $this->createCashierUser(['products.index']);

        $this->actingAs($user)
            ->post(route('account.products.quick-access', $catalog['product']))
            ->assertForbidden();

        $this->assertFalse($catalog['product']->fresh()->is_quick_access);
    }

    public function test_toggle_quick_access_pins_and_unpins_product(): void
    {
        $catalog = $this->createPhysicalProduct();
        $user = $this->createCashierUser(['products.edit', 'products.index']);

        $this->actingAs($user)
            ->post(route('account.products.quick-access', $catalog['product']))
            ->assertRedirect();

        $this->assertTrue($catalog['product']->fresh()->is_quick_access);
        $this->assertSame(1, (int) $catalog['product']->fresh()->quick_access_order);

        $this->actingAs($user)
            ->post(route('account.products.quick-access', $catalog['product']))
            ->assertRedirect();

        $this->assertFalse($catalog['product']->fresh()->is_quick_access);
        $this->assertSame(0, (int) $catalog['product']->fresh()->quick_access_order);
    }

    public function test_pos_create_page_includes_quick_products_prop(): void
    {
        $user = $this->createCashierUser();
        $this->openCashierShift($user);

        $catalog = $this->createPhysicalProduct([
            'title' => 'POS Quick Product',
            'is_quick_access' => true,
            'quick_access_order' => 1,
        ]);

        $this->actingAs($user)
            ->get(route('account.transactions.create'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('quickProducts', 1)
                ->where('quickProducts.0.id', $catalog['product']->id)
                ->where('quickProducts.0.title', 'POS Quick Product')
                ->where('quickProducts.0.product_type', 'physical')
                ->where('quickProducts.0.sell_price', 10000)
                ->where('quickProducts.0.unit_count', 1)
                ->where('quickProducts.0.stock', 100));
    }

    protected function seedSales(Product $product, Unit $unit, int $qty): Transaction
    {
        $user = $this->createCashierUser();
        $this->openCashierShift($user);

        $transaction = Transaction::create([
            'cashier_id' => $user->id,
            'invoice' => 'INV-' . uniqid(),
            'cash' => 0,
            'change' => 0,
            'discount' => 0,
            'grand_total' => $qty * 10000,
            'payment_method' => 'cash',
            'payment_status' => 'paid',
            'status' => 'completed',
            'paid_at' => now(),
        ]);

        $this->createTransactionDetail($transaction, $product, $unit, [
            'qty' => $qty,
            'price' => 10000,
            'subtotal' => $qty * 10000,
        ]);

        return $transaction;
    }
}
