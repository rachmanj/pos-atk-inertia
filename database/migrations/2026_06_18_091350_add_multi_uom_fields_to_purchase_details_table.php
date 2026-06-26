<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchase_details', function (Blueprint $table) {
            $table->foreignId('unit_id')->nullable()->after('product_id')->constrained()->nullOnDelete();
            $table->decimal('conversion_factor', 10, 4)->default(1)->after('unit_id');
        });
    }

    public function down(): void
    {
        Schema::table('purchase_details', function (Blueprint $table) {
            $table->dropForeign(['unit_id']);
            $table->dropColumn(['unit_id', 'conversion_factor']);
        });
    }
};
