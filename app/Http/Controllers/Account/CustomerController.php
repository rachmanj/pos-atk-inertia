<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $customers = Customer::when($request->q, function ($query) use ($request) {
            $query->where('name', 'like', '%' . $request->q . '%');
        })->latest()->paginate(10);

        $customers->appends([
            'q' => $request->q,
        ]);

        return Inertia::render('Account/Customers/Index', [
            'customers' => $customers,
        ]);
    }

    public function create()
    {
        return Inertia::render('Account/Customers/Create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'    => 'required|string|max:255',
            'no_telp' => 'nullable|string|unique:customers',
            'email'   => 'nullable|email|unique:customers',
            'address' => 'nullable|string',
        ]);

        Customer::create([
            'name'    => $request->name,
            'no_telp' => $request->no_telp,
            'email'   => $request->email,
            'address' => $request->address,
        ]);

        return redirect()->route('account.customers.index');
    }

    public function edit($id)
    {
        $customer = Customer::findOrFail($id);

        return Inertia::render('Account/Customers/Edit', [
            'customer' => $customer,
        ]);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'name'    => 'required|string|max:255',
            'no_telp' => 'required|string|unique:customers,no_telp,' . $id,
            'email'   => 'nullable|email|unique:customers,email,' . $id,
            'address' => 'required|string',
        ]);

        $customer = Customer::findOrFail($id);

        $customer->update([
            'name'    => $request->name,
            'no_telp' => $request->no_telp,
            'email'   => $request->email,
            'address' => $request->address,
        ]);

        return redirect()->route('account.customers.index');
    }

    public function destroy($id)
    {
        $customer = Customer::findOrFail($id);

        $customer->delete();

        return redirect()->route('account.customers.index');
    }
}
