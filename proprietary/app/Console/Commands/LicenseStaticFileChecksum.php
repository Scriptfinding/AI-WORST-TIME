<?php

namespace App\Console\Commands;

use App\Services\Licensing\StaticFileChecksumCalculator;
use Illuminate\Console\Command;

class LicenseStaticFileChecksum extends Command
{
    protected $signature = 'license:sfc
        {--o|output= : Write the checksum to a file instead of stdout}
        {--r|raw : Print only the checksum, for piping or scripting}';

    protected $description = 'Compute the static file checksum (SFC) of this release';

    public function handle(StaticFileChecksumCalculator $calculator): int
    {
        $startedAt = microtime(true);
        $checksum = $calculator->compute();
        $durationMs = (int) round((microtime(true) - $startedAt) * 1000);
        $configuredVersion = config('license.app_version');
        $version = is_scalar($configuredVersion) ? (string) $configuredVersion : 'unknown';
        $version = $version !== '' ? $version : 'unknown';
        $output = $this->option('output');

        if ($this->option('raw')) {
            $this->getOutput()->writeln($checksum);

            return self::SUCCESS;
        }

        $this->newLine();
        $this->line('  <options=bold>Static file checksum</>');
        $this->newLine();
        $this->components->twoColumnDetail('<fg=gray>Version</>', "<options=bold>{$version}</>");
        $this->components->twoColumnDetail('<fg=gray>Files hashed</>', number_format($calculator->fileCount()));
        $this->components->twoColumnDetail('<fg=gray>Duration</>', "{$durationMs} ms");
        $this->components->twoColumnDetail('<fg=gray>Checksum (SFC)</>', "<options=bold;fg=green>{$checksum}</>");
        $this->newLine();

        if (is_string($output) && $output !== '') {
            file_put_contents($output, $checksum);
            $this->components->info("Checksum written to {$output}");
        } else {
            $this->components->info("Checksum computed for version {$version}. Use --output to write it to a file, or --raw for scripting.");
        }

        return self::SUCCESS;
    }
}
