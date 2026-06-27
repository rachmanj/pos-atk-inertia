<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('username')->nullable()->unique()->after('name');
        });

        User::query()->each(function (User $user) {
            $base = Str::slug(Str::before($user->email, '@'), '_');
            $username = $base !== '' ? $base : 'user_' . $user->id;
            $counter = 1;

            while (User::where('username', $username)->where('id', '!=', $user->id)->exists()) {
                $username = $base . '_' . $counter;
                $counter++;
            }

            $user->update(['username' => $username]);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->string('username')->nullable(false)->change();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('username');
        });
    }
};
