<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class SettingController extends Controller
{
    public function index()
    {
        return Inertia::render('Account/Settings/Index', [
            'store' => Setting::storeSettings(),
            'ppob' => Setting::ppobSettings(),
        ]);
    }

    public function update(Request $request)
    {
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
}
