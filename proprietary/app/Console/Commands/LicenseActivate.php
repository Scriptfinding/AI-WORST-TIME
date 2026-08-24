<?php

namespace App\Console\Commands;

use App\Services\Licensing\LicenseManager;
use Illuminate\Console\Command;

class LicenseActivate extends Command
{
    protected $signature = 'license:activate';

    protected $description = 'Activate this instance against the license server using the imported license file';

    public function handle(LicenseManager $licenses): int
    {
        try {
            $payload = $licenses->activate();
        } catch (\Throwable $e) {
            $this->error($e->getMessage());
            $this->line('Import a license file first with license:import-file.');

            return self::FAILURE;
        }

        $this->info('License activated.');
        $this->line('Plan: '.($payload->plan ?? 'unknown'));
        $this->line('Expires at: '.($payload->expiresAt ?? 'unknown'));

        return self::SUCCESS;
    }
}
