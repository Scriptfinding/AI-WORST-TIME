<?php

namespace App\Console\Commands;

use App\Models\Flow;
use App\Models\FlowRun;
use App\Services\Storage\RunArtifactMigrationService;
use App\Services\Storage\RunArtifactRecordingService;
use Illuminate\Console\Command;

class MigrateFlowArtifacts extends Command
{
    protected $signature = 'artifacts:migrate-owner-storage
        {--flow-id= : Migrate one flow database ID}
        {--chunk=100 : Number of flows or runs processed per batch}';

    protected $description = 'Move flow artifacts to current owners and seal existing recordings';

    public function handle(
        RunArtifactMigrationService $artifactMigrations,
        RunArtifactRecordingService $recordings,
    ): int {
        $chunkOption = $this->option('chunk');
        $chunk = max(1, is_numeric($chunkOption) ? (int) $chunkOption : 100);
        $flowId = $this->option('flow-id');
        $failures = 0;
        $migratedFlows = 0;
        $sealedRecordings = 0;

        $query = Flow::query()->orderBy('id');
        if (is_string($flowId) && $flowId !== '') {
            $query->whereKey($flowId);
        }

        $query->chunkById($chunk, function ($flows) use (
            $artifactMigrations,
            $recordings,
            $chunk,
            &$failures,
            &$migratedFlows,
            &$sealedRecordings,
        ): void {
            foreach ($flows as $flow) {
                /** @var Flow $flow */
                try {
                    $artifactMigrations->migrateFlowDirectoriesToCurrentOwner($flow);
                    $migratedFlows++;

                    $flow->runs()
                        ->whereIn('status', ['success', 'error', 'cancelled'])
                        ->orderBy('id')
                        ->chunkById($chunk, function ($runs) use ($flow, $recordings, &$sealedRecordings): void {
                            foreach ($runs as $run) {
                                /** @var FlowRun $run */
                                $run->setRelation('flow', $flow);
                                if ($recordings->createMarkerForExistingRun($run)) {
                                    $sealedRecordings++;
                                    if (! $run->has_recording) {
                                        $run->update(['has_recording' => true]);
                                    }
                                }
                            }
                        });
                } catch (\Throwable $exception) {
                    $failures++;
                    $this->error("Flow {$flow->id}: {$exception->getMessage()}");
                }
            }
        });

        $this->info(
            "Migrated {$migratedFlows} flows and validated or created {$sealedRecordings} recording markers."
        );

        return $failures === 0 ? self::SUCCESS : self::FAILURE;
    }
}
