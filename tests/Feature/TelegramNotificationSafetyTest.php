<?php

namespace Tests\Feature;

use App\Models\Purchase;
use App\Models\Setting;
use App\Models\Supplier;
use App\Models\User;
use App\Services\TelegramNotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\Concerns\PosTestHelpers;
use Tests\TestCase;

class TelegramNotificationSafetyTest extends TestCase
{
    use PosTestHelpers;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Http::fake();

        Setting::query()->create([
            'key' => 'telegram.admin_chat_ids',
            'value' => '268015883,999888777',
            'group' => 'telegram',
        ]);

        Setting::query()->create([
            'key' => 'telegram.nontunai_enabled',
            'value' => '1',
            'group' => 'telegram',
        ]);
    }

    public function test_qris_checkout_does_not_send_real_http_to_telegram(): void
    {
        $user = $this->createCashierUser();
        $this->openCashierShift($user);
        $catalog = $this->createPhysicalProduct();
        $this->addCartItem($user, $catalog['product'], $catalog['unit'], 2, 10_000);

        $response = $this->actingAs($user)->postJson(route('account.transactions.store'), [
            'payment_method' => 'qris',
        ]);

        $response->assertOk()->assertJson([
            'success' => true,
            'payment_method' => 'qris',
        ]);

        Http::assertNothingSent();
    }

    public function test_transfer_checkout_does_not_send_real_http_to_telegram(): void
    {
        $user = $this->createCashierUser();
        $this->openCashierShift($user);
        $catalog = $this->createPhysicalProduct();
        $this->addCartItem($user, $catalog['product'], $catalog['unit'], 1, 10_000);

        $response = $this->actingAs($user)->postJson(route('account.transactions.store'), [
            'payment_method' => 'transfer',
        ]);

        $response->assertOk()->assertJson([
            'success' => true,
            'payment_method' => 'transfer',
        ]);

        Http::assertNothingSent();
    }

    public function test_recipients_returns_empty_array_when_setting_is_missing(): void
    {
        Setting::query()->where('key', 'telegram.admin_chat_ids')->delete();

        $recipients = app(TelegramNotificationService::class)->recipients();

        $this->assertSame([], $recipients);
    }

    public function test_recipients_parses_admin_chat_ids_from_setting(): void
    {
        Setting::query()->where('key', 'telegram.admin_chat_ids')->update([
            'value' => '111, 222',
        ]);

        $recipients = app(TelegramNotificationService::class)->recipients();

        $this->assertSame(['111', '222'], $recipients);
    }

    public function test_purchase_store_does_not_send_real_http_to_telegram(): void
    {
        $user = $this->createPurchaseAdmin();
        $supplier = $this->createSupplier();
        ['product' => $product, 'unit' => $unit] = $this->createPhysicalProduct(['stock' => 10]);

        $response = $this->actingAs($user)->post(route('account.purchases.store'), [
            'supplier_id' => $supplier->id,
            'purchase_date' => '2026-09-17',
            'items' => [
                [
                    'product_id' => $product->id,
                    'unit_id' => $unit->id,
                    'conversion_factor' => 1,
                    'qty' => 2,
                    'buy_price' => 5_000,
                ],
            ],
        ]);

        $purchase = Purchase::query()->firstOrFail();

        $response->assertRedirect(route('account.purchases.show', $purchase->invoice));

        Http::assertNothingSent();
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
}
