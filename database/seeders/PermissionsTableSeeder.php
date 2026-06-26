<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;

class PermissionsTableSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            // Dashboard
            'dashboard.index',
            'dashboard.revenue_chart',
            'dashboard.best_selling',

            // Categories
            'categories.index',
            'categories.create',
            'categories.edit',
            'categories.delete',

            // Products
            'products.index',
            'products.create',
            'products.edit',
            'products.delete',
            'products.stock_adjustment',

            // Suppliers
            'suppliers.index',
            'suppliers.create',
            'suppliers.edit',
            'suppliers.delete',

            // Purchases
            'purchases.index',
            'purchases.create',
            'purchases.show',

            // Supplier Returns
            'supplier_returns.index',
            'supplier_returns.create',
            'supplier_returns.show',

            // Expenses
            'expenses.index',
            'expenses.create',
            'expenses.edit',
            'expenses.delete',

            // Customers
            'customers.index',
            'customers.create',
            'customers.edit',
            'customers.delete',

            // Transactions
            'transactions.index',
            'transactions.create',
            'transactions.show',
            'transactions.print',
            'transactions.void',

            // Returns
            'returns.index',
            'returns.create',
            'returns.approve',
            'returns.show',

            // Stock Movements
            'stock_movements.index',
            'stock_movements.create',

            // Stock Opnames
            'stock_opnames.index',
            'stock_opnames.create',
            'stock_opnames.show',

            // Cashier Shifts
            'cashier_shifts.index',
            'cashier_shifts.open',
            'cashier_shifts.close',
            'cashier_shifts.report',

            // Profits & Reports
            'profits.index',
            'reports.sales',
            'reports.stock',
            'reports.export',

            // Settings
            'settings.index',
            'settings.edit',

            // User Management
            'users.index',
            'users.create',
            'users.edit',
            'users.delete',

            // Role Management
            'roles.index',
            'roles.create',
            'roles.edit',
            'roles.delete',

            // Permission Management
            'permissions.index',

            // Units
            'units.index',
            'units.create',
            'units.edit',
            'units.delete',

            // PPOB Accounts
            'ppob-accounts.index',
            'ppob-accounts.create',
            'ppob-accounts.edit',

            // PPOB Balance Logs
            'ppob-balance-logs.index',
            'ppob-balance-logs.store',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate([
                'name' => $permission,
                'guard_name' => 'web',
            ]);
        }
    }
}
