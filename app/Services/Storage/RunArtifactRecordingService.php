<?php

/*
 * Explicit proprietary scope: the paid replay recording storage branches in this file implement paid
 * Puppetflow features and are licensed under the Puppetflow Proprietary License.
 * See LICENSE_PROPRIETARY.md.
 */

namespace App\Services\Storage;

use App\Models\FlowRun;

class RunArtifactRecordingService
{
    private const MINIMUM_RECORDING_BYTES = 1024;

    public function __construct(
        private readonly RunArtifactFilesystem $filesystem,
        private readonly RunArtifactPathResolver $paths,
    ) {}

    public function workspaceRecordingExists(FlowRun $run): bool
    {
        $recordingPath = $this->paths->recordingPath($run);
        if (
            ! $this->hasMinimumSize($recordingPath, self::MINIMUM_RECORDING_BYTES + 1)
            || ! $this->hasMp4FileSignature($recordingPath)
        ) {
            return false;
        }

        $markerPath = $this->paths->recordingCompletionMarkerPath($run);

        return $this->filesystem->workspace()->exists($markerPath)
            && $this->validateMarker($recordingPath, $markerPath);
    }

    public function cleanupIncompleteRecording(FlowRun $run): void
    {
        $disk = $this->filesystem->workspace();
        $disk->delete($this->paths->recordingPath($run).'.part');
        if (! $this->workspaceRecordingExists($run)) {
            $disk->delete([
                $this->paths->recordingPath($run),
                $this->paths->recordingLastshotPath($run),
                $this->paths->recordingCompletionMarkerPath($run),
            ]);
        }
    }

    public function createMarkerForExistingRun(FlowRun $run): bool
    {
        $recordingPath = $this->paths->recordingPath($run);
        $markerPath = $this->paths->recordingCompletionMarkerPath($run);
        if ($this->filesystem->workspace()->exists($markerPath) && $this->validateMarker($recordingPath, $markerPath)) {
            return true;
        }
        if (
            ! in_array($run->status, ['success', 'error', 'cancelled'], true)
            || ! $this->hasMinimumSize($recordingPath, self::MINIMUM_RECORDING_BYTES + 1)
            || ! $this->hasMp4FileSignature($recordingPath)
        ) {
            return false;
        }

        $this->filesystem->workspace()->delete($markerPath);

        return $this->writeMarker($recordingPath, $markerPath);
    }

    public function hasMinimumSize(string $path, int $minimumBytes): bool
    {
        $path = $this->filesystem->normalizePath($path);
        try {
            return $this->filesystem->workspace()->exists($path)
                && $this->filesystem->workspace()->size($path) >= $minimumBytes;
        } catch (\Throwable) {
            return false;
        }
    }

    private function validateMarker(string $recordingPath, string $markerPath): bool
    {
        try {
            $disk = $this->filesystem->workspace();
            $rawMarker = $disk->get($markerPath);
            if (! is_string($rawMarker)) {
                return false;
            }
            $marker = json_decode($rawMarker, true, 512, JSON_THROW_ON_ERROR);
            if (! is_array($marker) || array_is_list($marker)) {
                return false;
            }

            $actualSize = $disk->size($recordingPath);
            $markedSize = $marker['size'] ?? null;
            $markedHash = $marker['sha256'] ?? null;
            if (
                ! is_int($markedSize)
                || $markedSize !== $actualSize
                || ! is_string($markedHash)
                || preg_match('/^[a-f0-9]{64}$/', $markedHash) !== 1
            ) {
                return false;
            }
            $actualHash = hash_file('sha256', $disk->path($recordingPath));

            return is_string($actualHash) && hash_equals($markedHash, $actualHash);
        } catch (\Throwable) {
            return false;
        }
    }

    private function writeMarker(string $recordingPath, string $markerPath): bool
    {
        $temporaryMarkerPath = $markerPath.'.part-'.bin2hex(random_bytes(8));
        $disk = $this->filesystem->workspace();
        try {
            $hash = hash_file('sha256', $disk->path($recordingPath));
            if (! is_string($hash)) {
                return false;
            }
            $contents = json_encode([
                'size' => $disk->size($recordingPath),
                'sha256' => $hash,
                'completed_at' => now()->toISOString(),
            ], JSON_THROW_ON_ERROR);
            $disk->put($temporaryMarkerPath, $contents);
            if (! @rename($disk->path($temporaryMarkerPath), $disk->path($markerPath))) {
                return false;
            }

            return true;
        } catch (\Throwable) {
            return false;
        } finally {
            try {
                $disk->delete($temporaryMarkerPath);
            } catch (\Throwable) {
                // The marker write already failed or completed atomically.
            }
        }
    }

    private function hasMp4FileSignature(string $path): bool
    {
        $path = $this->filesystem->normalizePath($path);
        try {
            $disk = $this->filesystem->workspace();
            if (! $disk->exists($path)) {
                return false;
            }
            $handle = fopen($disk->path($path), 'rb');
            if ($handle === false) {
                return false;
            }
            try {
                $stat = fstat($handle);
                $fileSize = is_array($stat) ? $stat['size'] : 0;
                if ($fileSize <= self::MINIMUM_RECORDING_BYTES) {
                    return false;
                }
                $types = [];
                $offset = 0;
                $boxes = 0;
                while ($offset + 8 <= $fileSize && $boxes < 10000) {
                    if (fseek($handle, $offset) !== 0) {
                        return false;
                    }
                    $header = fread($handle, 8);
                    if (! is_string($header) || strlen($header) !== 8) {
                        return false;
                    }
                    $box = unpack('Nsize/a4type', $header);
                    if (! is_array($box) || ! is_int($box['size'] ?? null) || ! is_string($box['type'] ?? null)) {
                        return false;
                    }
                    $boxSize = $box['size'];
                    $headerSize = 8;
                    if ($boxSize === 1) {
                        $extended = fread($handle, 8);
                        if (! is_string($extended) || strlen($extended) !== 8) {
                            return false;
                        }
                        $parts = unpack('Nhigh/Nlow', $extended);
                        if (! is_array($parts) || ! is_int($parts['high'] ?? null) || ! is_int($parts['low'] ?? null)) {
                            return false;
                        }
                        if ($parts['high'] > (PHP_INT_MAX >> 32)) {
                            return false;
                        }
                        $boxSize = ($parts['high'] << 32) | $parts['low'];
                        $headerSize = 16;
                    } elseif ($boxSize === 0) {
                        $boxSize = $fileSize - $offset;
                    }
                    if ($boxSize < $headerSize || $offset + $boxSize > $fileSize) {
                        return false;
                    }
                    if ($offset === 0 && $box['type'] !== 'ftyp') {
                        return false;
                    }
                    $types[$box['type']] = true;
                    $offset += $boxSize;
                    $boxes++;
                }

                return $offset === $fileSize && isset($types['ftyp'], $types['moov'], $types['mdat']);
            } finally {
                fclose($handle);
            }
        } catch (\Throwable) {
            return false;
        }
    }
}
