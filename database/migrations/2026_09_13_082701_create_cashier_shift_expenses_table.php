<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cashier_shift_expenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cashier_shift_id')->constrained('cashier_shifts')->cascadeOnDelete();
            $table->string('title', 150);
            $table->unsignedBigInteger('amount');
            $table->timestamps();

            $table->index('cashier_shift_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cashier_shift_expenses');
    }
};
