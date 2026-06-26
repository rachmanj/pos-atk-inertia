<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Models\PpobAccount;
use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PpobAccountController extends Controller
{
    public function index()
    {
        $accounts = PpobAccount::query()
            ->orderByDesc('is_active')
            ->orderBy('name')
            ->get();

        return Inertia::render('Account/Ppob/Accounts/Index', [
            'accounts' => $accounts,
        ]);
    }

    public function create()
    {
        return Inertia::render('Account/Ppob/Accounts/Create', [
            'defaultMinBalance' => (int) Setting::getValue('ppob_min_balance_default', 100000),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'current_balance' => 'required|integer|min:0',
            'min_balance_alert' => 'required|integer|min:0',
            'is_active' => 'required|boolean',
            'note' => 'nullable|string|max:1000',
        ]);

        PpobAccount::create([
            'name' => $request->name,
            'current_balance' => (int) $request->current_balance,
            'min_balance_alert' => (int) $request->min_balance_alert,
            'is_active' => $request->boolean('is_active'),
            'note' => filled($request->note) ? trim($request->note) : null,
        ]);

        return redirect()
            ->route('account.ppob-accounts.index')
            ->with('success', 'Akun PPOB berhasil ditambahkan.');
    }

    public function edit(PpobAccount $ppobAccount)
    {
        return Inertia::render('Account/Ppob/Accounts/Edit', [
            'account' => $ppobAccount,
        ]);
    }

    public function update(Request $request, PpobAccount $ppobAccount)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'min_balance_alert' => 'required|integer|min:0',
            'is_active' => 'required|boolean',
            'note' => 'nullable|string|max:1000',
        ]);

        $ppobAccount->update([
            'name' => $request->name,
            'min_balance_alert' => (int) $request->min_balance_alert,
            'is_active' => $request->boolean('is_active'),
            'note' => filled($request->note) ? trim($request->note) : null,
        ]);

        return redirect()
            ->route('account.ppob-accounts.index')
            ->with('success', 'Akun PPOB berhasil diperbarui.');
    }
}
