<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    private const PERMISSION_NAME = 'purchases.edit';

    public function up(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $permission = Permission::query()->firstOrCreate([
            'name' => self::PERMISSION_NAME,
            'guard_name' => 'web',
        ]);

        $adminRoleName = config('roles.admin', 'admin');

        $role = Role::query()
            ->where('name', $adminRoleName)
            ->where('guard_name', 'web')
            ->first();

        if ($role !== null && ! $role->hasPermissionTo($permission)) {
            $role->givePermissionTo($permission);
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $adminRoleName = config('roles.admin', 'admin');

        $role = Role::query()
            ->where('name', $adminRoleName)
            ->where('guard_name', 'web')
            ->first();

        $permission = Permission::query()
            ->where('name', self::PERMISSION_NAME)
            ->where('guard_name', 'web')
            ->first();

        if ($role !== null && $permission !== null) {
            $role->permissions()->detach($permission->id);
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
};
