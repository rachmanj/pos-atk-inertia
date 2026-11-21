<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('consignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supplier_id')->constrained('suppliers')->restrictOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('code')->unique();
            $table->date('received_date');
            $table->text('note')->nullable();
            $table->enum('status', ['open', 'closed'])->default('open');
            $table->timestamps();
        });

        Schema::create('consignment_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('consignment_id')->constrained('consignments')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->restrictOnDelete();
            $table->unsignedInteger('qty_in');
            $table->unsignedInteger('qty_sold')->default(0);
            $table->unsignedInteger('qty_returned')->default(0);
            $table->unsignedBigInteger('cost_price');
            $table->timestamps();

            $table->index('product_id');
            $table->index('consignment_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('consignment_items');
        Schema::dropIfExists('consignments');
    }
};