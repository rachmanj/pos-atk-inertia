<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('carts', function (Blueprint $table) {
            $table->bigInteger('token_nominal')->nullable()->after('admin_fee');
        });

        Schema::table('transaction_details', function (Blueprint $table) {
            $table->bigInteger('token_nominal')->nullable()->after('admin_fee');
        });
    }

    public function down(): void
    {
        Schema::table('carts', function (Blueprint $table) {
            $table->dropColumn('token_nominal');
        });

        Schema::table('transaction_details', function (Blueprint $table) {
            $table->dropColumn('token_nominal');
        });
    }
};
