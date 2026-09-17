<?php

namespace App\Providers;

use App\Support\DatabaseSafetyGuard;
use Illuminate\Console\Events\CommandStarting;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        if (env('FORCE_HTTPS', false)) {
            URL::forceScheme('https');
        }

        Event::listen(CommandStarting::class, function (CommandStarting $event): void {
            DatabaseSafetyGuard::guardDestructiveCommand($event->command);
        });
    }
}
