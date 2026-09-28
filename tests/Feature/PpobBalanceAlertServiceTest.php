<?php

namespace Tests\Feature;

use App\Models\PpobAccount;
use App\Models\Setting;
use App\Services\PpobBalanceAlertService;
use App\Services\PpobBalanceService;
use App\Services\TelegramNotificationService;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Mockery;
use Tests\TestCase;

class PpobBalanceAlertServiceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Setting::query()->create([
            'key' => 'ppob_balance_alert.enabled',
            'value' => '1',
            'group' => 'ppob_balance_alert',
        ]);

        Setting::query()->create([
            'key' => 'ppob_min_balance_default',
            'value' => '100000',
            'group' => 'ppob',
        ]);
    }

    protected function tearDown(): void
    {
        Mockery::close();

        parent::tearDown();
    }

    public function test_balance_above_threshold_does_not_send_alert(): void
    {
        $account = PpobAccount::create([
            'name' => 'KIOSK',
            'current_balance' => 100_001,
            'min_balance_alert' => 100_000,
            'is_active' => true,
        ]);

        $telegram = Mockery::mock(TelegramNotificationService::class);
        $telegram->shouldNotReceive('sendText');
        $this->app->instance(TelegramNotificationService::class, $telegram);

        $results = app(PpobBalanceAlertService::class)->check($account);

        $this->assertSame([], $results);
    }

    public function test_balance_at_threshold_sends_alert_with_expected_message(): void
    {
        $account = PpobAccount::create([
            'name' => 'KIOSK',
            'current_balance' => 100_000,
            'min_balance_alert' => 100_000,
            'is_active' => true,
        ]);

        $telegram = Mockery::mock(TelegramNotificationService::class);
        $telegram->shouldReceive('recipients')->once()->andReturn(['268015883']);
        $telegram->shouldReceive('sendText')
            ->once()
            ->with('268015883', Mockery::on(function (string $text): bool {
                $this->assertStringContainsString('⚠️ SALDO PPOB MENIPIS — VASIA', $text);
                $this->assertStringContainsString('Akun  : KIOSK', $text);
                $this->assertStringContainsString('Saldo : Rp 100.000', $text);
                $this->assertStringContainsString('Batas : Rp 100.000', $text);
                $this->assertStringContainsString('Waktu :', $text);

                return true;
            }))
            ->andReturn('sent');

        $this->app->instance(TelegramNotificationService::class, $telegram);

        $results = app(PpobBalanceAlertService::class)->check($account);

        $this->assertCount(1, $results);
        $this->assertSame($account->id, $results[0]['account_id']);
        $this->assertSame(100_000, $results[0]['balance']);
    }

    public function test_balance_below_threshold_sends_alert(): void
    {
        $account = PpobAccount::create([
            'name' => 'KIOSK',
            'current_balance' => 95_000,
            'min_balance_alert' => 100_000,
            'is_active' => true,
        ]);

        $telegram = Mockery::mock(TelegramNotificationService::class);
        $telegram->shouldReceive('recipients')->once()->andReturn(['111']);
        $telegram->shouldReceive('sendText')
            ->once()
            ->with('111', Mockery::on(fn (string $text): bool => str_contains($text, 'Saldo : Rp 95.000')))
            ->andReturn('sent');

        $this->app->instance(TelegramNotificationService::class, $telegram);

        $results = app(PpobBalanceAlertService::class)->check($account);

        $this->assertCount(1, $results);
    }

    public function test_second_check_within_24_hours_does_not_resend(): void
    {
        $account = PpobAccount::create([
            'name' => 'KIOSK',
            'current_balance' => 50_000,
            'min_balance_alert' => 100_000,
            'is_active' => true,
        ]);

        Setting::query()->updateOrCreate(
            ['key' => 'ppob_balance_alert.last_sent.' . $account->id],
            ['value' => now()->subHours(2)->toDateTimeString(), 'group' => 'ppob_balance_alert'],
        );

        $telegram = Mockery::mock(TelegramNotificationService::class);
        $telegram->shouldNotReceive('sendText');
        $this->app->instance(TelegramNotificationService::class, $telegram);

        $results = app(PpobBalanceAlertService::class)->check($account);

        $this->assertSame([], $results);
    }

    public function test_disabled_feature_does_not_send(): void
    {
        $account = PpobAccount::create([
            'name' => 'KIOSK',
            'current_balance' => 10_000,
            'min_balance_alert' => 100_000,
            'is_active' => true,
        ]);

        Setting::query()->updateOrCreate(
            ['key' => 'ppob_balance_alert.enabled'],
            ['value' => '0', 'group' => 'ppob_balance_alert'],
        );

        $telegram = Mockery::mock(TelegramNotificationService::class);
        $telegram->shouldNotReceive('sendText');
        $this->app->instance(TelegramNotificationService::class, $telegram);

        $results = app(PpobBalanceAlertService::class)->check($account);

        $this->assertSame([], $results);
    }

    public function test_telegram_send_failure_does_not_fail_record_movement(): void
    {
        $user = User::create([
            'name' => 'Test User',
            'username' => 'ppob-alert-fail',
            'email' => 'ppob-alert-fail@example.com',
            'password' => Hash::make('password'),
        ]);

        $account = PpobAccount::create([
            'name' => 'KIOSK',
            'current_balance' => 101_000,
            'min_balance_alert' => 100_000,
            'is_active' => true,
        ]);

        $telegram = Mockery::mock(TelegramNotificationService::class);
        $telegram->shouldReceive('recipients')->andReturn(['999']);
        $telegram->shouldReceive('sendText')
            ->andThrow(new \DomainException('Telegram down'));
        $this->app->instance(TelegramNotificationService::class, $telegram);

        app(PpobBalanceService::class)->recordMovement(
            account: $account,
            userId: $user->id,
            type: 'sale',
            amount: -10_000,
        );

        $account->refresh();

        $this->assertSame(91_000, $account->current_balance);
        $this->assertDatabaseHas('ppob_balance_logs', [
            'ppob_account_id' => $account->id,
            'balance_after' => 91_000,
        ]);
    }
}
