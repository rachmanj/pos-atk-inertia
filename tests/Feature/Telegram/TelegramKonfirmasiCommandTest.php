<?php

namespace Tests\Feature\Telegram;

use App\Models\Profit;
use App\Models\Transaction;
use App\Models\User;
use App\Services\Telegram\TelegramBotCommands;
use App\Services\Telegram\TelegramUpdateHandler;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\Concerns\PosTestHelpers;
use Tests\Support\FakeTelegramBotClient;
use Tests\TestCase;

class TelegramKonfirmasiCommandTest extends TestCase
{
    use PosTestHelpers;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'telegram.webhook_secret' => 'test-webhook-secret',
            'telegram.pending_intent_ttl' => 300,
        ]);
    }

    public function test_konfirmasi_without_pending_lists_empty_message(): void
    {
        $user = $this->linkTelegramUser($this->createCashierUser(['transactions.create', 'transactions.edit']));

        $this->dispatchTelegramMessage($user->telegram_id, '/konfirmasi');

        $this->assertLastMessageContains('Tidak ada transaksi transfer yang menunggu konfirmasi');
    }

    public function test_konfirmasi_without_argument_lists_pending_transactions(): void
    {
        $user = $this->linkTelegramUser($this->createCashierUser(['transactions.create', 'transactions.edit']));
        $user->update(['name' => 'Nabila']);
        $transaction = $this->createPendingTransferTransaction($user, 781_028, 'TRX-20260920-A09B26');

        $this->dispatchTelegramMessage($user->telegram_id, '/konfirmasi');

        $text = $this->lastMessageText();
        $this->assertStringContainsString('Menunggu konfirmasi transfer (1)', $text);
        $this->assertStringContainsString($transaction->invoice, $text);
        $this->assertStringContainsString('Nabila', $text);
        $this->assertStringContainsString('Rp 781.028', $text);
        $this->assertStringContainsString('/konfirmasi 1', $text);
    }

    public function test_konfirmasi_with_invalid_number_returns_friendly_error(): void
    {
        $user = $this->linkTelegramUser($this->createCashierUser(['transactions.create', 'transactions.edit']));
        $this->createPendingTransferTransaction($user, 50_000, 'TRX-NUM-001');

        $this->dispatchTelegramMessage($user->telegram_id, '/konfirmasi 99');

        $this->assertLastMessageContains('Nomor tidak valid');
    }

    public function test_konfirmasi_with_invoice_shows_preview_and_stores_pending(): void
    {
        $user = $this->linkTelegramUser($this->createCashierUser(['transactions.create', 'transactions.edit']));
        $transaction = $this->createPendingTransferTransaction($user, 100_000, 'TRX-PREVIEW-001');

        $this->dispatchTelegramMessage($user->telegram_id, '/konfirmasi ' . $transaction->invoice);

        $this->assertLastMessageContains('Konfirmasi transfer');
        $this->assertLastMessageContains($transaction->invoice);
        $this->assertLastMessageContains('Balas <b>ya</b>');

        $pending = Cache::get('telegram:pending:confirm:' . $user->telegram_id);
        $this->assertSame('confirm_transfer', $pending['kind']);
        $this->assertSame($transaction->invoice, $pending['invoice']);
    }

    public function test_konfirmasi_with_list_number_shows_preview(): void
    {
        $user = $this->linkTelegramUser($this->createCashierUser(['transactions.create', 'transactions.edit']));
        $this->createPendingTransferTransaction($user, 40_000, 'TRX-LIST-001');

        $this->dispatchTelegramMessage($user->telegram_id, '/konfirmasi 1');

        $this->assertLastMessageContains('Konfirmasi transfer');
        $this->assertLastMessageContains('TRX-LIST-001');
    }

    public function test_konfirmasi_unknown_invoice_returns_not_found(): void
    {
        $user = $this->linkTelegramUser($this->createCashierUser(['transactions.create', 'transactions.edit']));

        $this->dispatchTelegramMessage($user->telegram_id, '/konfirmasi TRX-GA-ADA');

        $this->assertLastMessageContains('Invoice tidak ditemukan');
    }

    public function test_konfirmasi_already_paid_returns_message(): void
    {
        $user = $this->linkTelegramUser($this->createCashierUser(['transactions.create', 'transactions.edit']));
        $this->createPendingTransferTransaction($user, 30_000, 'TRX-PAID-001', 'paid');

        $this->dispatchTelegramMessage($user->telegram_id, '/konfirmasi TRX-PAID-001');

        $this->assertLastMessageContains('sudah lunas');
    }

    public function test_konfirmasi_non_transfer_returns_message(): void
    {
        $user = $this->linkTelegramUser($this->createCashierUser(['transactions.create', 'transactions.edit']));
        Transaction::create([
            'cashier_id' => $user->id,
            'invoice' => 'TRX-CASH-ONLY',
            'cash' => 50_000,
            'change' => 0,
            'discount' => 0,
            'grand_total' => 50_000,
            'payment_method' => 'cash',
            'payment_status' => 'pending',
            'status' => 'pending',
        ]);

        $this->dispatchTelegramMessage($user->telegram_id, '/konfirmasi TRX-CASH-ONLY');

        $this->assertLastMessageContains('bukan transfer manual');
    }

    public function test_konfirmasi_without_edit_permission_is_rejected(): void
    {
        $user = $this->linkTelegramUser($this->createCashierUser(['transactions.create']));

        $this->dispatchTelegramMessage($user->telegram_id, '/konfirmasi');

        $this->assertLastMessageContains('tidak tersedia untuk akun Anda');
    }

    public function test_ya_confirms_transfer_updates_profit_and_replies_success(): void
    {
        $user = $this->linkTelegramUser($this->createCashierUser(['transactions.create', 'transactions.edit']));
        $transaction = $this->createPendingLegacyTransferWithDetail($user);

        $this->dispatchTelegramMessage($user->telegram_id, '/konfirmasi ' . $transaction->invoice);
        $this->dispatchTelegramMessage($user->telegram_id, 'ya', 2);

        $transaction->refresh();
        $this->assertSame('paid', $transaction->payment_status);
        $this->assertSame('completed', $transaction->status);
        $this->assertNotNull($transaction->paid_at);
        $this->assertDatabaseCount('profits', 1);
        $this->assertLastMessageContains('dikonfirmasi');
        $this->assertLastMessageContains('Lunas/Selesai');
    }

    public function test_tidak_cancels_without_changing_transaction(): void
    {
        $user = $this->linkTelegramUser($this->createCashierUser(['transactions.create', 'transactions.edit']));
        $transaction = $this->createPendingTransferTransaction($user, 55_000, 'TRX-TIDAK-001');

        $this->dispatchTelegramMessage($user->telegram_id, '/konfirmasi 1');
        $this->dispatchTelegramMessage($user->telegram_id, 'tidak', 2);

        $transaction->refresh();
        $this->assertSame('pending', $transaction->payment_status);
        $this->assertLastMessageContains('Dibatalkan');
    }

    public function test_expired_pending_confirmation_returns_friendly_message(): void
    {
        $user = $this->linkTelegramUser($this->createCashierUser(['transactions.create', 'transactions.edit']));

        Cache::forget('telegram:pending:confirm:' . $user->telegram_id);

        $this->dispatchTelegramMessage($user->telegram_id, 'ya');

        $this->assertLastMessageContains('kedaluwarsa');
    }

    public function test_cashier_cannot_confirm_other_cashiers_transaction(): void
    {
        $cashierA = $this->linkTelegramUser($this->createCashierUser(['transactions.create', 'transactions.edit']));
        $cashierB = $this->createCashierUser(['transactions.create', 'transactions.edit']);
        $other = $this->createPendingTransferTransaction($cashierB, 70_000, 'TRX-OTHER-001');

        $this->dispatchTelegramMessage($cashierA->telegram_id, '/konfirmasi ' . $other->invoice);

        $this->assertLastMessageContains('bukan milik Anda');
    }

    public function test_admin_can_confirm_other_cashiers_transaction(): void
    {
        $cashier = $this->createCashierUser(['transactions.create', 'transactions.edit']);
        $admin = $this->linkTelegramUser($this->createAdminUser());
        $transaction = $this->createPendingLegacyTransferWithDetail($cashier);

        $this->dispatchTelegramMessage($admin->telegram_id, '/konfirmasi ' . $transaction->invoice);
        $this->dispatchTelegramMessage($admin->telegram_id, 'ya', 2);

        $transaction->refresh();
        $this->assertSame('paid', $transaction->payment_status);
    }

    public function test_batal_clears_confirm_transfer_pending(): void
    {
        $user = $this->linkTelegramUser($this->createCashierUser(['transactions.create', 'transactions.edit']));
        $this->createPendingTransferTransaction($user, 20_000, 'TRX-BATAL-001');

        $this->dispatchTelegramMessage($user->telegram_id, '/konfirmasi 1');
        $this->assertNotNull(Cache::get('telegram:pending:confirm:' . $user->telegram_id));

        $this->dispatchTelegramMessage($user->telegram_id, '/batal', 2);

        $this->assertNull(Cache::get('telegram:pending:confirm:' . $user->telegram_id));
    }

    public function test_set_commands_includes_konfirmasi(): void
    {
        $commands = TelegramBotCommands::definitions();
        $konfirmasi = collect($commands)->firstWhere('command', 'konfirmasi');

        $this->assertNotNull($konfirmasi);
        $this->assertStringContainsString('transfer', $konfirmasi['description']);
    }

    public function test_telegram_set_commands_uses_bot_client_without_http(): void
    {
        config(['telegram.token' => 'test-token']);

        $client = app(\App\Services\Telegram\TelegramBotClient::class);
        $client->setMyCommands(TelegramBotCommands::definitions());

        $this->assertNotEmpty(FakeTelegramBotClient::$requests);
        $this->assertSame('setMyCommands', FakeTelegramBotClient::$requests[0]['method']);
        $this->assertArrayHasKey('commands', FakeTelegramBotClient::$requests[0]['payload']);
    }

    protected function linkTelegramUser(User $user): User
    {
        $user->update(['telegram_id' => random_int(600_000, 699_999)]);

        return $user->fresh();
    }

    protected function dispatchTelegramMessage(int $telegramId, string $text, int $updateId = 1): void
    {
        app(TelegramUpdateHandler::class)->handle([
            'update_id' => $updateId + $telegramId,
            'message' => [
                'message_id' => $updateId,
                'from' => ['id' => $telegramId],
                'chat' => ['id' => $telegramId, 'type' => 'private'],
                'text' => $text,
            ],
        ]);
    }

    protected function lastMessageText(): string
    {
        $last = FakeTelegramBotClient::$sentMessages[count(FakeTelegramBotClient::$sentMessages) - 1] ?? null;

        return $last['text'] ?? '';
    }

    protected function assertLastMessageContains(string $needle): void
    {
        $this->assertStringContainsString($needle, $this->lastMessageText());
    }

    protected function createPendingTransferTransaction(
        User $user,
        int $grandTotal,
        string $invoice,
        string $paymentStatus = 'pending',
        string $status = 'pending',
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

    protected function createPendingLegacyTransferWithDetail(User $user): Transaction
    {
        $transaction = $this->createPendingTransferTransaction($user, 10_000, 'TRX-CONFIRM-' . uniqid());
        $catalog = $this->createPhysicalProduct();
        $this->createTransactionDetail($transaction, $catalog['product'], $catalog['unit']);

        return $transaction;
    }

    protected function createAdminUser(): User
    {
        $this->seedPermissions(['transactions.create', 'transactions.edit']);

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
}
