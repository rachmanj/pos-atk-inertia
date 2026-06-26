<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->enum('product_type', ['physical', 'ppob'])->default('physical')->after('description');
            $table->bigInteger('avg_cost')->default(0)->after('buy_price');
        });

        DB::table('products')->update([
            'avg_cost' => DB::raw('buy_price'),
        ]);
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['product_type', 'avg_cost']);
        });
    }
};
