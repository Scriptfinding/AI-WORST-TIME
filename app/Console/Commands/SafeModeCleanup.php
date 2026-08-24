<?php

namespace App\Console\Commands;

use App\Services\Auth\SafeModeAuthenticator;
use Illuminate\Console\Command;

class SafeModeCleanup extends Command
{
    protected $signature = 'safe-mode:cleanup';

    protected $description = 'Remove the temporary Safe Mode identity when Safe Mode is disabled';

    public function handle(SafeModeAuthenticator $authenticator): int
    {
        if (config('app.safe_mode')) {
            $this->components->info('Safe Mode is enabled; keeping its temporary identity.');

            return self::SUCCESS;
        }

        $authenticator->deleteSafeModeUser();
        $this->components->info('Safe Mode identity cleanup completed.');

        return self::SUCCESS;
    }
}
