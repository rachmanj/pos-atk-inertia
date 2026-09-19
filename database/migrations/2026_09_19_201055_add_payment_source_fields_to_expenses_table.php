<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            $table->enum('payment_source', ['cash', 'bank', 'ppob'])->default('cash')->after('amount');
            $table->foreignId('ppob_account_id')->nullable()->after('payment_source')->constrained('ppob_accounts')->nullOnDelete();
            $table->foreignId('cashier_shift_id')->nullable()->after('ppob_account_id')->constrained('cashier_shifts')->nullOnDelete();
            $table->foreignId('balance_log_id')->nullable()->after('cashier_shift_id')->constrained('ppob_balance_logs')->nullOnDelete();
        });

        DB::table('expenses')->update(['payment_source' => 'cash']);
    }

    public function down(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            $table->dropConstrainedForeignId('balance_log_id');
            $table->dropConstrainedForeignId('cashier_shift_id');
            $table->dropConstrainedForeignId('ppob_account_id');
            $table->dropColumn('payment_source');
        });
    }
};
