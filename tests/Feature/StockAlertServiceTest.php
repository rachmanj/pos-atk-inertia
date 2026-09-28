<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\Setting;
use App\Services\StockAlertService;
use App\Services\TelegramNotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\Concerns\PosTestHelpers;
use Tests\TestCase;

class StockAlertServiceTest extends TestCase
{
    use PosTestHelpers;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Setting::query()->create([
            'key' => 'stock_alert.enabled',
            'value' => '1',
            'group' => 'stock_alert',
        ]);

        Setting::query()->create([
            'key' => 'stock_alert.threshold',
            'value' => '10',
            'group' => 'stock_alert',
        ]);

        Setting::query()->create([
            'key' => 'stock_alert.product_ids',
            'value' => '',
            'group' => 'stock_alert',
        ]);

        Setting::query()->create([
            'key' => 'stock_alert.keyword',
            'value' => 'METERAI',
            'group' => 'stock_alert',
        ]);
    }

    protected function tearDown(): void
    {
        Mockery::close();

        parent::tearDown();
    }

    public function test_stock_above_threshold_does_not_send_alert(): void
    {
        ['product' => $product] = $this->createPhysicalProduct([
            'title' => 'METERAI 10000',
            'stock' => 11,
        ]);

        Setting::query()->updateOrCreate(
            ['key' => 'stock_alert.product_ids'],
            ['value' => (string) $product->id, 'group' => 'stock_alert'],
        );

        $telegram = Mockery::mock(TelegramNotificationService::class);
        $telegram->shouldNotReceive('sendText');
        $this->app->instance(TelegramNotificationService::class, $telegram);

        $results = app(StockAlertService::class)->check([$product->id]);

        $this->assertSame([], $results);
    }

    public function test_stock_at_threshold_sends_alert_with_expected_message(): void
    {
        ['product' => $product] = $this->createPhysicalProduct([
            'title' => 'METERAI 10000',
            'stock' => 10,
            'unit' => 'pcs',
        ]);

        Setting::query()->updateOrCreate(
            ['key' => 'stock_alert.product_ids'],
            ['value' => (string) $product->id, 'group' => 'stock_alert'],
        );

        $telegram = Mockery::mock(TelegramNotificationService::class);
        $telegram->shouldReceive('recipients')->once()->andReturn(['268015883']);
        $telegram->shouldReceive('sendText')
            ->once()
            ->with('268015883', Mockery::on(function (string $text) use ($product): bool {
                $this->assertStringContainsString('⚠️ STOK MENIPIS — VASIA', $text);
                $this->assertStringContainsString('Produk : METERAI 10000', $text);
                $this->assertStringContainsString('Sisa   : 10 pcs (batas 10)', $text);
                $this->assertStringContainsString('Waktu  :', $text);
                $this->assertStringContainsString('Sumber : penjualan TRX-TEST-001', $text);

                return true;
            }))
            ->andReturn('sent');

        $this->app->instance(TelegramNotificationService::class, $telegram);

        $results = app(StockAlertService::class)->check(
            [$product->id],
            'penjualan TRX-TEST-001',
        );

        $this->assertCount(1, $results);
        $this->assertSame($product->id, $results[0]['product_id']);
        $this->assertSame(10, $results[0]['stock']);
    }

    public function test_second_check_within_24_hours_does_not_resend(): void
    {
        ['product' => $product] = $this->createPhysicalProduct([
            'title' => 'METERAI 10000',
            'stock' => 5,
        ]);

        Setting::query()->updateOrCreate(
            ['key' => 'stock_alert.product_ids'],
            ['value' => (string) $product->id, 'group' => 'stock_alert'],
        );

        Setting::query()->updateOrCreate(
            ['key' => 'stock_alert.last_sent.' . $product->id],
            ['value' => now()->subHours(2)->toDateTimeString(), 'group' => 'stock_alert'],
        );

        $telegram = Mockery::mock(TelegramNotificationService::class);
        $telegram->shouldNotReceive('sendText');
        $this->app->instance(TelegramNotificationService::class, $telegram);

        $results = app(StockAlertService::class)->check([$product->id]);

        $this->assertSame([], $results);
    }

    public function test_disabled_feature_does_not_send(): void
    {
        ['product' => $product] = $this->createPhysicalProduct([
            'title' => 'METERAI 10000',
            'stock' => 3,
        ]);

        Setting::query()->updateOrCreate(
            ['key' => 'stock_alert.enabled'],
            ['value' => '0', 'group' => 'stock_alert'],
        );

        Setting::query()->updateOrCreate(
            ['key' => 'stock_alert.product_ids'],
            ['value' => (string) $product->id, 'group' => 'stock_alert'],
        );

        $telegram = Mockery::mock(TelegramNotificationService::class);
        $telegram->shouldNotReceive('sendText');
        $this->app->instance(TelegramNotificationService::class, $telegram);

        $results = app(StockAlertService::class)->check([$product->id]);

        $this->assertSame([], $results);
    }

    public function test_check_all_uses_meterai_keyword_when_product_ids_empty(): void
    {
        $meterai = $this->createPhysicalProduct([
            'title' => 'METERAI 5000',
            'stock' => 8,
        ])['product'];

        $other = $this->createPhysicalProduct([
            'title' => 'Pulpen biasa',
            'stock' => 2,
        ])['product'];

        Setting::query()->where('key', 'stock_alert.product_ids')->update(['value' => '']);

        $telegram = Mockery::mock(TelegramNotificationService::class);
        $telegram->shouldReceive('recipients')->once()->andReturn(['111']);
        $telegram->shouldReceive('sendText')
            ->once()
            ->with('111', Mockery::on(fn (string $text): bool => str_contains($text, 'METERAI 5000')))
            ->andReturn('sent');

        $this->app->instance(TelegramNotificationService::class, $telegram);

        $results = app(StockAlertService::class)->checkAll();

        $this->assertCount(1, $results);
        $this->assertSame($meterai->id, $results[0]['product_id']);
        $this->assertNotContains($other->id, array_column($results, 'product_id'));
    }
}
