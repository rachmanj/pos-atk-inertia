<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transaction_details', function (Blueprint $table) {
            $table->foreignId('unit_id')->nullable()->after('product_id')->constrained()->nullOnDelete();
            $table->decimal('conversion_factor', 10, 4)->default(1)->after('unit_id');
            $table->string('customer_ref')->nullable()->after('subtotal');
            $table->bigInteger('ppob_cost')->nullable()->after('customer_ref');
            $table->bigInteger('admin_fee')->nullable()->after('ppob_cost');
        });
    }

    public function down(): void
    {
        Schema::table('transaction_details', function (Blueprint $table) {
            $table->dropForeign(['unit_id']);
            $table->dropColumn(['unit_id', 'conversion_factor', 'customer_ref', 'ppob_cost', 'admin_fee']);
        });
    }
};
