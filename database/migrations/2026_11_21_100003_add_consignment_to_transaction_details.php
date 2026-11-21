<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transaction_details', function (Blueprint $table) {
            $table->unsignedBigInteger('consignment_item_id')->nullable()->after('ppob_cost');
            $table->unsignedInteger('consignment_qty')->default(0)->after('consignment_item_id');

            $table->foreign('consignment_item_id')
                ->references('id')
                ->on('consignment_items')
                ->restrictOnDelete();

            $table->index('consignment_item_id');
        });
    }

    public function down(): void
    {
        Schema::table('transaction_details', function (Blueprint $table) {
            $table->dropForeign(['consignment_item_id']);
            $table->dropIndex(['consignment_item_id']);
            $table->dropColumn(['consignment_item_id', 'consignment_qty']);
        });
    }
};