<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cashier_shifts', function (Blueprint $table) {
            $table->bigInteger('cash_overage')->default(0)->after('actual_cash');
            $table->string('overage_note', 255)->nullable()->after('cash_overage');
        });
    }

    public function down(): void
    {
        Schema::table('cashier_shifts', function (Blueprint $table) {
            $table->dropColumn(['cash_overage', 'overage_note']);
        });
    }
};
