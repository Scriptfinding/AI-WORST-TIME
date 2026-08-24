<?php

/*
 * Explicit proprietary scope: the paid replay recording storage branches in this file implement paid
 * Puppetflow features and are licensed under the Puppetflow Proprietary License.
 * See LICENSE_PROPRIETARY.md.
 */

namespace App\Services\Storage;

use App\Models\Flow;
use App\Models\FlowRun;
use App\Models\FlowRunArtifact;
use App\Models\User;

class RunArtifactStorage
{
    public function __construct(
        private readonly RunArtifactFilesystem $filesystem,
        private readonly RunArtifactPathResolver $paths,
        private readonly RunArtifactQueryService $queries,
        private readonly RunArtifactRecordingService $recordings,
        private readonly RunArtifactFinalizer $finalizer,
        private readonly RunArtifactDeletionService $deletions,
        private readonly RunArtifactMigrationService $migrations,
    ) {}

    public static function writerLockName(FlowRun|int|string $run): string
    {
        $id = $run instanceof FlowRun ? $run->id : $run;

        return "flow-run-artifact-writer:{$id}";
    }

    public static function flowLockName(Flow|string $flow): string
    {
        $id = $flow instanceof Flow ? $flow->id : $flow;

        return "flow-artifact-storage:{$id}";
    }

    public function userDirectory(User|string $user): string
    {
        return $this->paths->userDirectory($user);
    }

    public function flowDirectory(Flow $flow): string
    {
        return $this->paths->flowDirectory($flow);
    }

    public function runDirectory(FlowRun $run): string
    {
        return $this->paths->runDirectory($run);
    }

    public function absoluteFlowPath(Flow $flow, bool $create = true): string
    {
        return $this->paths->absoluteFlowPath($flow, $create);
    }

    public function absoluteUserPath(User|string $user, bool $create = true): string
    {
        return $this->paths->absoluteUserPath($user, $create);
    }

    public function absoluteRunPath(FlowRun $run, bool $create = true): string
    {
        return $this->paths->absoluteRunPath($run, $create);
    }

    public function recordingPath(FlowRun $run): string
    {
        return $this->paths->recordingPath($run);
    }

    public function recordingLastshotPath(FlowRun $run): string
    {
        return $this->paths->recordingLastshotPath($run);
    }

    public function recordingCompletionMarkerPath(FlowRun $run): string
    {
        return $this->paths->recordingCompletionMarkerPath($run);
    }

    public function absoluteRecordingPath(FlowRun $run, bool $create = true): string
    {
        return $this->paths->absoluteRecordingPath($run, $create);
    }

    public function absoluteRecordingLastshotPath(FlowRun $run, bool $create = true): string
    {
        return $this->paths->absoluteRecordingLastshotPath($run, $create);
    }

    public function artifactStoragePath(FlowRun $run, string $type, string $relativePath): string
    {
        return $this->paths->artifactStoragePath($run, $type, $relativePath);
    }

    public function exists(string $path): bool
    {
        return $this->queries->exists($path);
    }

    public function recordingExists(FlowRun $run): bool
    {
        return $this->queries->recordingExists($run);
    }

    public function recordingLastshotExists(FlowRun $run): bool
    {
        return $this->queries->recordingLastshotExists($run);
    }

    public function cleanupIncompleteRecording(FlowRun $run): void
    {
        $this->recordings->cleanupIncompleteRecording($run);
    }

    public function put(string $path, string $contents): void
    {
        $this->filesystem->workspace()->put($this->filesystem->normalizePath($path), $contents);
    }

    /** @return list<array{name: string, size: int, modified_at: string}> */
    public function artifactFiles(FlowRun $run, string $type): array
    {
        return $this->queries->artifactFiles($run, $type);
    }

    public function artifactAbsolutePath(FlowRun $run, string $type, string $filename): ?string
    {
        return $this->queries->artifactAbsolutePath($run, $type, $filename);
    }

    public function artifact(FlowRun $run, string $type, string $relativePath): ?FlowRunArtifact
    {
        return $this->queries->artifact($run, $type, $relativePath);
    }

    public function recordingArtifact(FlowRun $run): ?FlowRunArtifact
    {
        return $this->queries->recordingArtifact($run);
    }

    public function recordingLastshotArtifact(FlowRun $run): ?FlowRunArtifact
    {
        return $this->queries->recordingLastshotArtifact($run);
    }

    /** @return array{screenshots_count: int, downloads_count: int, has_recording: bool} */
    public function finalizeRun(FlowRun $run, ?string $diskName = null): array
    {
        return $this->finalizer->finalizeRun($run, $diskName);
    }

    public function migrateArtifact(
        FlowRunArtifact $artifact,
        string $targetDiskName,
        bool $deleteSource = true,
    ): void {
        $this->migrations->migrateArtifact($artifact, $targetDiskName, $deleteSource);
    }

    /** @return array{screenshots_count: int, downloads_count: int, has_recording: bool} */
    public function workspaceSummary(FlowRun $run): array
    {
        return $this->finalizer->workspaceSummary($run);
    }

    public function workspaceArtifactCount(FlowRun $run): int
    {
        return $this->finalizer->workspaceArtifactCount($run);
    }

    public function diskUsesWorkspace(string $disk): bool
    {
        return $this->filesystem->disksShareLocalRoot(
            $this->filesystem->configuredDiskName($disk),
            RunArtifactFilesystem::WORKSPACE_DISK,
        );
    }

    public function deleteRun(FlowRun $run): void
    {
        $this->deletions->deleteRun($run);
    }

    /** @param iterable<array{disk: string, storage_path: string}> $locations */
    public function deleteStoredArtifactLocations(iterable $locations): void
    {
        $this->deletions->deleteStoredArtifactLocations($locations);
    }

    public function deleteFlow(Flow $flow): void
    {
        $this->deletions->deleteFlow($flow);
    }

    public function deleteUser(User $user): void
    {
        $this->deletions->deleteUser($user);
    }

    public function deleteFlowDirectory(Flow $flow, string $directory): void
    {
        $this->deletions->deleteFlowDirectory($flow, $directory);
    }

    public function moveFlowToOwner(Flow $flow, string $fromOwnerId, string $toOwnerId): bool
    {
        return $this->migrations->moveFlowToOwner($flow, $fromOwnerId, $toOwnerId);
    }

    public function migrateFlowDirectoriesToCurrentOwner(Flow $flow): void
    {
        $this->migrations->migrateFlowDirectoriesToCurrentOwner($flow);
    }

    public function createRecordingMarkerForExistingRun(FlowRun $run): bool
    {
        return $this->recordings->createMarkerForExistingRun($run);
    }
}
