<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchases', function (Blueprint $table) {
            $table->bigInteger('dpp_amount')->default(0)->after('total_amount');
            $table->bigInteger('tax_amount')->default(0)->after('dpp_amount');
            $table->decimal('tax_rate', 5, 2)->nullable()->after('tax_amount');
            $table->boolean('tax_included')->default(false)->after('tax_rate');
            $table->boolean('hpp_includes_tax')->default(true)->after('tax_included');
        });

        Schema::table('purchase_details', function (Blueprint $table) {
            $table->bigInteger('tax_amount')->default(0)->after('subtotal');
        });

        DB::table('purchases')
            ->where('tax_amount', 0)
            ->where('dpp_amount', 0)
            ->update(['dpp_amount' => DB::raw('total_amount')]);
    }

    public function down(): void
    {
        Schema::table('purchase_details', function (Blueprint $table) {
            $table->dropColumn('tax_amount');
        });

        Schema::table('purchases', function (Blueprint $table) {
            $table->dropColumn([
                'dpp_amount',
                'tax_amount',
                'tax_rate',
                'tax_included',
                'hpp_includes_tax',
            ]);
        });
    }
};
