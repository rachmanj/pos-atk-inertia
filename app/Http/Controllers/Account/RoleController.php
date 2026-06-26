<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $adminRoleName = config('roles.admin', 'admin');
        $cashierRoleName = config('roles.cashier', 'cashier');

        $roles = Role::when($request->q, function ($query) use ($request) {
            $query->where('name', 'like', '%' . $request->q . '%');
        })
            ->with('permissions')
            ->orderByRaw(
                'CASE WHEN name = ? THEN 0 WHEN name = ? THEN 1 ELSE 2 END',
                [$adminRoleName, $cashierRoleName]
            )
            ->orderBy('name')
            ->paginate(10)
            ->through(function (Role $role) {
                return [
                    'id' => $role->id,
                    'name' => $role->name,
                    'permissions' => $role->permissions,
                    'is_system' => $this->isSystemRole($role),
                ];
            });

        $roles->appends(['q' => $request->q]);

        return Inertia::render('Account/Roles/Index', [
            'roles' => $roles,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $permissions = Permission::all();

        return Inertia::render('Account/Roles/Create', [
            'permissions' => $permissions,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->merge([
            'name' => trim((string) $request->name),
        ]);

        $request->validate([
            'name' => ['required', 'string', Rule::unique('roles', 'name')],
            'permissions' => 'required|array',
            'permissions.*' => 'exists:permissions,name',
        ]);

        $role = Role::create([
            'name' => $request->name,
        ]);

        $role->givePermissionTo($request->permissions);

        return redirect()->route('account.roles.index');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit($id)
    {
        $role = Role::with('permissions')->findOrFail($id);
        $permissions = Permission::all();

        return Inertia::render('Account/Roles/Edit', [
            'role' => $role,
            'permissions' => $permissions,
            'isSystemRole' => $this->isSystemRole($role),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $request->merge([
            'name' => trim((string) $request->name),
        ]);

        $role = Role::findOrFail($id);

        $request->validate([
            'name' => ['required', 'string', Rule::unique('roles', 'name')->ignore($id)],
            'permissions' => 'required|array',
            'permissions.*' => 'exists:permissions,name',
        ]);

        if ($this->isSystemRole($role) && $request->name !== $role->name) {
            return back()->withErrors([
                'name' => 'Nama role sistem tidak boleh diubah.',
            ]);
        }

        if (! $this->isSystemRole($role)) {
            $role->update([
                'name' => $request->name,
            ]);
        }

        $role->syncPermissions($request->permissions);

        return redirect()->route('account.roles.index');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $role = Role::findOrFail($id);

        if ($this->isSystemRole($role)) {
            return redirect()
                ->route('account.roles.index')
                ->with('error', 'Role sistem tidak dapat dihapus.');
        }

        $role->delete();

        return redirect()->route('account.roles.index');
    }

    protected function isSystemRole(Role $role): bool
    {
        return in_array($role->name, config('roles.system', ['admin', 'cashier']), true);
    }
}
