<?php

namespace App\Services\Storage;

use App\Jobs\DeleteStoredFiles;
use App\Models\Flow;
use App\Models\FlowRun;
use App\Models\StorageDeletion;
use App\Models\User;

class RunArtifactDeletionService
{
    public function __construct(
        private readonly RunArtifactFilesystem $filesystem,
        private readonly RunArtifactPathResolver $paths,
    ) {}

    public function deleteRun(FlowRun $run): void
    {
        $flowDirectory = $this->paths->flowDirectory($this->paths->flowFor($run));
        $runDirectory = $flowDirectory.'/'.FlowRun::splitIdPath($run->id).'/run';
        $this->filesystem->workspace()->deleteDirectory($runDirectory);
        $this->filesystem->pruneEmptyParents(dirname($runDirectory), $flowDirectory.'/runs');
    }

    /** @param iterable<array{disk: string, storage_path: string}> $locations */
    public function deleteStoredArtifactLocations(iterable $locations): void
    {
        foreach ($locations as $location) {
            $this->filesystem->disk($location['disk'])->delete($location['storage_path']);
        }
    }

    public function deleteFlow(Flow $flow): void
    {
        $directory = $this->paths->flowDirectory($flow);
        $this->filesystem->workspace()->deleteDirectory($directory);
        $this->filesystem->pruneEmptyParents(dirname($directory), '');
    }

    public function deleteUser(User $user): void
    {
        $directory = $this->paths->userDirectory($user);
        $this->filesystem->workspace()->deleteDirectory($directory);
        $this->filesystem->pruneEmptyParents(dirname($directory), '');
    }

    public function deleteFlowDirectory(Flow $flow, string $directory): void
    {
        $this->filesystem->workspace()->deleteDirectory(
            $this->paths->flowDirectory($flow).'/'.$this->filesystem->normalizePath($directory),
        );
    }

    public function stage(string $disk, string $path): int
    {
        $deletion = StorageDeletion::query()->create([
            'disk' => $disk,
            'storage_path' => $path,
        ]);

        return (int) $deletion->id;
    }

    /** @param list<int> $deletionIds */
    public function dispatch(array $deletionIds): void
    {
        if ($deletionIds === []) {
            return;
        }
        try {
            DeleteStoredFiles::dispatch($deletionIds);
        } catch (\Throwable $exception) {
            report($exception);
        }
    }
}
