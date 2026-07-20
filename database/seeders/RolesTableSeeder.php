<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolesTableSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $adminRoleName = config('roles.admin', 'admin');
        $cashierRoleName = config('roles.cashier', 'cashier');

        // Super Admin mendapatkan semua permission
        $admin = Role::findOrCreate($adminRoleName, 'web');
        $admin->syncPermissions(Permission::all());

        // Kasir hanya mendapatkan permission operasional kasir
        $cashier = Role::findOrCreate($cashierRoleName, 'web');
        $cashier->syncPermissions([
            'dashboard.index',

            'categories.index',

            'products.index',

            'customers.index',
            'customers.create',
            'customers.edit',

            'transactions.index',
            'transactions.create',
            'transactions.show',
            'transactions.print',

            'returns.index',
            'returns.create',
            'returns.show',

            'cashier_shifts.index',
            'cashier_shifts.open',
            'cashier_shifts.close',

            'reports.sales',
            'reports.product_sales',
            'reports.expense',

            'ppob-balance-logs.index',
            'ppob-balance-logs.store',
        ]);
    }
}
