<?php

namespace Tests\Feature;

use App\Models\Transaction;
use App\Models\User;
use App\Services\Telegram\TelegramPosQueryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\Concerns\PosTestHelpers;
use Tests\TestCase;

class TelegramPendingCommandTest extends TestCase
{
    use PosTestHelpers;
    use RefreshDatabase;

    protected TelegramPosQueryService $queryService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->queryService = app(TelegramPosQueryService::class);
    }

    public function test_pending_shows_transfer_with_invoice_amount_and_total(): void
    {
        $cashier = $this->createCashierUser();
        $cashier->update(['name' => 'Nabila']);

        $transaction = $this->createPendingTransferTransaction($cashier, 1_023_245, 'TRX-20260916-FCE320');

        $message = $this->queryService->handlePending($cashier);

        $this->assertStringContainsString('Transfer Menunggu Konfirmasi', $message);
        $this->assertStringContainsString($transaction->invoice, $message);
        $this->assertStringContainsString('Rp 1.023.245', $message);
        $this->assertStringContainsString('Nabila', $message);
        $this->assertStringContainsString('Total menunggu: Rp 1.023.245 (1 transaksi)', $message);
        $this->assertStringContainsString('Konfirmasi di app:', $message);
    }

    public function test_pending_excludes_paid_and_voided_transfer_transactions(): void
    {
        $cashier = $this->createCashierUser();
        $pending = $this->createPendingTransferTransaction($cashier, 50_000, 'TRX-PENDING-001');

        $this->createPendingTransferTransaction($cashier, 75_000, 'TRX-PAID-001', 'paid');
        $this->createPendingTransferTransaction($cashier, 25_000, 'TRX-VOID-001', 'pending', 'voided');

        $message = $this->queryService->handlePending($cashier);

        $this->assertStringContainsString($pending->invoice, $message);
        $this->assertStringNotContainsString('TRX-PAID-001', $message);
        $this->assertStringNotContainsString('TRX-VOID-001', $message);
        $this->assertStringContainsString('Total menunggu: Rp 50.000 (1 transaksi)', $message);
    }

    public function test_cashier_sees_only_own_pending_while_admin_sees_all(): void
    {
        $cashierA = $this->createCashierUser();
        $cashierA->update(['name' => 'Kasir A']);
        $cashierB = $this->createCashierUser();
        $cashierB->update(['name' => 'Kasir B']);
        $admin = $this->createAdminUser();

        $ownPending = $this->createPendingTransferTransaction($cashierA, 40_000, 'TRX-OWN-A');
        $otherPending = $this->createPendingTransferTransaction($cashierB, 60_000, 'TRX-OWN-B');

        $cashierMessage = $this->queryService->handlePending($cashierA);

        $this->assertStringContainsString($ownPending->invoice, $cashierMessage);
        $this->assertStringNotContainsString($otherPending->invoice, $cashierMessage);
        $this->assertStringContainsString('Total menunggu: Rp 40.000 (1 transaksi)', $cashierMessage);

        $adminMessage = $this->queryService->handlePending($admin);

        $this->assertStringContainsString($ownPending->invoice, $adminMessage);
        $this->assertStringContainsString($otherPending->invoice, $adminMessage);
        $this->assertStringContainsString('Total menunggu: Rp 100.000 (2 transaksi)', $adminMessage);
    }

    public function test_pending_returns_empty_message_when_no_pending_transfers(): void
    {
        $cashier = $this->createCashierUser();

        $message = $this->queryService->handlePending($cashier);

        $this->assertSame('✅ Tidak ada transfer yang menunggu konfirmasi.', $message);
    }

    protected function createAdminUser(): User
    {
        $this->seedPermissions(['transactions.create']);

        $role = Role::findOrCreate(config('roles.admin', 'admin'));
        $role->syncPermissions(Permission::all());

        $user = User::create([
            'name' => 'Test Admin',
            'username' => 'admin-test-' . uniqid(),
            'email' => 'admin-test-' . uniqid() . '@example.com',
            'password' => Hash::make('password'),
        ]);

        $user->assignRole($role);

        return $user;
    }

    protected function createPendingTransferTransaction(
        User $user,
        int $grandTotal,
        string $invoice,
        string $paymentStatus = 'pending',
        string $status = 'completed',
    ): Transaction {
        $transaction = Transaction::create([
            'cashier_id' => $user->id,
            'invoice' => $invoice,
            'cash' => 0,
            'change' => 0,
            'discount' => 0,
            'grand_total' => $grandTotal,
            'payment_method' => 'transfer',
            'payment_status' => $paymentStatus,
            'status' => $status,
        ]);

        $now = Carbon::now();
        $transaction->forceFill([
            'created_at' => $now,
            'updated_at' => $now,
        ])->save();

        return $transaction->fresh();
    }
}
