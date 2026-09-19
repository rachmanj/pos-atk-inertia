<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_id')->constrained('purchases')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();
            $table->date('paid_on');
            $table->bigInteger('amount');
            $table->string('method', 30);
            $table->text('note')->nullable();
            $table->timestamps();

            $table->index('paid_on');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_payments');
    }
};
