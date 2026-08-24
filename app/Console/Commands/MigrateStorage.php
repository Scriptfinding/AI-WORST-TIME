<?php

namespace App\Console\Commands;

use App\Models\Flow;
use App\Models\FlowRun;
use App\Models\FlowRunArtifact;
use App\Models\Setting;
use App\Models\StoredUpload;
use App\Models\User;
use App\Models\Workspace;
use App\Services\Storage\RunArtifactStorage;
use App\Services\Storage\UploadStorage;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class MigrateStorage extends Command
{
    protected $signature = 'storage:migrate
        {--from=puppetflow-local : Source Laravel filesystem disk}
        {--to=puppetflow-s3 : Target Laravel filesystem disk}
        {--flow-id= : Restrict migration to one flow database ID}
        {--chunk=100 : Number of runs processed per database chunk}
        {--dry-run : Report the artifacts that would be migrated}
        {--keep-source : Keep source objects after verified copies}';

    protected $description = 'Index and migrate artifacts and uploads between durable storage disks';

    public function handle(RunArtifactStorage $storage, UploadStorage $uploads): int
    {
        $source = (string) $this->option('from');
        $target = (string) $this->option('to');
        $chunkOption = $this->option('chunk');
        $chunk = max(1, is_numeric($chunkOption) ? (int) $chunkOption : 100);
        $flowId = $this->option('flow-id');
        $dryRun = (bool) $this->option('dry-run');
        $keepSource = (bool) $this->option('keep-source');

        $allowed = ['puppetflow-local', 'puppetflow-s3', 'puppetflow-r2'];
        if (! in_array($source, $allowed, true) || ! in_array($target, $allowed, true) || $source === $target) {
            $this->error('Source and target must be different configured Puppetflow storage disks.');

            return self::FAILURE;
        }

        $artifactCount = 0;
        $uploadCount = 0;
        $failures = 0;
        $query = FlowRun::query()
            ->with('flow')
            ->whereIn('status', ['success', 'error', 'cancelled'])
            ->orderBy('id');
        if (is_string($flowId) && $flowId !== '') {
            $query->where('flow_id', $flowId);
        }

        $query->chunkById($chunk, function ($runs) use (
            $storage,
            $source,
            $target,
            $dryRun,
            $keepSource,
            &$artifactCount,
            &$failures,
        ): void {
            foreach ($runs as $run) {
                /** @var FlowRun $run */
                try {
                    $flowLockResult = Cache::lock(RunArtifactStorage::flowLockName($run->flow_id), 300)->block(
                        30,
                        function () use ($run, $storage, $source, $target, $dryRun, $keepSource): int {
                            $runLockResult = Cache::lock(
                                RunArtifactStorage::writerLockName($run),
                                300,
                            )->block(
                                30,
                                fn (): int => $this->migrateRun(
                                    $run,
                                    $storage,
                                    $source,
                                    $target,
                                    $dryRun,
                                    $keepSource,
                                ),
                            );
                            if (! is_int($runLockResult)) {
                                throw new \LogicException('Artifact migration lock returned an invalid result.');
                            }

                            return $runLockResult;
                        },
                    );
                    if (! is_int($flowLockResult)) {
                        throw new \LogicException('Flow artifact lock returned an invalid result.');
                    }
                    $artifactCount += $flowLockResult;
                } catch (\Throwable $exception) {
                    $failures++;
                    $this->error("Run {$run->id}: {$exception->getMessage()}");
                }
            }
        });

        $rawUploadPaths = [
            ...$this->referencedUploadPaths(),
            ...StoredUpload::query()->where('disk', $source)->pluck('path')->all(),
        ];
        /** @var list<string> $uploadPaths */
        $uploadPaths = array_values(array_unique(array_filter(
            $rawUploadPaths,
            static fn (mixed $path): bool => is_string($path) && $path !== '',
        )));
        foreach ($uploadPaths as $path) {
            try {
                $upload = StoredUpload::query()->where('path', $path)->first();
                if ($upload === null && $source === 'puppetflow-local') {
                    if ($dryRun) {
                        if ($uploads->localSourceExists($path)) {
                            $uploadCount++;
                        }

                        continue;
                    }
                    $upload = $uploads->indexLocal($path, $source);
                }
                if ($upload === null || $upload->disk !== $source) {
                    continue;
                }
                $uploadCount++;
                if (! $dryRun) {
                    $uploads->migrate($upload, $target, ! $keepSource);
                }
            } catch (\Throwable $exception) {
                $failures++;
                $this->error("Upload {$path}: {$exception->getMessage()}");
            }
        }

        $verb = $dryRun ? 'Would migrate' : 'Migrated';
        $this->info("{$verb} {$artifactCount} artifact(s) and {$uploadCount} upload(s) from {$source} to {$target}.");

        return $failures === 0 ? self::SUCCESS : self::FAILURE;
    }

    private function migrateRun(
        FlowRun $run,
        RunArtifactStorage $storage,
        string $source,
        string $target,
        bool $dryRun,
        bool $keepSource,
    ): int {
        $sourceArtifacts = $run->artifacts()
            ->where('disk', $source)
            ->where('status', FlowRunArtifact::STATUS_READY)
            ->orderBy('id')
            ->get();
        $workspaceCount = $source === 'puppetflow-local'
            ? $storage->workspaceArtifactCount($run)
            : 0;

        if ($dryRun) {
            return max($sourceArtifacts->count(), $workspaceCount);
        }

        if ($workspaceCount > 0) {
            $storage->finalizeRun($run, $source);
            $sourceArtifacts = $run->artifacts()
                ->where('disk', $source)
                ->where('status', FlowRunArtifact::STATUS_READY)
                ->orderBy('id')
                ->get();
        }

        foreach ($sourceArtifacts as $artifact) {
            $storage->migrateArtifact($artifact, $target, ! $keepSource);
        }

        return $sourceArtifacts->count();
    }

    /** @return list<string> */
    private function referencedUploadPaths(): array
    {
        $brandingLogoPath = Setting::get('whitelabel_logo_path');
        $paths = [
            ...User::query()->whereNotNull('avatar_path')->pluck('avatar_path')->all(),
            ...Flow::query()->whereNotNull('icon_upload_path')->pluck('icon_upload_path')->all(),
            ...Workspace::query()->whereNotNull('icon_upload_path')->pluck('icon_upload_path')->all(),
            ...(is_string($brandingLogoPath) ? [$brandingLogoPath] : []),
        ];

        return array_values(array_unique(array_filter(
            $paths,
            static fn (mixed $path): bool => is_string($path) && $path !== '',
        )));
    }
}
