<?php

namespace App\Services\Flow;

use App\Jobs\DeleteStoredFiles;
use App\Models\Flow;
use App\Models\FlowRun;
use App\Models\FlowRunArtifact;
use App\Models\StorageDeletion;
use App\Models\User;
use App\Services\Storage\RunArtifactDeletionService;
use App\Services\Storage\RunArtifactStorage;
use Illuminate\Contracts\Cache\LockTimeoutException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ArtifactCleanupService
{
    private const TERMINAL_STATUSES = ['success', 'error', 'cancelled'];

    public function __construct(
        private readonly RunArtifactDeletionService $artifactDeletions,
    ) {}

    public function deleteRun(FlowRun $run): void
    {
        $this->deleteRuns([$run]);
    }

    /** @param iterable<FlowRun> $runs */
    public function deleteRuns(iterable $runs): void
    {
        /** @var array<int, FlowRun> $runsById */
        $runsById = [];
        foreach ($runs as $run) {
            $runsById[(int) $run->id] = $run;
        }
        ksort($runsById);
        /** @var list<FlowRun> $runList */
        $runList = array_values($runsById);
        if ($runList === []) {
            return;
        }
        $artifactsByRun = [];
        foreach ($runList as $run) {
            $run->loadMissing('artifacts');
            $artifactsByRun[(int) $run->id] = $run->artifacts->all();
        }

        try {
            $this->withWriterLocks($runList, function () use ($runList, $artifactsByRun): void {
                $ids = array_map(
                    fn (FlowRun $run): int => (int) $run->id,
                    $runList,
                );

                DB::transaction(function () use ($ids, $artifactsByRun): void {
                    /** @var \Illuminate\Database\Eloquent\Collection<int, FlowRun> $lockedRuns */
                    $lockedRuns = FlowRun::query()
                        ->whereKey($ids)
                        ->orderBy('id')
                        ->lockForUpdate()
                        ->get();

                    if ($lockedRuns->contains(
                        fn (FlowRun $run): bool => ! in_array($run->status, self::TERMINAL_STATUSES, true),
                    )) {
                        throw ValidationException::withMessages([
                            'runs' => 'Runs can only be deleted after execution has fully stopped.',
                        ]);
                    }

                    $deletionIds = [];
                    foreach ($lockedRuns as $run) {
                        $deletionIds = [
                            ...$deletionIds,
                            ...$this->stageArtifactDeletions($artifactsByRun[(int) $run->id] ?? []),
                        ];
                        $run->delete();
                    }

                    DB::afterCommit(function () use ($lockedRuns, $deletionIds): void {
                        $this->dispatchArtifactDeletions($deletionIds);
                        foreach ($lockedRuns as $run) {
                            try {
                                $this->artifactDeletions->deleteRun($run);
                            } catch (\Throwable $exception) {
                                report($exception);
                            }
                        }
                    });
                });
            });
        } catch (LockTimeoutException) {
            throw ValidationException::withMessages([
                'runs' => 'Run artifacts are still being finalized. Try deleting them again shortly.',
            ]);
        }
    }

    public function deleteAllRuns(Flow $flow): int
    {
        /** @var \Illuminate\Database\Eloquent\Collection<int, FlowRun> $runs */
        $runs = FlowRun::query()
            ->where('flow_id', $flow->id)
            ->whereIn('status', self::TERMINAL_STATUSES)
            ->get();

        $this->deleteRuns($runs);

        return $runs->count();
    }

    /** @param iterable<FlowRun> $runs */
    public function deleteFlowArtifacts(Flow $flow, iterable $runs = []): void
    {
        $runs = $this->normalizeRuns($runs);
        foreach ($runs as $run) {
            $run->loadMissing('artifacts');
        }
        $this->withWriterLocks($runs, function () use ($flow): void {
            $this->artifactDeletions->deleteFlow($flow);
        });
    }

    /** @param iterable<FlowRun> $runs */
    public function deleteUserArtifacts(User $user, iterable $runs = []): void
    {
        $runs = $this->normalizeRuns($runs);
        foreach ($runs as $run) {
            $run->loadMissing('artifacts');
        }
        $this->withWriterLocks($runs, function () use ($user): void {
            $this->artifactDeletions->deleteUser($user);
        });
    }

    /**
     * @param  list<FlowRun>  $runs
     * @param  \Closure(): void  $callback
     */
    private function withWriterLocks(array $runs, \Closure $callback): void
    {
        $locks = [];

        try {
            foreach ($runs as $run) {
                $lock = Cache::lock(RunArtifactStorage::writerLockName($run), 300);
                $lock->block(5);
                $locks[] = $lock;
            }

            $callback();
        } finally {
            foreach (array_reverse($locks) as $lock) {
                $lock->release();
            }
        }
    }

    /**
     * @param  iterable<FlowRun>  $runs
     * @return list<FlowRun>
     */
    private function normalizeRuns(iterable $runs): array
    {
        /** @var array<int, FlowRun> $runsById */
        $runsById = [];
        foreach ($runs as $run) {
            $runsById[(int) $run->id] = $run;
        }
        ksort($runsById);

        return array_values($runsById);
    }

    /**
     * @param  iterable<FlowRunArtifact>  $artifacts
     * @return list<int>
     */
    public function stageArtifactDeletions(iterable $artifacts): array
    {
        $ids = [];
        foreach ($artifacts as $artifact) {
            if ($artifact->disk !== '' && $artifact->storage_path !== '') {
                $deletion = StorageDeletion::query()->create([
                    'disk' => $artifact->disk,
                    'storage_path' => $artifact->storage_path,
                ]);
                $ids[] = (int) $deletion->id;
            }
        }

        return $ids;
    }

    /** @param list<int> $deletionIds */
    public function dispatchArtifactDeletions(array $deletionIds): void
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
