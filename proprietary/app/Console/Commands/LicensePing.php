<?php

namespace App\Console\Commands;

use App\Services\Licensing\LicenseManager;
use Illuminate\Console\Command;

class LicensePing extends Command
{
    protected $signature = 'license:ping {--force : Ping even when the cached token is still fresh}';

    protected $description = 'Refresh the signed license entitlements';

    public function handle(LicenseManager $licenses): int
    {
        if (! $this->option('force') && ! $licenses->shouldPing()) {
            $this->line('License token is still fresh.');

            return self::SUCCESS;
        }

        try {
            $payload = $licenses->ping();
        } catch (\Throwable $e) {
            $this->error($e->getMessage());

            return self::FAILURE;
        }

        // The ping locks the instance and removes the license when the static
        // file checksum check fails on the fresh token.
        $lock = $licenses->staticFileChecksumLock();
        if ($lock && ! $licenses->payload()) {
            $message = $lock['message'] ?? null;
            $this->error(is_string($message) ? $message : 'The application files failed the integrity check.');

            return self::FAILURE;
        }

        $this->info('License refreshed.');
        $this->line('Next check at: '.($payload->nextCheckAt ?? 'unknown'));

        return self::SUCCESS;
    }
}
