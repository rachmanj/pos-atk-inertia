<?php

namespace Tests;

use App\Support\DatabaseSafetyGuard;
use App\Services\Telegram\TelegramBotClient;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Tests\Support\FakeTelegramBotClient;

abstract class TestCase extends BaseTestCase
{
    public static function assertTestingDatabase(?string $connection = null, ?string $database = null): void
    {
        DatabaseSafetyGuard::assertTestingDatabase($connection, $database);
    }

    protected function setUp(): void
    {
        if (! $this->app) {
            $this->refreshApplication();
        }

        static::assertTestingDatabase();

        parent::setUp();

        FakeTelegramBotClient::reset();
        $this->app->instance(TelegramBotClient::class, new FakeTelegramBotClient());
    }
}
