<?php

/*
 * Explicit proprietary scope: the paid replay recording storage branches in this file implement paid
 * Puppetflow features and are licensed under the Puppetflow Proprietary License.
 * See LICENSE_PROPRIETARY.md.
 */

namespace App\Services\Storage;

use App\Models\FlowRun;
use App\Models\FlowRunArtifact;

class RunArtifactQueryService
{
    public function __construct(
        private readonly RunArtifactFilesystem $filesystem,
        private readonly RunArtifactPathResolver $paths,
        private readonly RunArtifactRecordingService $recordings,
    ) {}

    public function exists(string $path): bool
    {
        return $this->filesystem->workspace()->exists($this->filesystem->normalizePath($path));
    }

    public function recordingExists(FlowRun $run): bool
    {
        if ($this->hasManifest($run)) {
            return $this->recordingArtifact($run) !== null;
        }

        return $this->recordings->workspaceRecordingExists($run);
    }

    public function recordingLastshotExists(FlowRun $run): bool
    {
        if ($this->hasManifest($run)) {
            return $this->recordingLastshotArtifact($run) !== null;
        }

        return $this->recordings->workspaceRecordingExists($run)
            && $this->recordings->hasMinimumSize($this->paths->recordingLastshotPath($run), 1);
    }

    /** @return list<array{name: string, size: int, modified_at: string}> */
    public function artifactFiles(FlowRun $run, string $type): array
    {
        $type = $this->filesystem->normalizeSegment($type);
        if ($this->hasManifest($run)) {
            return array_values($run->artifacts()
                ->where('type', $type)
                ->where('status', FlowRunArtifact::STATUS_READY)
                ->orderBy('relative_path')
                ->get()
                ->map(static fn (FlowRunArtifact $artifact): array => [
                    'name' => $artifact->relative_path,
                    'size' => $artifact->size_bytes,
                    'modified_at' => $artifact->updated_at?->format('Y-m-d H:i:s') ?? '',
                ])
                ->all());
        }

        $directory = $this->paths->runDirectory($run).'/'.$type;
        $prefix = $directory.'/';
        $files = [];
        foreach ($this->filesystem->workspace()->allFiles($directory) as $path) {
            if (! str_starts_with($path, $prefix)) {
                continue;
            }
            $files[] = [
                'name' => substr($path, strlen($prefix)),
                'size' => $this->filesystem->workspace()->size($path),
                'modified_at' => date('Y-m-d H:i:s', $this->filesystem->workspace()->lastModified($path)),
            ];
        }
        usort($files, fn (array $left, array $right): int => strcmp($left['name'], $right['name']));

        return $files;
    }

    public function artifactAbsolutePath(FlowRun $run, string $type, string $filename): ?string
    {
        $directory = $this->paths->runDirectory($run).'/'.$this->filesystem->normalizeSegment($type);
        try {
            $filename = $this->filesystem->normalizePath($filename);
        } catch (\InvalidArgumentException) {
            return null;
        }
        $path = $directory.'/'.$filename;
        if ($this->hasManifest($run) && $this->artifact($run, $type, $filename) === null) {
            return null;
        }
        if (! $this->filesystem->workspace()->exists($path)) {
            return null;
        }

        $basePath = realpath($this->filesystem->workspace()->path($directory));
        $artifactPath = realpath($this->filesystem->workspace()->path($path));
        if ($basePath === false || $artifactPath === false) {
            return null;
        }

        return str_starts_with($artifactPath, $basePath.DIRECTORY_SEPARATOR) ? $artifactPath : null;
    }

    public function artifact(FlowRun $run, string $type, string $relativePath): ?FlowRunArtifact
    {
        try {
            $type = $this->filesystem->normalizeSegment($type);
            $relativePath = $this->filesystem->normalizePath($relativePath);
        } catch (\InvalidArgumentException) {
            return null;
        }

        return $run->artifacts()
            ->where('type', $type)
            ->where('relative_path', $relativePath)
            ->where('status', FlowRunArtifact::STATUS_READY)
            ->first();
    }

    public function recordingArtifact(FlowRun $run): ?FlowRunArtifact
    {
        return $this->artifact($run, 'recording', 'recording.mp4');
    }

    public function recordingLastshotArtifact(FlowRun $run): ?FlowRunArtifact
    {
        return $this->artifact($run, 'recording', 'lastshot.jpg');
    }

    public function hasManifest(FlowRun $run): bool
    {
        return $run->artifacts()->exists();
    }
}
