<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ppob_accounts', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->bigInteger('current_balance')->default(0);
            $table->bigInteger('min_balance_alert')->default(100000);
            $table->boolean('is_active')->default(true);
            $table->text('note')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ppob_accounts');
    }
};
