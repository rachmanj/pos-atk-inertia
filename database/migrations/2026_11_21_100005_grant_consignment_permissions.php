<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    private const PERMISSIONS = [
        'consignments.index',
        'consignments.create',
        'consignments.show',
        'consignment_payments.create',
        'reports.consignment',
    ];

    public function up(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $adminRoleName = config('roles.admin', 'admin');

        $role = Role::query()
            ->where('name', $adminRoleName)
            ->where('guard_name', 'web')
            ->first();

        foreach (self::PERMISSIONS as $permissionName) {
            $permission = Permission::query()->firstOrCreate([
                'name' => $permissionName,
                'guard_name' => 'web',
            ]);

            if ($role !== null && ! $role->hasPermissionTo($permission)) {
                $role->givePermissionTo($permission);
            }
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

        foreach (self::PERMISSIONS as $permissionName) {
            $permission = Permission::query()
                ->where('name', $permissionName)
                ->where('guard_name', 'web')
                ->first();

            if ($role !== null && $permission !== null) {
                $role->permissions()->detach($permission->id);
            }
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
};