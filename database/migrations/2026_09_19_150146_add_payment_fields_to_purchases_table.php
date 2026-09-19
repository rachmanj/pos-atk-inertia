<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchases', function (Blueprint $table) {
            $table->enum('payment_status', ['unpaid', 'partial', 'paid'])
                ->default('paid')
                ->after('total_amount');
            $table->smallInteger('payment_term_days')->nullable()->after('payment_status');
            $table->date('due_date')->nullable()->after('payment_term_days');

            $table->index('payment_status');
            $table->index('due_date');
        });
    }

    public function down(): void
    {
        Schema::table('purchases', function (Blueprint $table) {
            $table->dropIndex(['payment_status']);
            $table->dropIndex(['due_date']);
            $table->dropColumn(['payment_status', 'payment_term_days', 'due_date']);
        });
    }
};
