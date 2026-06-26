<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Models\Unit;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UnitController extends Controller
{
    public function index(Request $request)
    {
        $units = Unit::query()
            ->when($request->q, function ($query) use ($request) {
                $query->where(function ($subQuery) use ($request) {
                    $subQuery->where('name', 'like', '%' . $request->q . '%')
                        ->orWhere('abbreviation', 'like', '%' . $request->q . '%');
                });
            })
            ->orderBy('name')
            ->paginate(10);

        $units->appends(['q' => $request->q]);

        return Inertia::render('Account/Units/Index', [
            'units' => $units,
        ]);
    }

    public function create()
    {
        return Inertia::render('Account/Units/Create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'abbreviation' => 'required|string|max:20|unique:units,abbreviation',
        ]);

        Unit::create([
            'name' => $request->name,
            'abbreviation' => strtolower(trim($request->abbreviation)),
        ]);

        return redirect()->route('account.units.index');
    }

    public function edit(Unit $unit)
    {
        return Inertia::render('Account/Units/Edit', [
            'unit' => $unit,
        ]);
    }

    public function update(Request $request, Unit $unit)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'abbreviation' => 'required|string|max:20|unique:units,abbreviation,' . $unit->id,
        ]);

        $unit->update([
            'name' => $request->name,
            'abbreviation' => strtolower(trim($request->abbreviation)),
        ]);

        return redirect()->route('account.units.index');
    }

    public function destroy(Unit $unit)
    {
        if ($unit->productUnits()->exists()) {
            return redirect()
                ->route('account.units.index')
                ->with('error', 'Satuan masih digunakan oleh produk.');
        }

        $unit->delete();

        return redirect()->route('account.units.index');
    }
}
