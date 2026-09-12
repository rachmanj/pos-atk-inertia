<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('expenses')->orderBy('id')->each(function (object $expense): void {
            DB::table('expense_lines')->insert([
                'expense_id' => $expense->id,
                'category' => $expense->category,
                'title' => $expense->title,
                'amount' => $expense->amount,
                'created_at' => $expense->created_at,
                'updated_at' => $expense->updated_at,
            ]);
        });

        Schema::table('expenses', function (Blueprint $table) {
            $table->dropIndex(['expense_date', 'category']);
            $table->dropColumn(['category', 'title']);
        });
    }

    public function down(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            $table->string('category', 50)->after('expense_date');
            $table->string('title', 150)->after('category');
            $table->index(['expense_date', 'category']);
        });

        DB::table('expenses')->orderBy('id')->each(function (object $expense): void {
            $line = DB::table('expense_lines')
                ->where('expense_id', $expense->id)
                ->orderBy('id')
                ->first();

            if ($line === null) {
                return;
            }

            DB::table('expenses')
                ->where('id', $expense->id)
                ->update([
                    'category' => $line->category,
                    'title' => $line->title,
                ]);
        });
    }
};
