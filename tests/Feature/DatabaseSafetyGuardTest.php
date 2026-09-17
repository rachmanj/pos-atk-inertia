<?php

namespace Tests\Feature;

use App\Support\DatabaseSafetyGuard;
use RuntimeException;
use Tests\TestCase;

class DatabaseSafetyGuardTest extends TestCase
{
    public function test_guard_rejects_non_sqlite_in_memory_database(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('TIDAK BOLEH');
        $this->expectExceptionMessage('pos_kasir_dev');

        TestCase::assertTestingDatabase('mysql', 'pos_kasir_dev');
    }

    public function test_guard_accepts_sqlite_in_memory_database(): void
    {
        TestCase::assertTestingDatabase('sqlite', ':memory:');

        $this->assertTrue(true);
    }

    public function test_destructive_commands_list_blocks_fresh_refresh_and_wipe_but_not_migrate(): void
    {
        $commands = DatabaseSafetyGuard::DESTRUCTIVE_COMMANDS;

        $this->assertContains('migrate:fresh', $commands);
        $this->assertContains('migrate:refresh', $commands);
        $this->assertContains('db:wipe', $commands);
        $this->assertNotContains('migrate', $commands);
    }
}
