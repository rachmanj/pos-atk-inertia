<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('expense_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('expense_id')->constrained('expenses')->cascadeOnDelete();
            $table->string('category', 50);
            $table->string('title', 150);
            $table->unsignedBigInteger('amount');
            $table->timestamps();

            $table->index('expense_id');
            $table->index('category');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expense_lines');
    }
};
