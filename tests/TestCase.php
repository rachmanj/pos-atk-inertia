<?php

namespace Tests;

use App\Services\Telegram\TelegramBotClient;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Tests\Support\FakeTelegramBotClient;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        FakeTelegramBotClient::reset();
        $this->app->instance(TelegramBotClient::class, new FakeTelegramBotClient());
    }
}
