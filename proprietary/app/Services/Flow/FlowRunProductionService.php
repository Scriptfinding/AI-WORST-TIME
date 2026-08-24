<?php

namespace App\Services\Flow;

use App\Exceptions\FeatureFlags\RunQuotaExceededException;
use App\Models\Flow;
use App\Models\FlowRun;
use App\Services\FeatureFlags\RunCycleService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

final class FlowRunProductionService
{
    public function __construct(
        private FlowManualRunScoringService $manualRunScoring,
        private RunCycleService $runCycle,
    ) {}

    public function decide(Flow $flow, string $triggerType): ProductionRunDecision
    {
        $score = (int) $flow->manual_run_score;
        $isManual = $triggerType === 'manual';
        $productionMode = $isManual
            ? (bool) $flow->manual_run_production_mode
            : true;
        $isPublished = (bool) $flow->is_published;
        $reasons = ! $isManual
            ? ['automated_trigger']
            : ($isPublished
                ? ['published_flow']
                : [$productionMode ? 'manual_production_usage' : 'manual_development_usage']);

        return new ProductionRunDecision(
            isProduction: true,
            score: $score,
            productionMode: $productionMode,
            ruleset: FlowManualRunScoringService::RULESET_VERSION,
            reasons: $reasons,
            isManual: $isManual,
        );
    }

    public function reserve(ProductionRunDecision $decision, string $triggerType): void
    {
        if (! $decision->isProduction) {
            return;
        }

        $cycle = $this->runCycle->reserve();
        if ($cycle === null) {
            return;
        }
        if ($cycle['reserved']) {
            Log::info('production_run_reserved', [
                'trigger_type' => $triggerType,
                'used' => $cycle['used'],
                'limit' => $cycle['limit'],
            ]);

            return;
        }

        $resetsAt = Carbon::parse($cycle['ends_at'])->toDayDateTimeString();
        Log::warning('production_run_reservation_denied', [
            'trigger_type' => $triggerType,
            'used' => $cycle['used'],
            'limit' => $cycle['limit'],
            'resets_at' => $cycle['ends_at'],
        ]);

        throw new RunQuotaExceededException(
            "Run quota reached for the current subscription cycle ({$cycle['used']}/{$cycle['limit']} runs). {$triggerType} runs resume on {$resetsAt}."
        );
    }

    public function logDispatch(Flow $flow, FlowRun $run, ProductionRunDecision $decision): void
    {
        if (! $decision->isManual || ! $decision->isProduction) {
            return;
        }

        Log::info('manual_run_classified_as_production', [
            'workspace_id' => $flow->workspace_id,
            'flow_id' => $flow->id,
            'run_id' => $run->id,
            'score' => $decision->score,
            'threshold' => FlowManualRunScoringService::ENTER_PRODUCTION_SCORE,
            'ruleset' => $decision->ruleset,
            'reasons' => $decision->reasons,
        ]);
    }

    /**
     * Finalize production usage and score a run locked by the caller.
     */
    public function handleLockedTerminalRun(FlowRun $persistedRun, ?FlowRun $mirror = null): void
    {
        if ($this->runCycle->releaseCancelledRun($persistedRun)) {
            Log::info('cancelled_production_run_released', [
                'flow_id' => $persistedRun->flow_id,
                'run_id' => $persistedRun->id,
            ]);
        }

        try {
            $this->score($persistedRun, $mirror);
        } catch (\Throwable $exception) {
            $this->logScoringFailure($persistedRun, $exception);
        }
    }

    /**
     * Lock and handle a terminal run independently.
     */
    public function handleTerminalRun(FlowRun $run): void
    {
        try {
            DB::transaction(function () use ($run): void {
                $persistedRun = FlowRun::query()
                    ->whereKey($run->getKey())
                    ->lockForUpdate()
                    ->first();
                if (! $persistedRun instanceof FlowRun) {
                    return;
                }

                $this->handleLockedTerminalRun($persistedRun, $run);
            }, 3);
        } catch (\Throwable $exception) {
            Log::warning('production_run_terminal_handling_failed', [
                'flow_id' => $run->flow_id,
                'run_id' => $run->id,
                'trigger_type' => $run->trigger_type,
                'error' => $exception->getMessage(),
            ]);
        }
    }

    private function score(FlowRun $persistedRun, ?FlowRun $mirror): void
    {
        $audit = $this->manualRunScoring->scoreTerminalRun($persistedRun);
        if ($audit !== null && $mirror instanceof FlowRun) {
            $mirror->forceFill(['manual_run_score_audit' => $audit]);
        }
    }

    private function logScoringFailure(FlowRun $run, \Throwable $exception): void
    {
        Log::warning('manual_run_scoring_failed', [
            'flow_id' => $run->flow_id,
            'run_id' => $run->id,
            'trigger_type' => $run->trigger_type,
            'error' => $exception->getMessage(),
            'fail_open' => true,
        ]);
    }
}
