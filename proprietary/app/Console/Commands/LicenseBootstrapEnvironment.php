<?php

namespace App\Console\Commands;

use App\Services\Licensing\LicenseFileImporter;
use App\Services\Licensing\LicenseFileStore;
use App\Services\Licensing\LicenseManager;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class LicenseBootstrapEnvironment extends Command
{
    private const ENVIRONMENT_VARIABLE = 'PUPPETFLOW_LICENSE_MANAGED';

    protected $signature = 'license:bootstrap-env';

    protected $description = 'Import and activate the license provided through the environment';

    public function handle(
        LicenseFileImporter $files,
        LicenseFileStore $fileStore,
        LicenseManager $licenses,
    ): int {
        $encoded = getenv(self::ENVIRONMENT_VARIABLE);

        if (! is_string($encoded) || trim($encoded) === '') {
            return self::SUCCESS;
        }

        $content = base64_decode(trim($encoded), true);
        if (! is_string($content) || trim($content) === '') {
            $this->error(self::ENVIRONMENT_VARIABLE.' must contain the valid base64 encoding of a license file.');

            return self::FAILURE;
        }

        try {
            $result = Cache::lock('license:bootstrap-env', 300)->block(
                120,
                function () use ($content, $files, $fileStore, $licenses): int {
                    $stored = $fileStore->get();
                    $sameLicense = is_string($stored)
                        && hash_equals(trim($stored), trim($content));

                    if ($sameLicense && $licenses->applicableFeatureFlags() !== null) {
                        $this->info('Environment license is already imported and active.');

                        return self::SUCCESS;
                    }

                    if (! is_string($stored)) {
                        $files->import($content);
                    } elseif (! $sameLicense) {
                        $deployed = $files->deploy($content);
                        if ($deployed === null) {
                            $this->info('Stored license is newer than the environment license; keeping stored license.');
                        }
                    }

                    $payload = $licenses->activate();

                    $this->info('License activated.');
                    $this->line('Plan: '.($payload->plan ?? 'unknown'));
                    $this->line('Expires at: '.($payload->expiresAt ?? 'unknown'));

                    return self::SUCCESS;
                },
            );

            return is_int($result) ? $result : self::FAILURE;
        } catch (\Throwable $e) {
            $this->error('Unable to bootstrap the environment license: '.$e->getMessage());

            return self::FAILURE;
        }
    }
}
