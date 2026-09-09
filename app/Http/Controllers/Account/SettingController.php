<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Services\WhatsAppService;
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
            'whatsapp' => Setting::whatsappSettings(),
        ]);
    }

    public function update(Request $request)
    {
        if ($request->hasAny(['whatsapp_admin_number', 'whatsapp_nontunai_enabled'])) {
            return $this->updateWhatsapp($request);
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

    public function testWhatsapp(WhatsAppService $whatsAppService)
    {
        $adminNumber = Setting::value(
            'whatsapp.admin_number',
            config('services.whatsapp.admin_number'),
        );

        try {
            $whatsAppService->sendText($adminNumber, 'Test WA dari VASIA POS');

            return redirect()
                ->route('account.settings.index')
                ->with('success', 'Pesan uji WhatsApp berhasil dikirim.');
        } catch (Throwable $e) {
            report($e);

            return redirect()
                ->route('account.settings.index')
                ->with('error', 'Gagal mengirim pesan uji WhatsApp. Periksa nomor admin dan konfigurasi WA-Hub.');
        }
    }

    protected function updateWhatsapp(Request $request)
    {
        $validated = $request->validate([
            'whatsapp_admin_number' => 'required|string|max:20',
            'whatsapp_nontunai_enabled' => 'nullable|boolean',
        ]);

        $this->setWhatsappValue('whatsapp.admin_number', $validated['whatsapp_admin_number']);
        $this->setWhatsappValue(
            'whatsapp.nontunai_enabled',
            $request->boolean('whatsapp_nontunai_enabled') ? '1' : '0',
        );

        return redirect()
            ->route('account.settings.index')
            ->with('success', 'Pengaturan notifikasi WhatsApp berhasil diperbarui.');
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

    protected function setWhatsappValue(string $key, ?string $value): void
    {
        Setting::updateOrCreate(
            ['key' => $key],
            [
                'value' => filled($value) ? trim($value) : null,
                'group' => 'whatsapp',
            ],
        );
    }
}
