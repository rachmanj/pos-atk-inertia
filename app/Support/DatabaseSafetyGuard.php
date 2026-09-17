<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;
use RuntimeException;

class DatabaseSafetyGuard
{
    public const PRODUCTION_DATABASE = 'pos_kasir_dev';

    public const DESTRUCTIVE_COMMANDS = [
        'migrate:fresh',
        'migrate:refresh',
        'db:wipe',
    ];

    public static function assertTestingDatabase(?string $connection = null, ?string $database = null): void
    {
        $connection ??= config('database.default');
        $database ??= config("database.connections.{$connection}.database");

        if ($connection !== 'sqlite' || $database !== ':memory:') {
            throw new RuntimeException(
                "Test DIBATALKAN: database test bukan sqlite in-memory (connection={$connection}, database={$database}). Test TIDAK BOLEH menyentuh DB produksi pos_kasir_dev."
            );
        }
    }

    public static function guardDestructiveCommand(string $command): void
    {
        if (! in_array($command, self::DESTRUCTIVE_COMMANDS, true)) {
            return;
        }

        if (! app()->runningInConsole()) {
            return;
        }

        $databaseName = DB::connection()->getDatabaseName();

        if ($databaseName === self::PRODUCTION_DATABASE && ! filter_var(env('ALLOW_DESTRUCTIVE_DB'), FILTER_VALIDATE_BOOLEAN)) {
            throw new RuntimeException(
                'Perintah destruktif diblokir pada database produksi pos_kasir_dev. Set ALLOW_DESTRUCTIVE_DB=1 bila benar-benar disengaja.'
            );
        }
    }
}
