<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Services\TelegramNotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
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
        if ($request->hasAny(['telegram_admin_chat_id', 'telegram_nontunai_enabled'])) {
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
            'chat_id' => 'required|string|max:20',
        ]);

        try {
            $telegramService->sendText($validated['chat_id'], 'Test Telegram dari VASIA POS');

            return response()->json([
                'ok' => true,
                'message' => 'Pesan uji Telegram berhasil dikirim.',
            ]);
        } catch (Throwable $e) {
            report($e);

            return response()->json([
                'ok' => false,
                'message' => 'Gagal mengirim pesan uji Telegram. Periksa Chat ID dan konfigurasi bot.',
            ], 422);
        }
    }

    protected function updateTelegram(Request $request)
    {
        $validated = $request->validate([
            'telegram_admin_chat_id' => 'required|string|max:20|regex:/^-?\d+$/',
            'telegram_nontunai_enabled' => 'nullable|boolean',
        ]);

        $this->setTelegramValue('telegram.admin_chat_id', $validated['telegram_admin_chat_id']);
        $this->setTelegramValue(
            'telegram.nontunai_enabled',
            $request->boolean('telegram_nontunai_enabled') ? '1' : '0',
        );

        return redirect()
            ->route('account.settings.index')
            ->with('success', 'Pengaturan notifikasi Telegram berhasil diperbarui.');
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
