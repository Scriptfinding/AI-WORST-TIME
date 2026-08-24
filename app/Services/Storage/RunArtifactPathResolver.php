<?php

namespace App\Services\Storage;

use App\Models\Flow;
use App\Models\FlowRun;
use App\Models\User;

class RunArtifactPathResolver
{
    public function __construct(
        private readonly RunArtifactFilesystem $filesystem,
    ) {}

    public function userDirectory(User|string $user): string
    {
        return User::splitIdPath($user instanceof User ? $user->id : $user);
    }

    public function flowDirectory(Flow $flow): string
    {
        return $this->flowDirectoryForOwner($flow, $flow->owner_id);
    }

    public function flowDirectoryForOwner(Flow $flow, string $ownerId): string
    {
        return $this->userDirectory($ownerId).'/'.Flow::splitIdPath($flow->id).'/flow';
    }

    public function runDirectory(FlowRun $run): string
    {
        return $this->flowDirectory($this->flowFor($run)).'/'.FlowRun::splitIdPath($run->id).'/run';
    }

    public function absoluteFlowPath(Flow $flow, bool $create = true): string
    {
        return $this->filesystem->absolutePath($this->flowDirectory($flow), $create);
    }

    public function absoluteUserPath(User|string $user, bool $create = true): string
    {
        return $this->filesystem->absolutePath($this->userDirectory($user), $create);
    }

    public function absoluteRunPath(FlowRun $run, bool $create = true): string
    {
        return $this->filesystem->absolutePath($this->runDirectory($run), $create);
    }

    public function recordingPath(FlowRun $run): string
    {
        return $this->runDirectory($run).'/recording/recording.mp4';
    }

    public function recordingLastshotPath(FlowRun $run): string
    {
        return $this->runDirectory($run).'/recording/lastshot.jpg';
    }

    public function recordingCompletionMarkerPath(FlowRun $run): string
    {
        return $this->runDirectory($run).'/.recording-complete';
    }

    public function absoluteRecordingPath(FlowRun $run, bool $create = true): string
    {
        return $this->filesystem->absolutePath($this->recordingPath($run), $create, true);
    }

    public function absoluteRecordingLastshotPath(FlowRun $run, bool $create = true): string
    {
        return $this->filesystem->absolutePath($this->recordingLastshotPath($run), $create, true);
    }

    public function artifactStoragePath(FlowRun $run, string $type, string $relativePath): string
    {
        return 'run-artifacts/'.$this->runDirectory($run)
            .'/'.$this->filesystem->normalizeSegment($type)
            .'/'.$this->filesystem->normalizePath($relativePath);
    }

    public function flowFor(FlowRun $run): Flow
    {
        $flow = $run->flow;
        if (! $flow instanceof Flow) {
            throw new \LogicException('Flow run is missing its flow.');
        }

        return $flow;
    }
}
