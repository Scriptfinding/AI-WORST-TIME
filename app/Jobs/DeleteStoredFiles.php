<?php

namespace App\Jobs;

use App\Models\FlowRunArtifact;
use App\Models\StorageDeletion;
use App\Models\StoredUpload;
use App\Services\Storage\StorageLocationLock;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

class DeleteStoredFiles extends InternalJob
{
    public int $tries = 5;

    /** @param list<int> $deletionIds */
    public function __construct(
        public array $deletionIds,
    ) {
        parent::__construct();
    }

    /** @return list<int> */
    public function backoff(): array
    {
        return [10, 30, 120, 300];
    }

    public function handle(): void
    {
        foreach (StorageDeletion::query()->whereKey($this->deletionIds)->orderBy('id')->get() as $deletion) {
            try {
                Cache::lock(
                    StorageLocationLock::name($deletion->disk, $deletion->storage_path),
                    120,
                )->block(30, function () use ($deletion): void {
                    $currentDeletion = StorageDeletion::query()->find($deletion->id);
                    if ($currentDeletion === null) {
                        return;
                    }
                    $isReferenced = FlowRunArtifact::query()
                        ->where('disk', $currentDeletion->disk)
                        ->where('storage_path', $currentDeletion->storage_path)
                        ->where('status', FlowRunArtifact::STATUS_READY)
                        ->exists()
                        || StoredUpload::query()
                            ->where('disk', $currentDeletion->disk)
                            ->where('storage_path', $currentDeletion->storage_path)
                            ->where('status', StoredUpload::STATUS_READY)
                            ->exists();
                    if ($isReferenced) {
                        $currentDeletion->delete();

                        return;
                    }

                    /** @var FilesystemAdapter $disk */
                    $disk = Storage::disk($currentDeletion->disk);
                    $disk->delete($currentDeletion->storage_path);
                    $currentDeletion->delete();
                });
            } catch (\Throwable $exception) {
                $deletion->increment('attempts');
                $deletion->update(['last_error' => $exception->getMessage()]);

                throw $exception;
            }
        }
    }
}
