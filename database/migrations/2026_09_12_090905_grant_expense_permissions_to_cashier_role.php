<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    private const PERMISSIONS = [
        'expenses.index',
        'expenses.create',
        'expenses.edit',
    ];

    public function up(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $cashierRoleName = config('roles.cashier', 'cashier');

        $role = Role::query()
            ->where('name', $cashierRoleName)
            ->where('guard_name', 'web')
            ->first();

        if ($role === null) {
            app(PermissionRegistrar::class)->forgetCachedPermissions();

            return;
        }

        foreach (self::PERMISSIONS as $permissionName) {
            $permission = Permission::query()
                ->where('name', $permissionName)
                ->where('guard_name', 'web')
                ->first();

            if ($permission !== null && !$role->hasPermissionTo($permission)) {
                $role->givePermissionTo($permission);
            }
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $cashierRoleName = config('roles.cashier', 'cashier');

        $role = Role::query()
            ->where('name', $cashierRoleName)
            ->where('guard_name', 'web')
            ->first();

        if ($role === null) {
            app(PermissionRegistrar::class)->forgetCachedPermissions();

            return;
        }

        $permissionIds = Permission::query()
            ->whereIn('name', self::PERMISSIONS)
            ->where('guard_name', 'web')
            ->pluck('id');

        if ($permissionIds->isNotEmpty()) {
            $role->permissions()->detach($permissionIds);
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
};
