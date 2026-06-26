<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $users = User::when($request->q, function ($query) use ($request) {
            $query->where('name', 'like', '%' . $request->q . '%');
        })
            ->with('roles')
            ->latest()
            ->paginate(10);

        $users->appends([
            'q' => $request->q,
        ]);

        return Inertia::render('Account/Users/Index', [
            'users' => $users,
        ]);
    }

    public function create()
    {
        $roles = $this->getAssignableRoles();

        return Inertia::render('Account/Users/Create', [
            'roles' => $roles,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|confirmed|min:8',
            'roles' => 'required|array',
            'roles.*' => 'exists:roles,name',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        $user->assignRole($request->roles);

        return redirect()->route('account.users.index');
    }

    public function edit($id)
    {
        $user = User::with('roles')->findOrFail($id);

        $roles = $this->getAssignableRoles();

        return Inertia::render('Account/Users/Edit', [
            'user' => $user,
            'roles' => $roles,
        ]);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $id,
            'password' => 'nullable|string|confirmed|min:8',
            'roles' => 'required|array',
            'roles.*' => 'exists:roles,name',
        ]);

        $user = User::findOrFail($id);

        if ($request->password == '') {
            $user->update([
                'name' => $request->name,
                'email' => $request->email,
            ]);
        } else {
            $user->update([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
            ]);
        }

        $user->syncRoles($request->roles);

        return redirect()->route('account.users.index');
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);

        $user->delete();

        return redirect()->route('account.users.index');
    }

    protected function getAssignableRoles()
    {
        $adminRoleName = config('roles.admin', 'admin');
        $cashierRoleName = config('roles.cashier', 'cashier');

        return Role::query()
            ->orderByRaw(
                'CASE WHEN name = ? THEN 0 WHEN name = ? THEN 1 ELSE 2 END',
                [$adminRoleName, $cashierRoleName]
            )
            ->orderBy('name')
            ->get();
    }
}
