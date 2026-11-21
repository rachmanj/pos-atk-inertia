<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('supplier_returns', function (Blueprint $table) {
            $table->dropForeign(['purchase_id']);
            $table->unsignedBigInteger('purchase_id')->nullable()->change();
            $table->foreign('purchase_id')
                ->references('id')
                ->on('purchases')
                ->cascadeOnDelete();

            $table->foreignId('consignment_id')
                ->nullable()
                ->after('purchase_id')
                ->constrained('consignments')
                ->restrictOnDelete();
        });

        Schema::table('supplier_return_details', function (Blueprint $table) {
            $table->dropForeign(['purchase_detail_id']);
            $table->unsignedBigInteger('purchase_detail_id')->nullable()->change();
            $table->foreign('purchase_detail_id')
                ->references('id')
                ->on('purchase_details')
                ->restrictOnDelete();

            $table->foreignId('consignment_item_id')
                ->nullable()
                ->after('purchase_detail_id')
                ->constrained('consignment_items')
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('supplier_return_details', function (Blueprint $table) {
            $table->dropForeign(['consignment_item_id']);
            $table->dropColumn('consignment_item_id');

            $table->dropForeign(['purchase_detail_id']);
            // Kolom purchase_detail_id dibiarkan nullable; mengembalikan NOT NULL tidak aman
            // jika sudah ada baris retur konsinyasi (purchase_detail_id NULL).
            $table->foreign('purchase_detail_id')
                ->references('id')
                ->on('purchase_details')
                ->restrictOnDelete();
        });

        Schema::table('supplier_returns', function (Blueprint $table) {
            $table->dropForeign(['consignment_id']);
            $table->dropColumn('consignment_id');

            $table->dropForeign(['purchase_id']);
            // Sama: purchase_id tetap nullable setelah rollback jika data konsinyasi sudah ada.
            $table->foreign('purchase_id')
                ->references('id')
                ->on('purchases')
                ->cascadeOnDelete();
        });
    }
};