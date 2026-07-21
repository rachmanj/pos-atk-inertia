<?php

namespace Tests\Feature\Telegram;

use App\Models\Cart;
use App\Models\PpobAccount;
use App\Models\Profit;
use App\Models\Setting;
use App\Models\Transaction;
use App\Services\Telegram\TelegramCommandParser;
use App\Services\Telegram\TelegramMoneyParser;
use App\Services\Telegram\TelegramPpobIntent;
use App\Services\Telegram\TelegramPpobSaleService;
use DomainException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\PosTestHelpers;
use Tests\TestCase;

class TelegramPpobSaleTest extends TestCase
{
    use PosTestHelpers;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Setting::create(['key' => 'ppob_admin_fee', 'value' => '2000', 'group' => 'ppob']);
        Setting::create(['key' => 'ppob_min_balance_default', 'value' => '100000', 'group' => 'ppob']);
    }

    public function test_sale_creates_transaction_detail_ppob_log_and_profit(): void
    {
        $user = $this->createCashierUser();
        $user->update(['telegram_id' => 123456]);
        $shift = $this->openCashierShift($user);
        $catalog = $this->createPpobProduct(['title' => 'Meterai Tempel', 'barcode' => 'MTR-TMP']);

        $account = PpobAccount::create([
            'name' => 'Kantor Pos',
            'current_balance' => 5_000_000,
            'min_balance_alert' => 100_000,
            'is_active' => true,
        ]);

        $physical = $this->createPhysicalProduct();
        $this->addCartItem($user, $physical['product'], $physical['unit'], 2, 10_000);

        $intent = new TelegramPpobIntent(
            raw: 'beli meterai 100 total 1jt',
            productQuery: 'meterai',
            qty: 100,
            customerRef: 'Kantor Pos',
            unitPpobCost: 10_000,
            adminFee: null,
        );

        $service = app(TelegramPpobSaleService::class);
        $message = $service->execute($user, $catalog['product'], $intent);

        $this->assertStringContainsString('Transaksi PPOB berhasil', $message);

        $transaction = Transaction::query()->latest('id')->first();
        $this->assertNotNull($transaction);
        $this->assertSame('cash', $transaction->payment_method);
        $this->assertSame(1_200_000, $transaction->grand_total);
        $this->assertSame('completed', $transaction->status);

        $this->assertDatabaseHas('transaction_details', [
            'transaction_id' => $transaction->id,
            'product_id' => $catalog['product']->id,
            'qty' => 100,
            'ppob_cost' => 10_000,
            'admin_fee' => 2000,
            'customer_ref' => 'Kantor Pos',
        ]);

        $this->assertDatabaseHas('ppob_balance_logs', [
            'ppob_account_id' => $account->id,
            'type' => 'sale',
            'amount' => -1_000_000,
            'cashier_shift_id' => $shift->id,
        ]);

        $this->assertDatabaseHas('profits', [
            'transaction_id' => $transaction->id,
            'total_revenue' => 1_200_000,
            'total_cost' => 1_000_000,
            'profit_amount' => 200_000,
        ]);

        $this->assertDatabaseCount('carts', 1);
    }

    public function test_sale_rejects_when_shift_closed(): void
    {
        $user = $this->createCashierUser();
        $catalog = $this->createPpobProduct();
        PpobAccount::create([
            'name' => 'Kantor Pos',
            'current_balance' => 1_000_000,
            'min_balance_alert' => 100_000,
            'is_active' => true,
        ]);

        $intent = new TelegramPpobIntent(
            raw: 'beli meterai 1 total 10rb',
            productQuery: 'meterai',
            qty: 1,
            customerRef: null,
            unitPpobCost: 10_000,
            adminFee: null,
        );

        $this->expectException(DomainException::class);
        $this->expectExceptionMessage('Buka shift kasir');

        app(TelegramPpobSaleService::class)->execute($user, $catalog['product'], $intent);
    }

    public function test_sale_rejects_without_ppob_account(): void
    {
        $user = $this->createCashierUser();
        $this->openCashierShift($user);
        $catalog = $this->createPpobProduct();

        $intent = new TelegramPpobIntent(
            raw: 'beli meterai 1 total 10rb',
            productQuery: 'meterai',
            qty: 1,
            customerRef: null,
            unitPpobCost: 10_000,
            adminFee: null,
        );

        $this->expectException(DomainException::class);
        $this->expectExceptionMessage('Akun PPOB aktif belum dikonfigurasi');

        app(TelegramPpobSaleService::class)->execute($user, $catalog['product'], $intent);
    }

    public function test_sale_rejects_inactive_product(): void
    {
        $user = $this->createCashierUser();
        $this->openCashierShift($user);
        $catalog = $this->createPpobProduct(['is_active' => false]);
        PpobAccount::create([
            'name' => 'Kantor Pos',
            'current_balance' => 1_000_000,
            'min_balance_alert' => 100_000,
            'is_active' => true,
        ]);

        $intent = new TelegramPpobIntent(
            raw: 'beli meterai 1 total 10rb',
            productQuery: 'meterai',
            qty: 1,
            customerRef: null,
            unitPpobCost: 10_000,
            adminFee: null,
        );

        $this->expectException(DomainException::class);
        $this->expectExceptionMessage('tidak aktif');

        app(TelegramPpobSaleService::class)->execute($user, $catalog['product'], $intent);
    }

    public function test_low_balance_warning_in_success_message(): void
    {
        $user = $this->createCashierUser();
        $this->openCashierShift($user);
        $catalog = $this->createPpobProduct();

        PpobAccount::create([
            'name' => 'Kantor Pos',
            'current_balance' => 50_000,
            'min_balance_alert' => 100_000,
            'is_active' => true,
        ]);

        $intent = new TelegramPpobIntent(
            raw: 'beli meterai 1 total 10rb',
            productQuery: 'meterai',
            qty: 1,
            customerRef: null,
            unitPpobCost: 10_000,
            adminFee: null,
        );

        $message = app(TelegramPpobSaleService::class)->execute($user, $catalog['product'], $intent);

        $this->assertStringContainsString('Saldo PPOB rendah', $message);
    }

    public function test_command_parser_integration_with_total_keyword(): void
    {
        $parser = new TelegramCommandParser(new TelegramMoneyParser);
        $intent = $parser->parseBuyCommand('beli TOKEN LISTRIK 1 untuk 1234567890 total 100rb');

        $this->assertSame('token listrik', $intent->productQuery);
        $this->assertSame('1234567890', $intent->customerRef);
        $this->assertSame(100_000, $intent->unitPpobCost);
    }
}
