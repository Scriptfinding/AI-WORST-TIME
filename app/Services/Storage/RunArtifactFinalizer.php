<?php

/*
 * Explicit proprietary scope: the paid replay recording storage branches in this file implement paid
 * Puppetflow features and are licensed under the Puppetflow Proprietary License.
 * See LICENSE_PROPRIETARY.md.
 */

namespace App\Services\Storage;

use App\Models\FlowRun;
use App\Models\FlowRunArtifact;
use Illuminate\Support\Facades\DB;

class RunArtifactFinalizer
{
    public function __construct(
        private readonly RunArtifactFilesystem $filesystem,
        private readonly RunArtifactPathResolver $paths,
        private readonly RunArtifactRecordingService $recordings,
        private readonly RunArtifactDeletionService $deletions,
        private readonly InstanceStorageQuotaService $quota,
    ) {}

    /**
     * @return array{screenshots_count: int, downloads_count: int, has_recording: bool}
     */
    public function finalizeRun(FlowRun $run, ?string $diskName = null): array
    {
        $files = $this->exportableFiles($run);
        $diskName ??= $this->filesystem->durableDiskName();
        $durableDisk = $this->filesystem->disk($diskName);
        // The run's writer lock is held by the caller, so one snapshot of the
        // indexed artifacts serves both the quota delta and the write loop.
        $existingArtifacts = $run->artifacts()->get()
            ->keyBy(fn (FlowRunArtifact $artifact): string => $artifact->type.'|'.$artifact->relative_path);
        $deletionIds = $this->quota->admit(
            fn (): int => $this->artifactDelta($existingArtifacts, $files),
            function () use ($run, $files, $diskName, $durableDisk, $existingArtifacts): array {
                $prepared = [];
                foreach ($files as $file) {
                    $artifact = $existingArtifacts->get($file['type'].'|'.$file['relative_path']);
                    if (! $this->filesystem->objectMatches(
                        $durableDisk,
                        $file['storage_path'],
                        $file['size_bytes'],
                        $file['checksum_sha256'],
                    )) {
                        $stream = $this->filesystem->workspace()->readStream($file['workspace_path']);
                        if (! is_resource($stream)) {
                            throw new \RuntimeException('Unable to open an artifact workspace stream.');
                        }
                        try {
                            $durableDisk->put($file['storage_path'], $stream);
                        } finally {
                            fclose($stream);
                        }
                    }
                    if (! $this->filesystem->objectMatches(
                        $durableDisk,
                        $file['storage_path'],
                        $file['size_bytes'],
                        $file['checksum_sha256'],
                    )) {
                        throw new \RuntimeException('Artifact verification failed after durable storage write.');
                    }
                    $prepared[] = [
                        'file' => $file,
                        'previous_disk' => $artifact?->disk,
                        'previous_storage_path' => $artifact?->storage_path,
                    ];
                }

                return DB::transaction(function () use ($run, $prepared, $diskName): array {
                    $deletionIds = [];
                    foreach ($prepared as $item) {
                        $file = $item['file'];
                        $run->artifacts()->updateOrCreate([
                            'type' => $file['type'],
                            'relative_path' => $file['relative_path'],
                        ], [
                            'storage_path' => $file['storage_path'],
                            'disk' => $diskName,
                            'size_bytes' => $file['size_bytes'],
                            'mime_type' => $file['mime_type'],
                            'checksum_sha256' => $file['checksum_sha256'],
                            'status' => FlowRunArtifact::STATUS_READY,
                        ]);
                        $previousDisk = $item['previous_disk'];
                        $previousStoragePath = $item['previous_storage_path'];
                        if (
                            is_string($previousDisk)
                            && $previousDisk !== ''
                            && $previousDisk !== $diskName
                            && is_string($previousStoragePath)
                            && $previousStoragePath !== ''
                            && ! $this->filesystem->disksShareLocalRoot($previousDisk, $diskName)
                        ) {
                            $deletionIds[] = $this->deletions->stage($previousDisk, $previousStoragePath);
                        }
                    }

                    return $deletionIds;
                });
            },
        );
        $this->deletions->dispatch($deletionIds);

        foreach ($files as $file) {
            $this->filesystem->workspace()->delete($file['workspace_path']);
        }
        $this->filesystem->workspace()->delete($this->paths->recordingCompletionMarkerPath($run));
        $this->filesystem->workspace()->deleteDirectory($this->paths->runDirectory($run));

        return $this->readyArtifactSummary($run);
    }

    /**
     * @return array{screenshots_count: int, downloads_count: int, has_recording: bool}
     */
    public function workspaceSummary(FlowRun $run): array
    {
        $files = $this->exportableFiles($run);

        return [
            'screenshots_count' => count(array_filter(
                $files,
                static fn (array $file): bool => $file['type'] === 'screenshots',
            )),
            'downloads_count' => count(array_filter(
                $files,
                static fn (array $file): bool => $file['type'] === 'downloads',
            )),
            'has_recording' => count(array_filter(
                $files,
                static fn (array $file): bool => $file['type'] === 'recording'
                    && $file['relative_path'] === 'recording.mp4',
            )) === 1,
        ];
    }

    public function workspaceArtifactCount(FlowRun $run): int
    {
        return count($this->exportableFiles($run));
    }

    /** @return array{screenshots_count: int, downloads_count: int, has_recording: bool} */
    public function storedSummary(FlowRun $run): array
    {
        return $this->readyArtifactSummary($run);
    }

    /** @return array{screenshots_count: int, downloads_count: int, has_recording: bool} */
    private function readyArtifactSummary(FlowRun $run): array
    {
        $summary = $run->artifacts()
            ->where('status', FlowRunArtifact::STATUS_READY)
            ->selectRaw("
                SUM(CASE WHEN type = 'screenshots' THEN 1 ELSE 0 END) AS screenshots,
                SUM(CASE WHEN type = 'downloads' THEN 1 ELSE 0 END) AS downloads,
                SUM(CASE WHEN type = 'recording' AND relative_path = 'recording.mp4' THEN 1 ELSE 0 END) AS recordings
            ")
            ->first();
        $intStat = static fn (mixed $value): int => is_numeric($value) ? (int) $value : 0;

        return [
            'screenshots_count' => $intStat($summary?->getAttribute('screenshots')),
            'downloads_count' => $intStat($summary?->getAttribute('downloads')),
            'has_recording' => $intStat($summary?->getAttribute('recordings')) > 0,
        ];
    }

    public function discardWorkspace(FlowRun $run): void
    {
        $this->filesystem->workspace()->deleteDirectory($this->paths->runDirectory($run));
    }

    /**
     * @return list<array{
     *     type: string,
     *     relative_path: string,
     *     workspace_path: string,
     *     storage_path: string,
     *     size_bytes: int,
     *     mime_type: string|null,
     *     checksum_sha256: string
     * }>
     */
    private function exportableFiles(FlowRun $run): array
    {
        $files = [];
        foreach (['screenshots', 'downloads'] as $type) {
            $directory = $this->paths->runDirectory($run).'/'.$type;
            $prefix = $directory.'/';
            foreach ($this->filesystem->workspace()->allFiles($directory) as $storagePath) {
                if (str_starts_with($storagePath, $prefix)) {
                    $files[] = $this->exportableFile(
                        $type,
                        substr($storagePath, strlen($prefix)),
                        $storagePath,
                    );
                }
            }
        }
        if ($this->recordings->workspaceRecordingExists($run)) {
            $files[] = $this->exportableFile(
                'recording',
                'recording.mp4',
                $this->paths->recordingPath($run),
            );
            if ($this->recordings->hasMinimumSize($this->paths->recordingLastshotPath($run), 1)) {
                $files[] = $this->exportableFile(
                    'recording',
                    'lastshot.jpg',
                    $this->paths->recordingLastshotPath($run),
                );
            }
        }

        return $files;
    }

    /**
     * @param  \Illuminate\Database\Eloquent\Collection<string, FlowRunArtifact>  $existingArtifacts
     * @param  list<array{type: string, relative_path: string, size_bytes: int}>  $files
     */
    private function artifactDelta($existingArtifacts, array $files): int
    {
        $delta = 0;
        foreach ($files as $file) {
            $artifact = $existingArtifacts->get($file['type'].'|'.$file['relative_path']);
            $previousSizeValue = $artifact?->status === FlowRunArtifact::STATUS_READY
                ? $artifact->size_bytes
                : null;
            $previousSize = is_numeric($previousSizeValue) ? (int) $previousSizeValue : 0;
            $delta += $file['size_bytes'] - $previousSize;
        }

        return $delta;
    }

    /**
     * @return array{
     *     type: string,
     *     relative_path: string,
     *     workspace_path: string,
     *     storage_path: string,
     *     size_bytes: int,
     *     mime_type: string|null,
     *     checksum_sha256: string
     * }
     */
    private function exportableFile(string $type, string $relativePath, string $storagePath): array
    {
        $type = $this->filesystem->normalizeSegment($type);
        $relativePath = $this->filesystem->normalizePath($relativePath);
        $storagePath = $this->filesystem->normalizePath($storagePath);
        $absolutePath = $this->filesystem->workspace()->path($storagePath);
        if (! is_file($absolutePath) || is_link($absolutePath)) {
            throw new \RuntimeException('Run artifact is not a regular workspace file.');
        }
        $size = filesize($absolutePath);
        $checksum = hash_file('sha256', $absolutePath);
        if (! is_int($size) || ! is_string($checksum)) {
            throw new \RuntimeException('Unable to inspect a run artifact workspace file.');
        }
        $mimeType = mime_content_type($absolutePath);

        return [
            'type' => $type,
            'relative_path' => $relativePath,
            'workspace_path' => $storagePath,
            'storage_path' => 'run-artifacts/'.$storagePath,
            'size_bytes' => $size,
            'mime_type' => is_string($mimeType) ? $mimeType : null,
            'checksum_sha256' => $checksum,
        ];
    }
}
