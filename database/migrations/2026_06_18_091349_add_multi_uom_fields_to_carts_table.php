<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('carts', function (Blueprint $table) {
            $table->dropForeign(['cashier_id']);
            $table->dropForeign(['product_id']);
            $table->dropUnique(['cashier_id', 'product_id']);
        });

        Schema::table('carts', function (Blueprint $table) {
            $table->foreignId('unit_id')->nullable()->after('product_id')->constrained()->nullOnDelete();
            $table->string('customer_ref')->nullable()->after('price');
            $table->bigInteger('ppob_cost')->nullable()->after('customer_ref');
            $table->bigInteger('admin_fee')->nullable()->after('ppob_cost');

            $table->foreign('cashier_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('product_id')->references('id')->on('products')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('carts', function (Blueprint $table) {
            $table->dropForeign(['cashier_id']);
            $table->dropForeign(['product_id']);
            $table->dropForeign(['unit_id']);
            $table->dropColumn(['unit_id', 'customer_ref', 'ppob_cost', 'admin_fee']);
        });

        Schema::table('carts', function (Blueprint $table) {
            $table->foreign('cashier_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('product_id')->references('id')->on('products')->cascadeOnDelete();
            $table->unique(['cashier_id', 'product_id']);
        });
    }
};
