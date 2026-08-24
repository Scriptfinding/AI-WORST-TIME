<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Flag runs whose indexed recording artifact is ready but whose summary
     * column was never backfilled. Legacy filesystem-only recordings are
     * covered by the artifacts:migrate-owner-storage command, which seals and
     * flags them while hashing the files.
     */
    public function up(): void
    {
        DB::table('flow_runs')
            ->where('has_recording', false)
            ->whereIn('id', function ($query) {
                $query->select('flow_run_id')
                    ->from('flow_run_artifacts')
                    ->where('type', 'recording')
                    ->where('relative_path', 'recording.mp4')
                    ->where('status', 'ready');
            })
            ->update(['has_recording' => true]);
    }

    public function down(): void
    {
        // Data backfill; nothing to revert.
    }
};
