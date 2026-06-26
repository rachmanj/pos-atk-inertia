<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_components', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('component_product_id')->constrained('products')->restrictOnDelete();
            $table->decimal('qty_per_unit', 10, 4);
            $table->string('note')->nullable();
            $table->timestamps();

            $table->unique(['service_product_id', 'component_product_id'], 'product_components_service_component_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_components');
    }
};
