<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserTableSeeder extends Seeder
{
    public function run(): void
    {
        $adminRoleName = config('roles.admin', 'admin');
        $cashierRoleName = config('roles.cashier', 'cashier');

        // Membuat user Super Admin
        $admin = User::firstOrCreate([
            'email' => 'admin@gmail.com',
        ], [
            'name' => 'Administrator',
            'password' => Hash::make('password'),
        ]);

        $admin->update([
            'name' => 'Administrator',
        ]);

        $admin->syncRoles([$adminRoleName]);

        // Membuat user Kasir
        $cashier = User::firstOrCreate([
            'email' => 'kasir@gmail.com',
        ], [
            'name' => 'Kasir',
            'password' => Hash::make('password'),
        ]);

        $cashier->update([
            'name' => 'Kasir',
        ]);

        $cashier->syncRoles([$cashierRoleName]);
    }
}
