<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\Unit;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\PosTestHelpers;
use Tests\TestCase;

class ProductPriceGuardTest extends TestCase
{
    use PosTestHelpers;
    use RefreshDatabase;

    private function createCategory(): Category
    {
        return Category::create([
            'name' => 'Kategori Uji ' . uniqid(),
            'slug' => 'kategori-uji-' . uniqid(),
        ]);
    }

    private function createUnit(string $abbreviation): Unit
    {
        return Unit::create([
            'name' => 'Unit ' . $abbreviation,
            'abbreviation' => $abbreviation,
        ]);
    }

    /**
     * @param  array<int, array<string, mixed>>  $productUnits
     */
    private function postPhysicalProduct(
        array $productUnits,
        array $overrides = [],
    ) {
        $user = $this->createCashierUser(['products.create']);
        $category = $this->createCategory();
        $unit = $this->createUnit('pcs-' . uniqid());

        $payload = array_merge([
            'category_id' => $category->id,
            'barcode' => 'BC-' . uniqid(),
            'title' => 'Produk Uji',
            'description' => null,
            'product_type' => 'physical',
            'buy_price' => 1000,
            'stock' => 10,
            'product_units' => json_encode(array_map(function (array $row) use ($unit) {
                return array_merge([
                    'unit_id' => $unit->id,
                    'conversion_factor' => 1,
                    'sell_price' => 10000,
                    'is_base_unit' => true,
                    'is_default_sell' => true,
                ], $row);
            }, $productUnits)),
        ], $overrides);

        return $this->actingAs($user)->post(route('account.products.store'), $payload);
    }

    public function test_matching_default_unit_and_product_sell_price_saves_successfully(): void
    {
        $response = $this->postPhysicalProduct([
            ['sell_price' => 10000, 'is_base_unit' => true, 'is_default_sell' => true],
        ], [
            'sell_price' => 10000,
        ]);

        $response->assertRedirect(route('account.products.index'));
        $response->assertSessionHasNoErrors();
    }

    public function test_unit_price_one_thousand_times_product_price_is_rejected(): void
    {
        $response = $this->postPhysicalProduct([
            ['sell_price' => 800_000, 'is_base_unit' => true, 'is_default_sell' => true],
        ], [
            'sell_price' => 800,
        ]);

        $response->assertSessionHasErrors('sell_price');
        $response->assertSessionHasErrors([
            'sell_price' => 'Harga satuan (Rp 800.000) berbeda terlalu jauh dari harga jual produk (Rp 800) — selisih lebih dari 10×. Periksa kembali harga yang diisi.',
        ]);
    }

    public function test_product_price_one_thousand_times_unit_price_is_rejected(): void
    {
        $response = $this->postPhysicalProduct([
            ['sell_price' => 800, 'is_base_unit' => true, 'is_default_sell' => true],
        ], [
            'sell_price' => 800_000,
        ]);

        $response->assertSessionHasErrors('sell_price');
        $this->assertStringContainsString('Rp 800', session('errors')->get('sell_price')[0]);
        $this->assertStringContainsString('Rp 800.000', session('errors')->get('sell_price')[0]);
    }

    public function test_moderate_price_difference_within_ten_times_saves_successfully(): void
    {
        $response = $this->postPhysicalProduct([
            ['sell_price' => 30_000, 'is_base_unit' => true, 'is_default_sell' => true],
        ], [
            'sell_price' => 27_000,
        ]);

        $response->assertRedirect(route('account.products.index'));
        $response->assertSessionHasNoErrors();
    }

    public function test_positive_product_price_with_zero_unit_price_is_rejected(): void
    {
        $response = $this->postPhysicalProduct([
            ['sell_price' => 0, 'is_base_unit' => true, 'is_default_sell' => true],
        ], [
            'sell_price' => 800,
        ]);

        $response->assertSessionHasErrors('sell_price');
        $response->assertSessionHasErrors([
            'sell_price' => 'Harga satuan belum diisi (Rp 0) sedangkan harga jual produk Rp 800.',
        ]);
    }

    public function test_update_path_is_blocked_with_same_rules(): void
    {
        $user = $this->createCashierUser(['products.edit']);
        $catalog = $this->createPhysicalProduct([
            'sell_price' => 800,
        ]);

        $catalog['productUnit']->update(['sell_price' => 800_000]);

        $response = $this->actingAs($user)->put(route('account.products.update', $catalog['product']), [
            'category_id' => $catalog['category']->id,
            'barcode' => $catalog['product']->barcode,
            'title' => $catalog['product']->title,
            'description' => $catalog['product']->description,
            'product_type' => 'physical',
            'sell_price' => 800,
            'product_units' => json_encode([
                [
                    'unit_id' => $catalog['unit']->id,
                    'conversion_factor' => 1,
                    'sell_price' => 800_000,
                    'is_base_unit' => true,
                    'is_default_sell' => true,
                ],
            ]),
        ]);

        $response->assertSessionHasErrors('sell_price');
    }

    public function test_ppob_product_is_not_blocked_when_unit_price_is_zero(): void
    {
        $user = $this->createCashierUser(['products.create']);
        $category = $this->createCategory();

        $response = $this->actingAs($user)->post(route('account.products.store'), [
            'category_id' => $category->id,
            'barcode' => 'PPOB-' . uniqid(),
            'title' => 'Token Listrik',
            'description' => null,
            'product_type' => 'ppob',
            'buy_price' => 0,
            'stock' => 0,
        ]);

        $response->assertRedirect(route('account.products.index'));
        $response->assertSessionHasNoErrors();
    }

    public function test_additional_units_save_when_default_sell_matches_product_price(): void
    {
        $user = $this->createCashierUser(['products.create']);
        $category = $this->createCategory();
        $pcs = $this->createUnit('pcs-' . uniqid());
        $lusin = $this->createUnit('lsn-' . uniqid());

        $barcode = 'BC-' . uniqid();

        $response = $this->actingAs($user)->post(route('account.products.store'), [
            'category_id' => $category->id,
            'barcode' => $barcode,
            'title' => 'Produk Multi Satuan',
            'description' => null,
            'product_type' => 'physical',
            'buy_price' => 5000,
            'stock' => 20,
            'sell_price' => 10_000,
            'product_units' => json_encode([
                [
                    'unit_id' => $pcs->id,
                    'conversion_factor' => 1,
                    'sell_price' => 10_000,
                    'is_base_unit' => true,
                    'is_default_sell' => true,
                ],
                [
                    'unit_id' => $lusin->id,
                    'conversion_factor' => 12,
                    'sell_price' => 120_000,
                    'is_base_unit' => false,
                    'is_default_sell' => false,
                ],
            ]),
        ]);

        $response->assertRedirect(route('account.products.index'));
        $response->assertSessionHasNoErrors();

        $product = Product::query()->where('barcode', $barcode)->firstOrFail();
        $this->assertSame(10_000, (int) $product->sell_price);
        $this->assertDatabaseCount('product_units', 2);
    }
}
