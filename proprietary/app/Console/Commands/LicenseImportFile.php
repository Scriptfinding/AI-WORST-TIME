<?php

namespace App\Console\Commands;

use App\Services\Licensing\LicenseFileImporter;
use App\Services\Licensing\LicenseManager;
use Illuminate\Console\Command;

class LicenseImportFile extends Command
{
    protected $signature = 'license:import-file {path : License file to import}';

    protected $description = 'Import a signed license file and activate this instance';

    public function handle(LicenseFileImporter $files, LicenseManager $licenses): int
    {
        $path = $this->argument('path');

        if (! is_string($path) || ! is_file($path)) {
            $displayPath = is_scalar($path) ? (string) $path : get_debug_type($path);
            $this->error("No license file found at {$displayPath}.");

            return self::FAILURE;
        }

        try {
            $files->import((string) file_get_contents($path));
            $payload = $licenses->activate();
        } catch (\Throwable $e) {
            $this->error($e->getMessage());

            return self::FAILURE;
        }

        $this->info("License imported from {$path} and activated.");
        $this->line('Plan: '.($payload->plan ?? 'unknown'));
        $this->line('Expires at: '.($payload->expiresAt ?? 'unknown'));

        return self::SUCCESS;
    }
}
