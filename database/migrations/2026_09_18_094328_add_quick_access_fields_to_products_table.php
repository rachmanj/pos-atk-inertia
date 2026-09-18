<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->boolean('is_quick_access')->default(false)->after('is_active');
            $table->unsignedSmallInteger('quick_access_order')->default(0)->after('is_quick_access');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['is_quick_access', 'quick_access_order']);
        });
    }
};
