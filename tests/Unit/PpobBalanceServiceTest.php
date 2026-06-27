<?php

namespace Tests\Unit;

use App\Models\PpobAccount;
use App\Models\User;
use App\Services\PpobBalanceService;
use DomainException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class PpobBalanceServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_record_movement_rejects_negative_balance(): void
    {
        $user = User::create([
            'name' => 'Test User',
            'username' => 'ppob-test',
            'email' => 'ppob-test@example.com',
            'password' => Hash::make('password'),
        ]);

        $account = PpobAccount::create([
            'name' => 'Test PPOB',
            'current_balance' => 5000,
            'min_balance_alert' => 1000,
            'is_active' => true,
        ]);

        $service = app(PpobBalanceService::class);

        $this->expectException(DomainException::class);
        $this->expectExceptionMessage('Saldo PPOB tidak mencukupi untuk transaksi ini.');

        $service->recordMovement(
            account: $account,
            userId: $user->id,
            type: 'sale',
            amount: -10000,
        );
    }

    public function test_record_movement_updates_balance(): void
    {
        $user = User::create([
            'name' => 'Test User',
            'username' => 'ppob-test2',
            'email' => 'ppob-test2@example.com',
            'password' => Hash::make('password'),
        ]);

        $account = PpobAccount::create([
            'name' => 'Test PPOB',
            'current_balance' => 10000,
            'min_balance_alert' => 1000,
            'is_active' => true,
        ]);

        $service = app(PpobBalanceService::class);

        $service->recordMovement(
            account: $account,
            userId: $user->id,
            type: 'sale',
            amount: -3000,
        );

        $account->refresh();

        $this->assertSame(7000, $account->current_balance);
        $this->assertDatabaseHas('ppob_balance_logs', [
            'ppob_account_id' => $account->id,
            'type' => 'sale',
            'amount' => -3000,
            'balance_after' => 7000,
        ]);
    }
}
