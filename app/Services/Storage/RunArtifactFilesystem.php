<?php

namespace App\Services\Storage;

use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\Storage;

class RunArtifactFilesystem
{
    public const WORKSPACE_DISK = 'run-artifacts-workspace';

    public function workspace(): FilesystemAdapter
    {
        return $this->disk(self::WORKSPACE_DISK);
    }

    public function disk(?string $disk = null): FilesystemAdapter
    {
        $disk ??= self::WORKSPACE_DISK;
        if ($disk === '') {
            throw new \UnexpectedValueException('Filesystem disk must be a non-empty string.');
        }

        /** @var FilesystemAdapter $filesystem */
        $filesystem = Storage::disk($disk);

        return $filesystem;
    }

    public function durableDiskName(): string
    {
        $disk = config('filesystems.puppetflow_storage_disk', 'puppetflow-local');
        if (! is_string($disk) || $disk === '') {
            throw new \UnexpectedValueException('Puppetflow storage disk must be a non-empty string.');
        }

        return $disk;
    }

    public function configuredDiskName(string $disk): string
    {
        if ($disk === '' || ! is_array(config("filesystems.disks.{$disk}"))) {
            throw new \InvalidArgumentException("Filesystem disk {$disk} is not configured.");
        }

        return $disk;
    }

    public function normalizePath(string $path): string
    {
        if ($path === '' || str_contains($path, "\0") || str_starts_with($path, '/') || str_contains($path, '\\')) {
            throw new \InvalidArgumentException('Storage path must be a non-empty relative path.');
        }

        $segments = explode('/', $path);
        foreach ($segments as $segment) {
            if ($segment === '' || $segment === '.' || $segment === '..') {
                throw new \InvalidArgumentException('Storage path contains an invalid segment.');
            }
        }

        return implode('/', $segments);
    }

    public function normalizeSegment(string $segment): string
    {
        if ($segment === '' || $segment === '.' || $segment === '..' || str_contains($segment, '/') || str_contains($segment, '\\')) {
            throw new \InvalidArgumentException('Storage directory segment is invalid.');
        }

        return $segment;
    }

    public function absolutePath(string $path, bool $create, bool $pathIsFile = false): string
    {
        $path = $this->normalizePath($path);
        if ($create) {
            $this->workspace()->makeDirectory($pathIsFile ? dirname($path) : $path);
        }

        return $this->workspace()->path($path);
    }

    public function disksShareLocalRoot(string $leftDisk, string $rightDisk): bool
    {
        $left = config("filesystems.disks.{$leftDisk}");
        $right = config("filesystems.disks.{$rightDisk}");
        if (
            ! is_array($left)
            || ! is_array($right)
            || ($left['driver'] ?? null) !== 'local'
            || ($right['driver'] ?? null) !== 'local'
        ) {
            return false;
        }

        $leftRoot = $left['root'] ?? null;
        $rightRoot = $right['root'] ?? null;
        if (! is_string($leftRoot) || ! is_string($rightRoot)) {
            return false;
        }

        $leftRealPath = realpath($leftRoot);
        $rightRealPath = realpath($rightRoot);

        return rtrim($leftRealPath !== false ? $leftRealPath : $leftRoot, DIRECTORY_SEPARATOR)
            === rtrim($rightRealPath !== false ? $rightRealPath : $rightRoot, DIRECTORY_SEPARATOR);
    }

    public function objectMatches(FilesystemAdapter $disk, string $path, int $size, string $checksum): bool
    {
        try {
            if (! $disk->exists($path) || $disk->size($path) !== $size) {
                return false;
            }
            $stream = $disk->readStream($path);
            if (! is_resource($stream)) {
                return false;
            }
            try {
                $hash = hash_init('sha256');
                hash_update_stream($hash, $stream);
                $actualChecksum = hash_final($hash);
            } finally {
                fclose($stream);
            }

            return hash_equals($checksum, $actualChecksum);
        } catch (\Throwable) {
            return false;
        }
    }

    public function pruneEmptyParents(string $directory, string $stopAt): void
    {
        $directory = $directory === '.' ? '' : $this->normalizePath($directory);
        $stopAt = $stopAt === '' ? '' : $this->normalizePath($stopAt);
        while ($directory !== '' && $directory !== $stopAt) {
            $absolutePath = $this->workspace()->path($directory);
            $entries = is_dir($absolutePath) ? scandir($absolutePath) : false;
            if ($entries === false || count($entries) !== 2) {
                break;
            }
            @rmdir($absolutePath);
            $directory = dirname($directory);
            $directory = $directory === '.' ? '' : $directory;
        }
    }
}
