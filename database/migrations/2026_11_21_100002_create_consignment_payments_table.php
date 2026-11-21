<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('consignment_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supplier_id')->constrained('suppliers')->restrictOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->date('paid_on');
            $table->unsignedBigInteger('amount');
            $table->string('method', 30)->default('tunai');
            $table->text('note')->nullable();
            $table->timestamps();

            $table->index('supplier_id');
        });

        Schema::create('consignment_payment_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('consignment_payment_id')->constrained('consignment_payments')->cascadeOnDelete();
            $table->foreignId('consignment_item_id')->constrained('consignment_items')->restrictOnDelete();
            $table->unsignedInteger('qty');
            $table->unsignedBigInteger('amount');
            $table->timestamps();

            $table->index('consignment_payment_id');
            $table->index('consignment_item_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('consignment_payment_items');
        Schema::dropIfExists('consignment_payments');
    }
};