<?php

namespace Tests\Feature;

use App\Models\ProductUnit;
use App\Models\Purchase;
use App\Models\Supplier;
use App\Models\Unit;
use App\Models\User;
use App\Services\PurchaseTaxCalculator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\Concerns\PosTestHelpers;
use Tests\TestCase;

class PurchaseTaxTest extends TestCase
{
    use PosTestHelpers;
    use RefreshDatabase;

    private PurchaseTaxCalculator $calculator;

    protected function setUp(): void
    {
        parent::setUp();

        $this->calculator = new PurchaseTaxCalculator();
    }

    protected function createPurchaseAdmin(): User
    {
        $this->seedPermissions([
            'purchases.index',
            'purchases.create',
            'purchases.show',
        ]);

        $role = Role::findOrCreate(config('roles.admin', 'admin'));
        $role->syncPermissions(Permission::all());

        $user = User::create([
            'name' => 'Purchase Admin',
            'username' => 'purchase-admin-' . uniqid(),
            'email' => 'purchase-admin-' . uniqid() . '@example.com',
            'password' => Hash::make('password'),
        ]);

        $user->assignRole($role);

        return $user;
    }

    protected function createSupplier(): Supplier
    {
        return Supplier::create([
            'name' => 'Supplier Test',
            'no_telp' => '08123456789',
            'email' => 'supplier@example.com',
            'address' => 'Jl. Test No. 1',
            'is_active' => true,
        ]);
    }

    public function test_allocate_distributes_tax_proportionally_with_last_line_absorbing_rounding(): void
    {
        $lines = [
            ['subtotal' => 101_351],
            ['subtotal' => 101_351],
            ['subtotal' => 101_351],
            ['subtotal' => 89_640],
            ['subtotal' => 109_910],
        ];

        $allocated = $this->calculator->allocate($lines, 55_326);

        $this->assertSame(11_134, $allocated[0]['tax_amount']);
        $this->assertSame(11_134, $allocated[1]['tax_amount']);
        $this->assertSame(11_134, $allocated[2]['tax_amount']);
        $this->assertSame(9_848, $allocated[3]['tax_amount']);
        $this->assertSame(12_076, $allocated[4]['tax_amount']);
        $this->assertSame(55_326, array_sum(array_column($allocated, 'tax_amount')));
    }

    public function test_purchase_without_tax_matches_legacy_totals_and_stock(): void
    {
        $user = $this->createPurchaseAdmin();
        $supplier = $this->createSupplier();
        ['product' => $product, 'unit' => $unit] = $this->createPhysicalProduct([
            'stock' => 50,
            'avg_cost' => 4_000,
            'buy_price' => 4_000,
        ]);

        $qty = 10;
        $buyPrice = 5_000;
        $expectedSubtotal = $qty * $buyPrice;

        $response = $this->actingAs($user)->post(route('account.purchases.store'), [
            'supplier_id' => $supplier->id,
            'purchase_date' => '2026-09-17',
            'items' => [
                [
                    'product_id' => $product->id,
                    'unit_id' => $unit->id,
                    'conversion_factor' => 1,
                    'qty' => $qty,
                    'buy_price' => $buyPrice,
                ],
            ],
        ]);

        $purchase = Purchase::query()->first();
        $product->refresh();

        $response->assertRedirect(route('account.purchases.show', $purchase->invoice));
        $this->assertSame($expectedSubtotal, $purchase->total_amount);
        $this->assertSame($expectedSubtotal, $purchase->dpp_amount);
        $this->assertSame(0, $purchase->tax_amount);
        $this->assertFalse($purchase->tax_included);
        $this->assertTrue($purchase->hpp_includes_tax);
        $this->assertSame(50 + $qty, $product->stock);
        $this->assertSame($buyPrice, $product->buy_price);
        $this->assertSame(
            (int) round(((50 * 4_000) + ($qty * $buyPrice)) / (50 + $qty)),
            $product->avg_cost,
        );
    }

    public function test_purchase_with_tax_on_multiple_products_maintains_invariants(): void
    {
        $user = $this->createPurchaseAdmin();
        $supplier = $this->createSupplier();

        $products = [];
        $items = [];
        $lineSpecs = [
            ['qty' => 1, 'buy_price' => 101_351],
            ['qty' => 1, 'buy_price' => 101_351],
            ['qty' => 1, 'buy_price' => 101_351],
            ['qty' => 1, 'buy_price' => 89_640],
            ['qty' => 1, 'buy_price' => 109_910],
        ];

        foreach ($lineSpecs as $spec) {
            ['product' => $product, 'unit' => $unit] = $this->createPhysicalProduct([
                'sell_price' => 500_000,
            ]);

            $products[] = $product;
            $items[] = [
                'product_id' => $product->id,
                'unit_id' => $unit->id,
                'conversion_factor' => 1,
                'qty' => $spec['qty'],
                'buy_price' => $spec['buy_price'],
            ];
        }

        $expectedSubtotal = collect($lineSpecs)->sum(fn (array $spec) => $spec['qty'] * $spec['buy_price']);

        $this->actingAs($user)->post(route('account.purchases.store'), [
            'supplier_id' => $supplier->id,
            'purchase_date' => '2026-09-17',
            'tax_amount' => 55_326,
            'tax_rate' => 11,
            'tax_included' => false,
            'items' => $items,
        ])->assertRedirect();

        $purchase = Purchase::query()->with('details')->first();

        $this->assertSame($expectedSubtotal, $purchase->dpp_amount);
        $this->assertSame(55_326, $purchase->tax_amount);
        $this->assertSame($expectedSubtotal + 55_326, $purchase->total_amount);
        $this->assertSame($purchase->dpp_amount + $purchase->tax_amount, $purchase->total_amount);
        $this->assertSame(55_326, $purchase->details->sum('tax_amount'));
        $this->assertSame([11_134, 11_134, 11_134, 9_848, 12_076], $purchase->details->pluck('tax_amount')->all());
    }

    public function test_tax_included_calculates_dpp_as_subtotal_minus_tax(): void
    {
        $user = $this->createPurchaseAdmin();
        $supplier = $this->createSupplier();
        ['product' => $product, 'unit' => $unit] = $this->createPhysicalProduct([
            'sell_price' => 500_000,
        ]);

        $subtotal = 220_000;
        $taxAmount = 21_892;

        $this->actingAs($user)->post(route('account.purchases.store'), [
            'supplier_id' => $supplier->id,
            'purchase_date' => '2026-09-17',
            'tax_amount' => $taxAmount,
            'tax_rate' => 11,
            'tax_included' => true,
            'items' => [
                [
                    'product_id' => $product->id,
                    'unit_id' => $unit->id,
                    'conversion_factor' => 1,
                    'qty' => 2,
                    'buy_price' => 110_000,
                ],
            ],
        ])->assertRedirect();

        $purchase = Purchase::query()->first();

        $this->assertTrue($purchase->tax_included);
        $this->assertSame($subtotal - $taxAmount, $purchase->dpp_amount);
        $this->assertSame($subtotal, $purchase->total_amount);
        $this->assertSame($purchase->dpp_amount + $purchase->tax_amount, $purchase->total_amount);
    }

    public function test_hpp_includes_tax_affects_buy_price_per_base_unit(): void
    {
        $user = $this->createPurchaseAdmin();
        $supplier = $this->createSupplier();
        ['product' => $baseProduct, 'unit' => $pcsUnit] = $this->createPhysicalProduct([
            'stock' => 0,
            'avg_cost' => 0,
            'buy_price' => 0,
            'sell_price' => 20_000,
        ]);

        $kartonUnit = Unit::create([
            'name' => 'Karton',
            'abbreviation' => 'ktn-' . uniqid(),
        ]);

        ProductUnit::create([
            'product_id' => $baseProduct->id,
            'unit_id' => $kartonUnit->id,
            'conversion_factor' => 24,
            'sell_price' => 120_000,
            'is_base_unit' => false,
            'is_default_sell' => false,
        ]);

        $dppSubtotal = 101_448;
        $taxAmount = 11_037;

        $this->actingAs($user)->post(route('account.purchases.store'), [
            'supplier_id' => $supplier->id,
            'purchase_date' => '2026-09-17',
            'tax_amount' => $taxAmount,
            'tax_rate' => 11,
            'tax_included' => false,
            'hpp_includes_tax' => true,
            'items' => [
                [
                    'product_id' => $baseProduct->id,
                    'unit_id' => $kartonUnit->id,
                    'conversion_factor' => 24,
                    'qty' => 1,
                    'buy_price' => $dppSubtotal,
                ],
            ],
        ])->assertRedirect();

        $baseProduct->refresh();

        $this->assertSame(4_687, $baseProduct->buy_price);
        $this->assertSame(4_687, $baseProduct->avg_cost);
        $this->assertSame(24, $baseProduct->stock);

        ['product' => $productWithoutTaxInHpp, 'unit' => $pcsUnit2] = $this->createPhysicalProduct([
            'stock' => 0,
            'avg_cost' => 0,
            'buy_price' => 0,
            'sell_price' => 20_000,
        ]);

        $kartonUnit2 = Unit::create([
            'name' => 'Karton',
            'abbreviation' => 'ktn2-' . uniqid(),
        ]);

        ProductUnit::create([
            'product_id' => $productWithoutTaxInHpp->id,
            'unit_id' => $kartonUnit2->id,
            'conversion_factor' => 24,
            'sell_price' => 120_000,
            'is_base_unit' => false,
            'is_default_sell' => false,
        ]);

        $this->actingAs($user)->post(route('account.purchases.store'), [
            'supplier_id' => $supplier->id,
            'purchase_date' => '2026-09-17',
            'tax_amount' => $taxAmount,
            'tax_rate' => 11,
            'tax_included' => false,
            'hpp_includes_tax' => false,
            'items' => [
                [
                    'product_id' => $productWithoutTaxInHpp->id,
                    'unit_id' => $kartonUnit2->id,
                    'conversion_factor' => 24,
                    'qty' => 1,
                    'buy_price' => $dppSubtotal,
                ],
            ],
        ])->assertRedirect();

        $productWithoutTaxInHpp->refresh();

        $this->assertSame(4_227, $productWithoutTaxInHpp->buy_price);
        $this->assertSame(4_227, $productWithoutTaxInHpp->avg_cost);
    }

    public function test_legacy_purchase_without_tax_fields_keeps_same_stock_and_hpp(): void
    {
        $user = $this->createPurchaseAdmin();
        $supplier = $this->createSupplier();
        ['product' => $product, 'unit' => $unit] = $this->createPhysicalProduct([
            'stock' => 80,
            'avg_cost' => 3_200,
            'buy_price' => 3_200,
            'sell_price' => 12_000,
        ]);

        $qty = 20;
        $buyPrice = 4_500;
        $stockBefore = 80;
        $currentAvgCost = 3_200;
        $qtyInBase = $qty;
        $stockAfter = $stockBefore + $qtyInBase;
        $expectedAvgCost = (int) round((($stockBefore * $currentAvgCost) + ($qtyInBase * $buyPrice)) / $stockAfter);

        $this->actingAs($user)->post(route('account.purchases.store'), [
            'supplier_id' => $supplier->id,
            'purchase_date' => '2026-09-17',
            'items' => [
                [
                    'product_id' => $product->id,
                    'unit_id' => $unit->id,
                    'conversion_factor' => 1,
                    'qty' => $qty,
                    'buy_price' => $buyPrice,
                ],
            ],
        ])->assertRedirect();

        $product->refresh();
        $purchase = Purchase::query()->first();

        $this->assertSame(0, $purchase->tax_amount);
        $this->assertSame($qty * $buyPrice, $purchase->total_amount);
        $this->assertSame($stockAfter, $product->stock);
        $this->assertSame($buyPrice, $product->buy_price);
        $this->assertSame($expectedAvgCost, $product->avg_cost);
    }
}
