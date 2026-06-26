<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        DB::statement("ALTER TABLE products MODIFY product_type ENUM('physical', 'ppob', 'service') NOT NULL DEFAULT 'physical'");
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        DB::table('products')->where('product_type', 'service')->update(['product_type' => 'physical']);

        DB::statement("ALTER TABLE products MODIFY product_type ENUM('physical', 'ppob') NOT NULL DEFAULT 'physical'");
    }
};
