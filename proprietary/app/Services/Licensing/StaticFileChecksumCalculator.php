<?php

namespace App\Services\Licensing;

use Illuminate\Support\Facades\Cache;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use SplFileInfo;

/**
 * Computes a deterministic checksum over the application source files, front
 * and back. The official value per release is computed with `php artisan
 * license:sfc` and registered on the license server, which embeds it in the
 * signed license token. A divergence at runtime means the installation was
 * modified (for example to bypass license checks).
 */
class StaticFileChecksumCalculator
{
    private const CACHE_KEY = 'license.sfc';
    private const CACHE_TTL_SECONDS = 300;

    /**
     * Directories are relative to the base path. Anything generated at
     * runtime (caches, storage, uploads, dependencies) must stay out so the
     * checksum only varies when the shipped source varies.
     */
    private const INCLUDE_DIRECTORIES = [
        'app',
        'bin',
        'bootstrap',
        'config',
        'database',
        'proprietary',
        'resources',
        'routes',
        'src',
    ];

    private const INCLUDE_FILES = [
        'artisan',
        'composer.json',
        'LICENSE.md',
        'LICENSE_PROPRIETARY.md',
        'main.js',
        'version.txt',
    ];

    private const EXCLUDE_PATH_PARTS = [
        '/bootstrap/cache/',
        '/node_modules/',
        '/storage/',
        '/vendor/',
    ];

    private const EXCLUDE_FILENAME_PARTS = [
        '.DS_Store',
        '.sqlite',
    ];

    public function cached(): string
    {
        return Cache::remember(self::CACHE_KEY, self::CACHE_TTL_SECONDS, fn () => $this->compute());
    }

    /**
     * Recompute ignoring the cache, for destructive decisions that must not
     * rely on a possibly stale value.
     */
    public function fresh(): string
    {
        $checksum = $this->compute();
        Cache::put(self::CACHE_KEY, $checksum, self::CACHE_TTL_SECONDS);

        return $checksum;
    }

    public function fileCount(): int
    {
        return count($this->files());
    }

    public function compute(): string
    {
        $hash = hash_init('sha256');

        foreach ($this->files() as $relativePath => $absolutePath) {
            // The relative path takes part in the hash so renames and moves
            // are detected even when file contents stay identical.
            hash_update($hash, $relativePath . "\0");

            $handle = fopen($absolutePath, 'rb');
            if ($handle === false) {
                continue;
            }

            while (! feof($handle)) {
                $chunk = fread($handle, 65536);
                if ($chunk === false || $chunk === '') {
                    break;
                }
                hash_update($hash, $chunk);
            }

            fclose($handle);
        }

        return hash_final($hash);
    }

    /**
     * @return array<string, string> relative path => absolute path, sorted by relative path
     */
    private function files(): array
    {
        $basePath = rtrim(base_path(), '/');
        $files = [];

        foreach (self::INCLUDE_FILES as $file) {
            $absolute = $basePath . '/' . $file;
            if (is_file($absolute)) {
                $files[$file] = $absolute;
            }
        }

        foreach (self::INCLUDE_DIRECTORIES as $directory) {
            $absoluteDirectory = $basePath . '/' . $directory;
            if (! is_dir($absoluteDirectory)) {
                continue;
            }

            $iterator = new RecursiveIteratorIterator(
                new RecursiveDirectoryIterator($absoluteDirectory, RecursiveDirectoryIterator::SKIP_DOTS),
            );

            /** @var SplFileInfo $file */
            foreach ($iterator as $file) {
                if (! $file->isFile()) {
                    continue;
                }

                $absolute = str_replace('\\', '/', $file->getPathname());
                $relative = ltrim(substr($absolute, strlen($basePath)), '/');

                if ($this->matchesAny('/' . $relative, self::EXCLUDE_PATH_PARTS)) {
                    continue;
                }

                if ($this->matchesAny($file->getFilename(), self::EXCLUDE_FILENAME_PARTS)) {
                    continue;
                }

                $files[$relative] = $absolute;
            }
        }

        ksort($files, SORT_STRING);

        return $files;
    }

    /**
     * @param list<string> $parts
     */
    private function matchesAny(string $subject, array $parts): bool
    {
        foreach ($parts as $part) {
            if (str_contains($subject, $part)) {
                return true;
            }
        }

        return false;
    }
}
