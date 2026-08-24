<?php

namespace App\Console\Commands;

use App\Jobs\DeleteStoredFiles;
use App\Models\StorageDeletion;
use Illuminate\Console\Command;

class CleanupPendingStorage extends Command
{
    protected $signature = 'storage:cleanup-pending {--chunk=100 : Maximum deletions processed per run}';

    protected $description = 'Retry durable file deletions recorded in the storage cleanup outbox';

    public function handle(): int
    {
        $chunkOption = $this->option('chunk');
        $chunk = max(1, is_numeric($chunkOption) ? (int) $chunkOption : 100);
        $rawIds = StorageDeletion::query()
            ->orderBy('attempts')
            ->orderBy('id')
            ->limit($chunk)
            ->pluck('id')
            ->all();
        $ids = [];
        foreach ($rawIds as $id) {
            if (is_int($id) || is_string($id)) {
                $ids[] = (int) $id;
            }
        }

        if ($ids === []) {
            return self::SUCCESS;
        }

        try {
            (new DeleteStoredFiles($ids))->handle();
        } catch (\Throwable $exception) {
            $this->error($exception->getMessage());

            return self::FAILURE;
        }

        $this->info('Processed '.count($ids).' pending storage deletion(s).');

        return self::SUCCESS;
    }
}
