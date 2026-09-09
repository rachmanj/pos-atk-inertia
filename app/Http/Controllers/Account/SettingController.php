<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Services\TelegramNotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Throwable;

class SettingController extends Controller
{
    public function index()
    {
        return Inertia::render('Account/Settings/Index', [
            'store' => Setting::storeSettings(),
            'ppob' => Setting::ppobSettings(),
            'telegram' => Setting::telegramSettings(),
        ]);
    }

    public function update(Request $request)
    {
        if ($request->hasAny(['telegram_admin_chat_ids', 'telegram_nontunai_enabled'])) {
            return $this->updateTelegram($request);
        }

        $request->validate([
            'name' => 'required|string|max:100',
            'address' => 'nullable|string|max:500',
            'phone' => 'nullable|string|max:30',
            'email' => 'nullable|email|max:100',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'remove_logo' => 'nullable|boolean',
            'receipt_paper_size' => 'nullable|in:58,80',
            'ppob_admin_fee' => 'nullable|integer|min:0',
            'ppob_min_balance_default' => 'nullable|integer|min:0',
        ]);

        $currentLogo = Setting::query()
            ->where('key', 'store.logo')
            ->value('value');

        $logoName = $currentLogo;

        if ($request->boolean('remove_logo') && $currentLogo) {
            Storage::disk('public')->delete('settings/' . $currentLogo);
            $logoName = null;
        }

        if ($request->hasFile('logo')) {
            if ($currentLogo) {
                Storage::disk('public')->delete('settings/' . $currentLogo);
            }

            $logo = $request->file('logo');
            $logo->storeAs('settings', $logo->hashName(), 'public');
            $logoName = $logo->hashName();
        }

        $this->setStoreValue('store.name', $request->name);
        $this->setStoreValue('store.address', $request->address);
        $this->setStoreValue('store.phone', $request->phone);
        $this->setStoreValue('store.email', $request->email);
        $this->setStoreValue('store.logo', $logoName);
        $this->setStoreValue('receipt.paper_size', $request->input('receipt_paper_size', '58'));
        $this->setPpobValue('ppob_admin_fee', (string) (int) $request->input('ppob_admin_fee', 2000));
        $this->setPpobValue('ppob_min_balance_default', (string) (int) $request->input('ppob_min_balance_default', 100000));

        return redirect()
            ->route('account.settings.index')
            ->with('success', 'Pengaturan toko berhasil diperbarui.');
    }

    public function testTelegram(Request $request, TelegramNotificationService $telegramService)
    {
        $validated = $request->validate([
            'chat_ids' => 'required|string|max:500',
        ]);

        $chatIds = $this->parseTelegramChatIds($validated['chat_ids']);

        if ($chatIds === null) {
            return response()->json([
                'ok' => false,
                'message' => 'Format Chat ID Telegram tidak valid.',
            ], 422);
        }

        if ($chatIds === []) {
            return response()->json([
                'ok' => false,
                'message' => 'Belum ada Chat ID Telegram yang valid.',
            ], 422);
        }

        $results = [];
        $allOk = true;

        foreach ($chatIds as $chatId) {
            try {
                $messageId = $telegramService->sendText($chatId, 'Test Telegram dari VASIA POS');
                $results[] = [
                    'chat_id' => $chatId,
                    'ok' => true,
                    'message_id' => $messageId,
                ];
            } catch (Throwable $e) {
                report($e);
                $allOk = false;
                $results[] = [
                    'chat_id' => $chatId,
                    'ok' => false,
                    'message' => Str::limit($e->getMessage(), 200),
                ];
            }
        }

        return response()->json([
            'ok' => $allOk,
            'message' => $allOk
                ? 'Pesan uji Telegram berhasil dikirim ke semua penerima.'
                : 'Sebagian penerima gagal menerima pesan uji.',
            'results' => $results,
        ], $allOk ? 200 : 422);
    }

    protected function updateTelegram(Request $request)
    {
        $validated = $request->validate([
            'telegram_admin_chat_ids' => 'required|string|max:500',
            'telegram_nontunai_enabled' => 'nullable|boolean',
        ]);

        $chatIds = $this->parseTelegramChatIds($validated['telegram_admin_chat_ids']);

        if ($chatIds === null || $chatIds === []) {
            return redirect()
                ->route('account.settings.index')
                ->withErrors([
                    'telegram_admin_chat_ids' => 'Format Chat ID Telegram tidak valid. Pisahkan dengan koma untuk beberapa penerima.',
                ]);
        }

        $this->setTelegramValue('telegram.admin_chat_ids', implode(', ', $chatIds));
        $this->setTelegramValue(
            'telegram.nontunai_enabled',
            $request->boolean('telegram_nontunai_enabled') ? '1' : '0',
        );

        return redirect()
            ->route('account.settings.index')
            ->with('success', 'Pengaturan notifikasi Telegram berhasil diperbarui.');
    }

    protected function parseTelegramChatIds(string $raw): ?array
    {
        $raw = trim($raw);

        if ($raw === '') {
            return [];
        }

        $ids = [];

        foreach (explode(',', $raw) as $part) {
            $part = trim($part);

            if ($part === '') {
                continue;
            }

            if (! preg_match('/^-?\d+$/', $part)) {
                return null;
            }

            $ids[] = $part;
        }

        return array_values(array_unique($ids));
    }

    protected function setStoreValue(string $key, ?string $value): void
    {
        Setting::updateOrCreate(
            ['key' => $key],
            [
                'value' => filled($value) ? trim($value) : null,
                'group' => 'store',
            ],
        );
    }

    protected function setPpobValue(string $key, ?string $value): void
    {
        Setting::updateOrCreate(
            ['key' => $key],
            [
                'value' => filled($value) ? trim($value) : null,
                'group' => 'ppob',
            ],
        );
    }

    protected function setTelegramValue(string $key, ?string $value): void
    {
        Setting::updateOrCreate(
            ['key' => $key],
            [
                'value' => filled($value) ? trim($value) : null,
                'group' => 'telegram',
            ],
        );
    }
}
