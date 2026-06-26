<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cashier_shifts', function (Blueprint $table) {
            $table->bigInteger('ppob_opening_balance')->nullable()->after('cash_in_hand');
            $table->bigInteger('ppob_closing_balance')->nullable()->after('ppob_opening_balance');
            $table->bigInteger('ppob_expected_balance')->nullable()->after('ppob_closing_balance');
        });
    }

    public function down(): void
    {
        Schema::table('cashier_shifts', function (Blueprint $table) {
            $table->dropColumn(['ppob_opening_balance', 'ppob_closing_balance', 'ppob_expected_balance']);
        });
    }
};
