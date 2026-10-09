<?php

namespace Tests\Feature;

use App\Models\PpobAccount;
use App\Models\Setting;
use App\Models\User;
use App\Services\PpobBalanceService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class PpobTopUpFeeTest extends TestCase
{
    use RefreshDatabase;

    private function seedDefaultTopUpFeeSettings(): void
    {
        Setting::query()->create([
            'key' => 'ppob_topup_fee',
            'value' => '1500',
            'group' => 'ppob',
        ]);

        Setting::query()->create([
            'key' => 'ppob_topup_fee_enabled',
            'value' => '1',
            'group' => 'ppob',
        ]);
    }

    private function createUserAndAccount(int $openingBalance = 0): array
    {
        $user = User::create([
            'name' => 'Admin PPOB',
            'username' => 'ppob-topup-fee',
            'email' => 'ppob-topup-fee@example.com',
            'password' => Hash::make('password'),
        ]);

        $account = PpobAccount::create([
            'name' => 'H2H Utama',
            'current_balance' => $openingBalance,
            'min_balance_alert' => 1000,
            'is_active' => true,
        ]);

        return [$user, $account];
    }

    public function test_top_up_records_automatic_deposit_admin_fee(): void
    {
        $this->seedDefaultTopUpFeeSettings();

        [$user, $account] = $this->createUserAndAccount(10_000);

        $service = app(PpobBalanceService::class);

        $service->recordMovement(
            account: $account,
            userId: $user->id,
            type: 'top_up',
            amount: 100_000,
            note: 'Setoran H2H',
        );

        $account->refresh();

        $this->assertSame(108_500, $account->current_balance);

        $this->assertDatabaseHas('ppob_balance_logs', [
            'ppob_account_id' => $account->id,
            'type' => 'top_up',
            'amount' => 100_000,
        ]);

        $this->assertDatabaseHas('ppob_balance_logs', [
            'ppob_account_id' => $account->id,
            'type' => 'adjustment',
            'amount' => -1500,
            'note' => 'Biaya administrasi setoran otomatis (Rp 1.500)',
        ]);

        $this->assertDatabaseCount('ppob_balance_logs', 2);
    }

    public function test_top_up_fee_disabled_does_not_deduct(): void
    {
        Setting::query()->create([
            'key' => 'ppob_topup_fee',
            'value' => '1500',
            'group' => 'ppob',
        ]);

        Setting::query()->create([
            'key' => 'ppob_topup_fee_enabled',
            'value' => '0',
            'group' => 'ppob',
        ]);

        [$user, $account] = $this->createUserAndAccount(0);

        app(PpobBalanceService::class)->recordMovement(
            account: $account,
            userId: $user->id,
            type: 'top_up',
            amount: 50_000,
        );

        $account->refresh();

        $this->assertSame(50_000, $account->current_balance);
        $this->assertDatabaseCount('ppob_balance_logs', 1);
    }

    public function test_top_up_uses_custom_fee_amount_from_settings(): void
    {
        Setting::query()->create([
            'key' => 'ppob_topup_fee',
            'value' => '2500',
            'group' => 'ppob',
        ]);

        Setting::query()->create([
            'key' => 'ppob_topup_fee_enabled',
            'value' => '1',
            'group' => 'ppob',
        ]);

        [$user, $account] = $this->createUserAndAccount(0);

        app(PpobBalanceService::class)->recordMovement(
            account: $account,
            userId: $user->id,
            type: 'top_up',
            amount: 20_000,
        );

        $account->refresh();

        $this->assertSame(17_500, $account->current_balance);

        $this->assertDatabaseHas('ppob_balance_logs', [
            'type' => 'adjustment',
            'amount' => -2500,
            'note' => 'Biaya administrasi setoran otomatis (Rp 2.500)',
        ]);
    }

    public function test_defaults_apply_fee_when_settings_missing(): void
    {
        [$user, $account] = $this->createUserAndAccount(0);

        app(PpobBalanceService::class)->recordMovement(
            account: $account,
            userId: $user->id,
            type: 'top_up',
            amount: 10_000,
        );

        $account->refresh();

        $this->assertSame(8_500, $account->current_balance);
        $this->assertDatabaseHas('ppob_balance_logs', [
            'type' => 'adjustment',
            'amount' => -1500,
        ]);
    }
}
