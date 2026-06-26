<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cashier_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained('customers')->nullOnDelete();
            $table->string('invoice')->unique();
            $table->bigInteger('cash')->default(0);
            $table->bigInteger('change')->default(0);
            $table->bigInteger('discount')->default(0);
            $table->bigInteger('grand_total')->default(0);
            $table->string('payment_method')->default('cash');
            $table->string('payment_channel')->nullable();
            $table->enum('payment_status', [
                'unpaid',
                'pending',
                'paid',
                'expired',
                'failed',
            ])->default('unpaid');
            $table->string('snap_token')->nullable();
            $table->string('midtrans_transaction_id')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->enum('status', [
                'pending',
                'completed',
                'voided',
            ])->default('pending');
            $table->text('void_reason')->nullable();
            $table->foreignId('voided_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('voided_at')->nullable();
            $table->text('note')->nullable();
            $table->timestamps();

            $table->index('created_at');
            $table->index('payment_status');
            $table->index(['status', 'payment_status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
