<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('carts', function (Blueprint $table) {
            $table->string('discount_type')->nullable()->after('admin_fee')->comment('nominal | percent');
            $table->bigInteger('discount')->nullable()->default(0)->after('discount_type');
        });
    }

    public function down(): void
    {
        Schema::table('carts', function (Blueprint $table) {
            $table->dropColumn(['discount_type', 'discount']);
        });
    }
};
