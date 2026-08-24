<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('flows', function (Blueprint $table) {
            $table->unsignedSmallInteger('manual_run_score')->default(0);
            $table->boolean('manual_run_production_mode')->default(false);
            $table->json('manual_run_score_state')->nullable();
            $table->timestamp('manual_run_score_updated_at')->nullable();
        });

        Schema::table('flow_runs', function (Blueprint $table) {
            $table->boolean('is_production')->default(false);
            $table->json('manual_run_score_audit')->nullable();
            $table->index(['is_production', 'created_at'], 'flow_runs_production_cycle_index');
        });

        DB::table('flow_runs')
            ->where('trigger_type', '!=', 'manual')
            ->update(['is_production' => true]);

        Schema::create('run_cycle_usages', function (Blueprint $table) {
            $table->id();
            $table->timestamp('starts_at');
            $table->timestamp('ends_at');
            $table->unsignedBigInteger('used')->default(0);
            $table->timestamps();

            $table->unique(['starts_at', 'ends_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('run_cycle_usages');

        Schema::table('flow_runs', function (Blueprint $table) {
            $table->dropIndex('flow_runs_production_cycle_index');
            $table->dropColumn(['is_production', 'manual_run_score_audit']);
        });

        Schema::table('flows', function (Blueprint $table) {
            $table->dropColumn([
                'manual_run_score',
                'manual_run_production_mode',
                'manual_run_score_state',
                'manual_run_score_updated_at',
            ]);
        });
    }
};
