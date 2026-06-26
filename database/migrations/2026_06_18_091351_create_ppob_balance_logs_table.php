<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ppob_balance_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ppob_account_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->foreignId('cashier_shift_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('type', ['opening_balance', 'top_up', 'sale', 'adjustment']);
            $table->bigInteger('amount');
            $table->bigInteger('balance_before');
            $table->bigInteger('balance_after');
            $table->nullableMorphs('reference');
            $table->string('note')->nullable();
            $table->timestamps();

            $table->index(['ppob_account_id', 'created_at']);
            $table->index('type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ppob_balance_logs');
    }
};
