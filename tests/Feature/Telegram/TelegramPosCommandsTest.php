<?php

namespace Tests\Feature\Telegram;

use App\Models\PpobAccount;
use App\Models\Transaction;
use App\Services\Telegram\TelegramPosQueryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\Concerns\PosTestHelpers;
use Tests\TestCase;

class TelegramPosCommandsTest extends TestCase
{
    use PosTestHelpers;
    use RefreshDatabase;

    protected TelegramPosQueryService $queryService;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'telegram.token' => 'test-bot-token',
            'telegram.webhook_secret' => 'test-webhook-secret',
        ]);

        Http::fake([
            'api.telegram.org/*' => Http::response(['ok' => true, 'result' => []]),
        ]);

        $this->queryService = app(TelegramPosQueryService::class);
    }

    public function test_cari_returns_matching_products(): void
    {
        $catalog = $this->createPhysicalProduct(['title' => 'Pulpen Biru', 'stock' => 12]);
        $this->createPhysicalProduct(['title' => 'Buku Tulis', 'stock' => 5]);

        $message = $this->queryService->handleCari('pulpen');

        $this->assertStringContainsString('Pulpen Biru', $message);
        $this->assertStringContainsString('12', $message);
        $this->assertStringNotContainsString('Buku Tulis', $message);
    }

    public function test_cari_returns_not_found_message(): void
    {
        $message = $this->queryService->handleCari('produk-ga-ada');

        $this->assertStringContainsString('tidak ditemukan', $message);
    }

    public function test_stok_returns_detail_for_single_match(): void
    {
        $catalog = $this->createPhysicalProduct(['title' => 'Spidol Hitam', 'stock' => 7, 'sell_price' => 5000]);

        $message = $this->queryService->handleStok('spidol');

        $this->assertStringContainsString('Spidol Hitam', $message);
        $this->assertStringContainsString('7', $message);
        $this->assertStringContainsString('Rp 5.000', $message);
    }

    public function test_produk_returns_random_active_products(): void
    {
        $this->createPhysicalProduct(['title' => 'Produk A']);
        $this->createPhysicalProduct(['title' => 'Produk B']);

        $message = $this->queryService->handleProduk();

        $this->assertStringContainsString('Produk aktif', $message);
        $this->assertTrue(
            str_contains($message, 'Produk A') || str_contains($message, 'Produk B')
        );
    }

    public function test_transaksi_returns_today_transactions(): void
    {
        $user = $this->createCashierUser();
        $catalog = $this->createPhysicalProduct();
        $transaction = $this->createCompletedCashTransaction(
            $user,
            $catalog['product'],
            $catalog['unit'],
            2,
            10_000
        );

        $message = $this->queryService->handleTransaksi($user);

        $this->assertStringContainsString($transaction->invoice, $message);
        $this->assertStringContainsString('Rp 20.000', $message);
    }

    public function test_transaksi_returns_empty_message_when_no_sales_today(): void
    {
        $user = $this->createCashierUser();

        $message = $this->queryService->handleTransaksi($user);

        $this->assertStringContainsString('Belum ada transaksi', $message);
    }

    public function test_saldo_returns_ppob_balance(): void
    {
        PpobAccount::create([
            'name' => 'Kantor Pos',
            'current_balance' => 2_500_000,
            'min_balance_alert' => 100_000,
            'is_active' => true,
        ]);

        $message = $this->queryService->handleSaldo();

        $this->assertStringContainsString('Kantor Pos', $message);
        $this->assertStringContainsString('Rp 2.500.000', $message);
    }

    public function test_shift_returns_open_shift_summary(): void
    {
        $user = $this->createCashierUser();
        $this->openCashierShift($user, 150_000);

        $message = $this->queryService->handleShift($user);

        $this->assertStringContainsString('Status Shift', $message);
        $this->assertStringContainsString('Rp 150.000', $message);
    }

    public function test_shift_returns_message_when_not_open(): void
    {
        $user = $this->createCashierUser();

        $message = $this->queryService->handleShift($user);

        $this->assertStringContainsString('belum dibuka', $message);
    }

    public function test_laporan_returns_today_sales_summary(): void
    {
        $user = $this->createCashierUser();
        $catalog = $this->createPhysicalProduct();
        $this->createCompletedCashTransaction($user, $catalog['product'], $catalog['unit'], 1, 25_000);

        $message = $this->queryService->handleLaporan($user);

        $this->assertStringContainsString('Laporan Penjualan', $message);
        $this->assertStringContainsString('Rp 25.000', $message);
        $this->assertStringContainsString('Total transaksi: 1', $message);
    }

    public function test_webhook_handles_cari_command_for_linked_user(): void
    {
        $user = $this->createCashierUser();
        $user->update(['telegram_id' => 555001]);
        $this->createPhysicalProduct(['title' => 'Kertas HVS']);

        $response = $this->postJson(route('telegram.webhook'), [
            'update_id' => 1001,
            'message' => [
                'message_id' => 10,
                'from' => ['id' => 555001],
                'chat' => ['id' => 555001, 'type' => 'private'],
                'text' => '/cari kertas',
            ],
        ], [
            'X-Telegram-Bot-Api-Secret-Token' => 'test-webhook-secret',
        ]);

        $response->assertOk();

        Http::assertSent(function ($request) {
            $body = $request->data();

            return str_contains($body['text'] ?? '', 'Kertas HVS');
        });
    }

    public function test_webhook_handles_laporan_command(): void
    {
        $user = $this->createCashierUser();
        $user->update(['telegram_id' => 555002]);

        $response = $this->postJson(route('telegram.webhook'), [
            'update_id' => 1002,
            'message' => [
                'message_id' => 11,
                'from' => ['id' => 555002],
                'chat' => ['id' => 555002, 'type' => 'private'],
                'text' => '/laporan',
            ],
        ], [
            'X-Telegram-Bot-Api-Secret-Token' => 'test-webhook-secret',
        ]);

        $response->assertOk();

        Http::assertSent(function ($request) {
            $body = $request->data();

            return str_contains($body['text'] ?? '', 'Belum ada penjualan');
        });
    }
}
