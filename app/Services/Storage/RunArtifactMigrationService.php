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
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RunArtifactMigrationService
{
    private const OWNER_MIGRATION_MARKER = '.owner-storage-current';

    private const OWNER_MIGRATION_PROGRESS = '.owner-storage-current-progress';

    private const OWNER_DISCOVERY_LIMIT = 10000;

    private const OWNER_FORCE_DISCOVERY_LIMIT = 100000;

    public function __construct(
        private readonly RunArtifactFilesystem $filesystem,
        private readonly RunArtifactPathResolver $paths,
        private readonly RunArtifactDeletionService $deletions,
    ) {}

    public function migrateArtifact(
        FlowRunArtifact $artifact,
        string $targetDiskName,
        bool $deleteSource = true,
    ): void {
        $targetDiskName = $this->filesystem->configuredDiskName($targetDiskName);
        if ($artifact->disk === $targetDiskName) {
            return;
        }
        Cache::lock(StorageLocationLock::name($targetDiskName, $artifact->storage_path), 300)->block(
            30,
            fn () => $this->migrateArtifactLocked($artifact, $targetDiskName, $deleteSource),
        );
    }

    public function moveFlowToOwner(Flow $flow, string $fromOwnerId, string $toOwnerId): bool
    {
        if ($flow->runs()->whereIn('status', ['pending', 'running'])->exists()) {
            throw ValidationException::withMessages([
                'owner_id' => 'Flow ownership cannot be transferred while a run is active.',
            ]);
        }

        $source = $this->paths->flowDirectoryForOwner($flow, $fromOwnerId);
        $destination = $this->paths->flowDirectoryForOwner($flow, $toOwnerId);
        $disk = $this->filesystem->workspace();
        if ($source === $destination || ! $disk->directoryExists($source)) {
            return false;
        }
        if ($disk->directoryExists($destination)) {
            throw new \RuntimeException('Unable to move flow artifacts because the destination already exists.');
        }
        $disk->makeDirectory(dirname($destination));
        if (! @rename($disk->path($source), $disk->path($destination))) {
            throw new \RuntimeException('Unable to move flow artifacts to the new owner.');
        }
        $this->filesystem->pruneEmptyParents(dirname($source), '');

        return true;
    }

    public function migrateFlowDirectoriesToCurrentOwner(Flow $flow): void
    {
        $flowId = $flow->id;
        $marker = $this->paths->flowDirectoryForOwner($flow, $flow->owner_id).'/'.self::OWNER_MIGRATION_MARKER;
        if ($this->filesystem->workspace()->exists($marker)) {
            return;
        }
        Cache::lock("flow-artifact-migration:{$flowId}", 300)->block(
            30,
            fn () => $this->performOwnerMigration($flow),
        );
    }

    private function migrateArtifactLocked(
        FlowRunArtifact $artifact,
        string $targetDiskName,
        bool $deleteSource,
    ): void {
        $sourceDisk = $this->filesystem->disk($artifact->disk);
        $targetDisk = $this->filesystem->disk($targetDiskName);
        $stream = $sourceDisk->readStream($artifact->storage_path);
        if (! is_resource($stream)) {
            throw new \RuntimeException("Unable to read artifact {$artifact->id} from {$artifact->disk}.");
        }
        try {
            $targetDisk->put($artifact->storage_path, $stream);
        } finally {
            fclose($stream);
        }
        $checksum = $artifact->checksum_sha256;
        if (
            ! is_string($checksum)
            || ! $this->filesystem->objectMatches(
                $targetDisk,
                $artifact->storage_path,
                $artifact->size_bytes,
                $checksum,
            )
        ) {
            $targetDisk->delete($artifact->storage_path);
            throw new \RuntimeException("Artifact {$artifact->id} failed target storage verification.");
        }

        $sourceDiskName = $artifact->disk;
        $deletionIds = DB::transaction(function () use (
            $artifact,
            $targetDiskName,
            $sourceDiskName,
            $deleteSource,
        ): array {
            $artifact->update([
                'disk' => $targetDiskName,
                'status' => FlowRunArtifact::STATUS_READY,
            ]);
            if ($deleteSource && ! $this->filesystem->disksShareLocalRoot($sourceDiskName, $targetDiskName)) {
                return [$this->deletions->stage($sourceDiskName, $artifact->storage_path)];
            }

            return [];
        });
        $this->deletions->dispatch($deletionIds);
    }

    private function performOwnerMigration(Flow $flow): void
    {
        $destination = $this->paths->flowDirectoryForOwner($flow, $flow->owner_id);
        $marker = $destination.'/'.self::OWNER_MIGRATION_MARKER;
        $progressPath = $destination.'/'.self::OWNER_MIGRATION_PROGRESS;
        $disk = $this->filesystem->workspace();
        if ($disk->exists($marker)) {
            return;
        }
        if ($flow->runs()->whereIn('status', ['pending', 'running'])->exists()) {
            throw new \RuntimeException("Flow {$flow->id} has active runs.");
        }

        $afterUserId = $disk->exists($progressPath) ? trim((string) $disk->get($progressPath)) : '';
        $scannedUsers = 0;
        do {
            $discovery = $this->ownerCandidates($flow, $afterUserId);
            foreach ($discovery['owner_ids'] as $ownerId) {
                if ($ownerId === $flow->owner_id) {
                    continue;
                }
                $source = $this->paths->flowDirectoryForOwner($flow, $ownerId);
                if (! $disk->directoryExists($source)) {
                    continue;
                }
                $this->mergeArtifactDirectory($disk->path($source), $disk->path($destination));
                $this->filesystem->pruneEmptyParents(dirname($source), '');
            }
            if ($discovery['complete']) {
                $disk->put($marker, (string) now()->getTimestamp());
                $disk->delete($progressPath);
                break;
            }
            $afterUserId = $discovery['last_user_id'];
            $scannedUsers += $discovery['scanned_users'];
            $disk->put($progressPath, (string) $afterUserId);
            if ($scannedUsers >= self::OWNER_FORCE_DISCOVERY_LIMIT) {
                throw new \RuntimeException('Flow artifact owner discovery exceeded its safety limit.');
            }
        } while (true);
    }

    /** @return array{owner_ids: list<string>, last_user_id: string, scanned_users: int, complete: bool} */
    private function ownerCandidates(Flow $flow, string $afterUserId): array
    {
        /** @var array<string, true> $candidateIds */
        $candidateIds = [$flow->owner_id => true];
        $add = function (iterable $ids) use (&$candidateIds): void {
            foreach ($ids as $id) {
                if (count($candidateIds) >= self::OWNER_DISCOVERY_LIMIT) {
                    break;
                }
                if (is_string($id)) {
                    $candidateIds[$id] = true;
                }
            }
        };
        $add(DB::table('user_workspace')
            ->where('workspace_id', $flow->workspace_id)
            ->limit((int) floor(self::OWNER_DISCOVERY_LIMIT / 4))
            ->pluck('user_id'));
        $add(FlowRun::query()
            ->where('flow_id', $flow->id)
            ->whereNotNull('triggered_by')
            ->distinct()
            ->limit((int) floor(self::OWNER_DISCOVERY_LIMIT / 4))
            ->pluck('triggered_by'));
        $globalLimit = max(1, self::OWNER_DISCOVERY_LIMIT - count($candidateIds));
        $globalIds = User::query()
            ->where('id', '>', $afterUserId)
            ->orderBy('id')
            ->limit($globalLimit)
            ->pluck('id');
        $add($globalIds);
        $lastGlobalId = $globalIds->last();

        return [
            'owner_ids' => array_keys($candidateIds),
            'last_user_id' => is_string($lastGlobalId) ? $lastGlobalId : $afterUserId,
            'scanned_users' => $globalIds->count(),
            'complete' => $globalIds->count() < $globalLimit,
        ];
    }

    private function mergeArtifactDirectory(string $source, string $destination): void
    {
        if (! is_dir($destination) && ! mkdir($destination, 0770, true) && ! is_dir($destination)) {
            throw new \RuntimeException('Unable to create the migrated flow artifact directory.');
        }
        foreach (new \FilesystemIterator($source, \FilesystemIterator::SKIP_DOTS) as $entry) {
            if (! $entry instanceof \SplFileInfo) {
                continue;
            }
            $sourcePath = $entry->getPathname();
            $destinationPath = $destination.DIRECTORY_SEPARATOR.$entry->getFilename();
            if ($entry->isLink()) {
                throw new \RuntimeException('Flow artifacts contain a symbolic link.');
            }
            if ($entry->isDir()) {
                if (is_file($destinationPath)) {
                    throw new \RuntimeException('Unable to merge conflicting flow artifact paths.');
                }
                $this->mergeArtifactDirectory($sourcePath, $destinationPath);

                continue;
            }
            if (is_dir($destinationPath)) {
                throw new \RuntimeException('Unable to merge conflicting flow artifact paths.');
            }
            if (is_file($destinationPath)) {
                if ($entry->getMTime() <= (int) filemtime($destinationPath)) {
                    if (! unlink($sourcePath)) {
                        throw new \RuntimeException('Unable to remove a duplicate flow artifact.');
                    }

                    continue;
                }
                if (! unlink($destinationPath)) {
                    throw new \RuntimeException('Unable to replace an older flow artifact.');
                }
            }
            if (! rename($sourcePath, $destinationPath)) {
                throw new \RuntimeException('Unable to migrate a flow artifact.');
            }
        }
        if (! rmdir($source)) {
            throw new \RuntimeException('Unable to remove a migrated flow artifact directory.');
        }
    }
}
