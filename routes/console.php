<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('triggers:run-scheduled')
    ->everyMinute()
    ->withoutOverlapping(10)
    ->onOneServer();
Schedule::command('mailbox:maintain')
    ->everyMinute()
    ->withoutOverlapping()
    ->onOneServer();
Schedule::command('storage:cleanup-pending')
    ->everyMinute()
    ->withoutOverlapping()
    ->onOneServer();
Schedule::command('runs:reconcile-stale')
    ->everyMinute()
    ->withoutOverlapping()
    ->onOneServer();
Schedule::command('entitlements:sync-stale')
    ->hourly()
    ->onOneServer();
Schedule::command('license:ping')
    ->daily()
    ->onOneServer();
Schedule::command('telescope:prune --hours=24')
    ->daily()
    ->withoutOverlapping()
    ->onOneServer();
