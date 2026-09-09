<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('whatsapp_outbound_logs', function (Blueprint $table) {
            $table->id();
            $table->string('purpose');
            $table->foreignId('cashier_shift_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('transaction_id')->nullable()->constrained()->nullOnDelete();
            $table->string('to_number');
            $table->text('message_text');
            $table->string('status')->default('queued');
            $table->string('wa_message_id')->nullable();
            $table->text('error')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['purpose', 'cashier_shift_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('whatsapp_outbound_logs');
    }
};
