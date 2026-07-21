<?php

namespace App\Services\Telegram;

use App\Models\Product;
use App\Models\User;
use DomainException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use InvalidArgumentException;

class TelegramUpdateHandler
{
    public function __construct(
        protected TelegramBotClient $botClient,
        protected TelegramUserResolver $userResolver,
        protected TelegramCommandParser $commandParser,
        protected PpobProductMatcher $productMatcher,
        protected TelegramPpobSaleService $saleService,
    ) {}

    public function handle(array $update): void
    {
        $updateId = $update['update_id'] ?? null;

        if ($updateId !== null && Cache::has($this->updateCacheKey($updateId))) {
            Log::info('Telegram update skipped (idempotent)', ['update_id' => $updateId]);

            return;
        }

        if (isset($update['callback_query'])) {
            $this->handleCallbackQuery($update['callback_query'], $updateId);

            return;
        }

        if (! isset($update['message']['text'])) {
            return;
        }

        $message = $update['message'];
        $chatId = $message['chat']['id'];
        $chatType = $message['chat']['type'] ?? 'private';
        $telegramId = (int) ($message['from']['id'] ?? $chatId);
        $telegramUsername = $message['from']['username'] ?? null;
        $text = trim($message['text']);

        Log::info('Telegram message received', [
            'update_id' => $updateId,
            'telegram_id' => $telegramId,
            'chat_type' => $chatType,
            'text_preview' => mb_substr($text, 0, 80),
        ]);

        if ($chatType !== 'private') {
            $this->botClient->sendMessage($chatId, 'Bot hanya menerima pesan pribadi (DM).');

            $this->markUpdateProcessed($updateId);

            return;
        }

        $user = $this->userResolver->resolve($telegramId, $telegramUsername);
        $command = $this->normalizeCommand($text);

        if ($command === '/start') {
            $this->replyStart($chatId, $user, $telegramId);
            $this->markUpdateProcessed($updateId);

            return;
        }

        if ($command === '/help') {
            $this->replyHelp($chatId);
            $this->markUpdateProcessed($updateId);

            return;
        }

        if ($command === '/status') {
            $this->replyStatus($chatId, $user, $telegramId);
            $this->markUpdateProcessed($updateId);

            return;
        }

        if ($command === '/batal') {
            $this->clearPending($telegramId);
            $this->botClient->sendMessage($chatId, 'Pending dibatalkan.');
            $this->markUpdateProcessed($updateId);

            return;
        }

        if (! $user) {
            $this->botClient->sendMessage(
                $chatId,
                $this->userResolver->getStatusMessage(null, $telegramId)
            );
            $this->markUpdateProcessed($updateId);

            return;
        }

        if ($this->handlePendingSelection($chatId, $telegramId, $user, $text)) {
            $this->markUpdateProcessed($updateId);

            return;
        }

        if ($this->handlePendingConfirmation($chatId, $telegramId, $user, $text)) {
            $this->markUpdateProcessed($updateId);

            return;
        }

        if ($this->commandParser->isBuyCommand($text)) {
            $this->handleBuyCommand($chatId, $telegramId, $user, $text);
            $this->markUpdateProcessed($updateId);

            return;
        }

        $this->botClient->sendMessage($chatId, $this->helpText());
        $this->markUpdateProcessed($updateId);
    }

    protected function handleBuyCommand(int|string $chatId, int $telegramId, User $user, string $text): void
    {
        if (! $this->allowBuyAttempt($telegramId)) {
            $this->botClient->sendMessage($chatId, 'Terlalu banyak perintah beli. Coba lagi dalam 1 menit.');

            return;
        }

        try {
            $intent = $this->commandParser->parseBuyCommand($text);
            $matches = $this->productMatcher->match($intent->productQuery);

            if ($matches->isEmpty()) {
                $this->botClient->sendMessage(
                    $chatId,
                    "Produk PPOB tidak ditemukan untuk: <b>" . e($intent->productQuery) . "</b>\n\n" . $this->helpText()
                );

                return;
            }

            if ($matches->count() > 1) {
                $this->storePendingSelection($telegramId, $intent, $matches);
                $this->botClient->sendMessage($chatId, $this->formatProductChoices($matches));

                return;
            }

            $this->processSale($chatId, $telegramId, $user, $matches->first(), $intent);
        } catch (InvalidArgumentException|DomainException $e) {
            $this->botClient->sendMessage($chatId, $e->getMessage());
        } catch (\Throwable $e) {
            Log::error('Telegram buy command failed', [
                'telegram_id' => $telegramId,
                'error' => $e->getMessage(),
            ]);
            $this->botClient->sendMessage($chatId, 'Terjadi kesalahan sistem.');
        }
    }

    protected function processSale(int|string $chatId, int $telegramId, User $user, Product $product, TelegramPpobIntent $intent): void
    {
        $grandTotal = $this->saleService->estimateGrandTotal($intent);
        $threshold = (int) config('telegram.confirmation_threshold', 500_000);

        if ($grandTotal >= $threshold) {
            $this->storePendingConfirmation($telegramId, $intent, $product->id);
            $this->botClient->sendMessage($chatId, $this->saleService->buildConfirmationMessage($product, $intent));

            return;
        }

        $message = $this->saleService->execute($user, $product, $intent);
        $this->botClient->sendMessage($chatId, $message);

        Log::info('Telegram PPOB sale completed', [
            'telegram_id' => $telegramId,
            'user_id' => $user->id,
            'product_id' => $product->id,
            'qty' => $intent->qty,
        ]);
    }

    protected function handlePendingSelection(int|string $chatId, int $telegramId, User $user, string $text): bool
    {
        $pending = Cache::get($this->pendingSelectionKey($telegramId));

        if (! $pending) {
            return false;
        }

        if (! preg_match('/^\d+$/', trim($text))) {
            return false;
        }

        $choice = (int) trim($text);
        $productIds = $pending['product_ids'] ?? [];

        if ($choice < 1 || $choice > count($productIds)) {
            $this->botClient->sendMessage($chatId, 'Pilihan tidak valid. Balas angka dari daftar.');

            return true;
        }

        $product = Product::query()->find($productIds[$choice - 1]);

        if (! $product || ! $product->isPpob() || ! $product->is_active) {
            Cache::forget($this->pendingSelectionKey($telegramId));
            $this->botClient->sendMessage($chatId, 'Produk tidak lagi tersedia. Kirim ulang perintah.');

            return true;
        }

        $intent = TelegramPpobIntent::fromArray($pending['intent']);
        Cache::forget($this->pendingSelectionKey($telegramId));

        try {
            $this->processSale($chatId, $telegramId, $user, $product, $intent);
        } catch (InvalidArgumentException|DomainException $e) {
            $this->botClient->sendMessage($chatId, $e->getMessage());
        } catch (\Throwable $e) {
            Log::error('Telegram pending selection sale failed', [
                'telegram_id' => $telegramId,
                'error' => $e->getMessage(),
            ]);
            $this->botClient->sendMessage($chatId, 'Terjadi kesalahan sistem.');
        }

        return true;
    }

    protected function handlePendingConfirmation(int|string $chatId, int $telegramId, User $user, string $text): bool
    {
        $pending = Cache::get($this->pendingConfirmationKey($telegramId));

        if (! $pending) {
            return false;
        }

        $answer = mb_strtolower(trim($text));

        if (! in_array($answer, ['ya', 'tidak', 'y', 't'], true)) {
            return false;
        }

        Cache::forget($this->pendingConfirmationKey($telegramId));

        if (in_array($answer, ['tidak', 't'], true)) {
            $this->botClient->sendMessage($chatId, 'Transaksi dibatalkan.');

            return true;
        }

        $product = Product::query()->find($pending['product_id'] ?? null);

        if (! $product || ! $product->isPpob() || ! $product->is_active) {
            $this->botClient->sendMessage($chatId, 'Produk tidak lagi tersedia. Kirim ulang perintah.');

            return true;
        }

        $intent = TelegramPpobIntent::fromArray($pending['intent']);

        try {
            $message = $this->saleService->execute($user, $product, $intent);
            $this->botClient->sendMessage($chatId, $message);

            Log::info('Telegram PPOB sale completed (confirmed)', [
                'telegram_id' => $telegramId,
                'user_id' => $user->id,
                'product_id' => $product->id,
            ]);
        } catch (DomainException $e) {
            $this->botClient->sendMessage($chatId, $e->getMessage());
        } catch (\Throwable $e) {
            Log::error('Telegram confirmed sale failed', [
                'telegram_id' => $telegramId,
                'error' => $e->getMessage(),
            ]);
            $this->botClient->sendMessage($chatId, 'Terjadi kesalahan sistem.');
        }

        return true;
    }

    protected function handleCallbackQuery(array $callbackQuery, ?int $updateId): void
    {
        $callbackId = $callbackQuery['id'] ?? '';
        $this->botClient->answerCallbackQuery($callbackId);
        $this->markUpdateProcessed($updateId);
    }

    protected function replyStart(int|string $chatId, ?User $user, int $telegramId): void
    {
        if (! $user) {
            $this->botClient->sendMessage($chatId, $this->userResolver->getStatusMessage(null, $telegramId));

            return;
        }

        $this->botClient->sendMessage(
            $chatId,
            "Halo, <b>{$user->name}</b>!\n\n" . $this->userResolver->getStatusMessage($user, $telegramId)
        );
    }

    protected function replyHelp(int|string $chatId): void
    {
        $this->botClient->sendMessage($chatId, $this->helpText());
    }

    protected function replyStatus(int|string $chatId, ?User $user, int $telegramId): void
    {
        $this->botClient->sendMessage($chatId, $this->userResolver->getStatusMessage($user, $telegramId));
    }

    protected function helpText(): string
    {
        return <<<'HTML'
<b>Format perintah PPOB</b>
beli &lt;produk&gt; &lt;qty&gt; [di &lt;ref&gt;] total &lt;uang&gt;
beli &lt;produk&gt; &lt;qty&gt; [di &lt;ref&gt;] @&lt;biaya per unit&gt;

<b>Contoh:</b>
• beli meterai 100 lembar di Kantor Pos total 1jt
• beli pulsa 1 total 25rb admin 2000
• beli meterai 100 @10rb

<b>Perintah lain:</b>
/start — sapaan & status
/help — bantuan format
/status — shift & akun PPOB
/batal — batalkan pending

Gunakan <b>total</b> untuk biaya keseluruhan atau <b>@</b> untuk biaya per unit.
HTML;
    }

    protected function formatProductChoices($matches): string
    {
        $lines = ['Ditemukan ' . $matches->count() . ' produk. Balas angka pilihan:'];

        foreach ($matches->values() as $index => $product) {
            $lines[] = ($index + 1) . '. ' . e($product->title) . ' (barcode: ' . e($product->barcode) . ')';
        }

        return implode("\n", $lines);
    }

    protected function storePendingSelection(int $telegramId, TelegramPpobIntent $intent, $matches): void
    {
        $ttl = (int) config('telegram.pending_intent_ttl', 300);

        Cache::put($this->pendingSelectionKey($telegramId), [
            'intent' => $intent->toArray(),
            'product_ids' => $matches->pluck('id')->all(),
        ], $ttl);
    }

    protected function storePendingConfirmation(int $telegramId, TelegramPpobIntent $intent, int $productId): void
    {
        $ttl = (int) config('telegram.pending_intent_ttl', 300);

        Cache::put($this->pendingConfirmationKey($telegramId), [
            'intent' => $intent->toArray(),
            'product_id' => $productId,
        ], $ttl);
    }

    protected function clearPending(int $telegramId): void
    {
        Cache::forget($this->pendingSelectionKey($telegramId));
        Cache::forget($this->pendingConfirmationKey($telegramId));
    }

    protected function allowBuyAttempt(int $telegramId): bool
    {
        $key = 'telegram-buy:' . $telegramId;
        $maxAttempts = (int) config('telegram.buy_rate_limit', 5);
        $decay = (int) config('telegram.buy_rate_limit_decay', 60);

        if (RateLimiter::tooManyAttempts($key, $maxAttempts)) {
            return false;
        }

        RateLimiter::hit($key, $decay);

        return true;
    }

    protected function markUpdateProcessed(?int $updateId): void
    {
        if ($updateId === null) {
            return;
        }

        Cache::put($this->updateCacheKey($updateId), true, now()->addDay());
    }

    protected function normalizeCommand(string $text): string
    {
        $normalized = mb_strtolower(trim($text));

        if (! str_starts_with($normalized, '/')) {
            return $normalized;
        }

        $parts = explode(' ', $normalized, 2);

        return explode('@', $parts[0])[0];
    }

    protected function pendingSelectionKey(int $telegramId): string
    {
        return 'telegram:pending:selection:' . $telegramId;
    }

    protected function pendingConfirmationKey(int $telegramId): string
    {
        return 'telegram:pending:confirm:' . $telegramId;
    }

    protected function updateCacheKey(int $updateId): string
    {
        return 'telegram:update:' . $updateId;
    }
}
