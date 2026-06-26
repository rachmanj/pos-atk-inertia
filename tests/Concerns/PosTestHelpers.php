<?php

namespace Tests\Concerns;

use App\Models\Cart;
use App\Models\CashierShift;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductComponent;
use App\Models\ProductUnit;
use App\Models\Transaction;
use App\Models\TransactionDetail;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

trait PosTestHelpers
{
    protected function seedPermissions(array $names): void
    {
        foreach ($names as $name) {
            Permission::findOrCreate($name);
        }
    }

    protected function createCashierUser(array $permissions = ['transactions.create']): User
    {
        $this->seedPermissions(array_merge($permissions, ['transactions.void']));

        $role = Role::findOrCreate(config('roles.cashier', 'cashier'));
        $role->syncPermissions($permissions);

        $user = User::create([
            'name' => 'Test Kasir',
            'email' => 'kasir-test-' . uniqid() . '@example.com',
            'password' => Hash::make('password'),
        ]);

        $user->assignRole($role);

        return $user;
    }

    protected function openCashierShift(User $user, int $cashInHand = 100_000): CashierShift
    {
        return CashierShift::create([
            'user_id' => $user->id,
            'opened_at' => now(),
            'cash_in_hand' => $cashInHand,
            'status' => 'open',
        ]);
    }

    protected function createPhysicalProduct(array $overrides = []): array
    {
        $category = Category::create([
            'name' => 'Test Category ' . uniqid(),
            'slug' => 'test-category-' . uniqid(),
        ]);

        $unit = Unit::create([
            'name' => 'Pieces',
            'abbreviation' => 'pcs-' . uniqid(),
        ]);

        $product = Product::create(array_merge([
            'category_id' => $category->id,
            'barcode' => 'BC-' . uniqid(),
            'title' => 'Test Product',
            'slug' => 'test-product-' . uniqid(),
            'product_type' => 'physical',
            'buy_price' => 5000,
            'sell_price' => 10000,
            'avg_cost' => 5000,
            'unit' => $unit->abbreviation,
            'stock' => 100,
            'is_active' => true,
        ], $overrides));

        $productUnit = ProductUnit::create([
            'product_id' => $product->id,
            'unit_id' => $unit->id,
            'conversion_factor' => 1,
            'sell_price' => $overrides['sell_price'] ?? 10000,
            'is_base_unit' => true,
            'is_default_sell' => true,
        ]);

        return compact('category', 'unit', 'product', 'productUnit');
    }

    protected function createServiceProduct(array $componentCatalogs, array $overrides = []): array
    {
        $category = Category::create([
            'name' => 'Service Category ' . uniqid(),
            'slug' => 'service-category-' . uniqid(),
        ]);

        $unit = Unit::create([
            'name' => 'Sheet',
            'abbreviation' => 'lsn-' . uniqid(),
        ]);

        $sellPrice = $overrides['sell_price'] ?? 5000;

        $service = Product::create(array_merge([
            'category_id' => $category->id,
            'barcode' => 'SV-' . uniqid(),
            'title' => 'Test Service',
            'slug' => 'test-service-' . uniqid(),
            'product_type' => 'service',
            'buy_price' => 0,
            'sell_price' => $sellPrice,
            'avg_cost' => 0,
            'unit' => $unit->abbreviation,
            'stock' => 0,
            'is_active' => true,
        ], $overrides));

        $serviceUnit = ProductUnit::create([
            'product_id' => $service->id,
            'unit_id' => $unit->id,
            'conversion_factor' => 1,
            'sell_price' => $sellPrice,
            'is_base_unit' => true,
            'is_default_sell' => true,
        ]);

        $components = [];

        foreach ($componentCatalogs as $componentCatalog) {
            $components[] = ProductComponent::create([
                'service_product_id' => $service->id,
                'component_product_id' => $componentCatalog['product']->id,
                'qty_per_unit' => $componentCatalog['qty_per_unit'] ?? 1,
            ]);
        }

        return compact('category', 'unit', 'service', 'serviceUnit', 'components');
    }

    protected function addCartItem(User $user, Product $product, Unit $unit, int $qty = 1, int $price = 10000): Cart
    {
        return Cart::create([
            'cashier_id' => $user->id,
            'product_id' => $product->id,
            'unit_id' => $unit->id,
            'qty' => $qty,
            'price' => $price,
        ]);
    }

    protected function createCompletedCashTransaction(User $user, Product $product, Unit $unit, int $qty = 1, int $price = 10000): Transaction
    {
        $this->openCashierShift($user);
        $this->addCartItem($user, $product, $unit, $qty, $price);

        $response = $this->actingAs($user)->postJson(route('account.transactions.store'), [
            'payment_method' => 'cash',
            'cash' => $price * $qty,
        ]);

        $response->assertOk()->assertJson(['success' => true]);

        return Transaction::where('invoice', $response->json('invoice'))->firstOrFail();
    }

    protected function buildMidtransCallbackPayload(Transaction $transaction, string $transactionStatus, string $statusCode = '200'): array
    {
        $serverKey = config('midtrans.server_key', '');

        $payload = [
            'order_id' => $transaction->invoice,
            'status_code' => $statusCode,
            'gross_amount' => (string) $transaction->grand_total,
            'transaction_status' => $transactionStatus,
            'transaction_id' => 'midtrans-' . uniqid(),
            'fraud_status' => 'accept',
        ];

        $payload['signature_key'] = hash(
            'sha512',
            $payload['order_id'] .
                $payload['status_code'] .
                $payload['gross_amount'] .
                $serverKey
        );

        return $payload;
    }

    protected function createTransactionDetail(Transaction $transaction, Product $product, Unit $unit, array $overrides = []): TransactionDetail
    {
        return TransactionDetail::create(array_merge([
            'transaction_id' => $transaction->id,
            'product_id' => $product->id,
            'unit_id' => $unit->id,
            'conversion_factor' => 1,
            'qty' => 1,
            'price' => 10000,
            'buy_price' => 5000,
            'subtotal' => 10000,
        ], $overrides));
    }
}
