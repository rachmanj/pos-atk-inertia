<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SupplierController extends Controller
{
    public function index(Request $request)
    {
        abort_unless($request->user()->can('suppliers.index'), 403);

        $suppliers = Supplier::query()
            ->when(filled($request->q), function ($query) use ($request) {
                $search = trim($request->q);

                $query->where(function ($subQuery) use ($search) {
                    $subQuery->where('name', 'like', '%' . $search . '%')
                        ->orWhere('no_telp', 'like', '%' . $search . '%')
                        ->orWhere('email', 'like', '%' . $search . '%');
                });
            })
            ->latest()
            ->paginate(10);

        $suppliers->appends(['q' => $request->q]);

        return Inertia::render('Account/Suppliers/Index', [
            'suppliers' => $suppliers,
            'filters' => [
                'q' => $request->q ?? '',
            ],
        ]);
    }

    public function create(Request $request)
    {
        abort_unless($request->user()->can('suppliers.create'), 403);

        return Inertia::render('Account/Suppliers/Create');
    }

    public function store(Request $request)
    {
        abort_unless($request->user()->can('suppliers.create'), 403);

        $request->validate([
            'name' => 'required|string|max:255',
            'no_telp' => 'required|string|max:20|unique:suppliers,no_telp',
            'email' => 'nullable|email|max:255|unique:suppliers,email',
            'address' => 'required|string',
            'note' => 'nullable|string|max:1000',
            'is_active' => 'nullable|boolean',
        ]);

        Supplier::create([
            'name' => trim($request->name),
            'no_telp' => trim($request->no_telp),
            'email' => filled($request->email) ? trim($request->email) : null,
            'address' => trim($request->address),
            'note' => filled($request->note) ? trim($request->note) : null,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()
            ->route('account.suppliers.index')
            ->with('success', 'Supplier berhasil ditambahkan.');
    }

    public function edit(Request $request, Supplier $supplier)
    {
        abort_unless($request->user()->can('suppliers.edit'), 403);

        return Inertia::render('Account/Suppliers/Edit', [
            'supplier' => $supplier,
        ]);
    }

    public function update(Request $request, Supplier $supplier)
    {
        abort_unless($request->user()->can('suppliers.edit'), 403);

        $request->validate([
            'name' => 'required|string|max:255',
            'no_telp' => 'required|string|max:20|unique:suppliers,no_telp,' . $supplier->id,
            'email' => 'nullable|email|max:255|unique:suppliers,email,' . $supplier->id,
            'address' => 'required|string',
            'note' => 'nullable|string|max:1000',
            'is_active' => 'nullable|boolean',
        ]);

        $supplier->update([
            'name' => trim($request->name),
            'no_telp' => trim($request->no_telp),
            'email' => filled($request->email) ? trim($request->email) : null,
            'address' => trim($request->address),
            'note' => filled($request->note) ? trim($request->note) : null,
            'is_active' => $request->boolean('is_active', false),
        ]);

        return redirect()
            ->route('account.suppliers.index')
            ->with('success', 'Supplier berhasil diperbarui.');
    }

    public function destroy(Request $request, Supplier $supplier)
    {
        abort_unless($request->user()->can('suppliers.delete'), 403);

        $supplier->loadCount('purchases');

        if ($supplier->purchases_count > 0) {
            return redirect()
                ->route('account.suppliers.index')
                ->with('error', 'Supplier tidak bisa dihapus karena sudah memiliki data pembelian.');
        }

        $supplier->delete();

        return redirect()
            ->route('account.suppliers.index')
            ->with('success', 'Supplier berhasil dihapus.');
    }
}
