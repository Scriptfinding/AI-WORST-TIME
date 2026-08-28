<?php

/*
 * Explicit proprietary scope: licensed terminal run accounting and replay finalization implement paid Puppetflow
 * features and are licensed under the Puppetflow Proprietary License. See LICENSE_PROPRIETARY.md.
 */

namespace App\Services\Flow;

use App\Exceptions\InstanceStorageQuotaExceededException;
use App\Models\Flow;
use App\Models\FlowRun;
use App\Services\FeatureFlags\FeatureFlagService;
use App\Services\Flow\Action\ActionDispatcherService;
use App\Services\Mailbox\MailboxRunQueueService;
use App\Services\Runtime\RunnerSignalService;
use App\Services\Storage\RunArtifactFinalizer;
use Carbon\CarbonInterface;
use DateTimeInterface;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

final class FlowRunTerminalizer
{
    public function __construct(
        private readonly FlowRunProductionService $productionRuns,
        private readonly MailboxRunQueueService $mailboxRunQueue,
        private readonly RunnerSignalService $runnerSignals,
        private readonly RunArtifactFinalizer $artifactFinalizer,
        private readonly FeatureFlagService $featureFlags,
        private readonly FlowRunOutputSanitizer $outputSanitizer,
        private readonly ActionDispatcherService $actionDispatcher,
        private readonly FlowRunRetentionService $retention,
    ) {}

    /**
     * @param  array<string, mixed>  $attributes
     * @param  list<array{message_id: int, claim_token: string}>  $mailboxClaims
     */
    public function finishExecution(
        Flow $flow,
        FlowRun $run,
        array $attributes,
        array $mailboxClaims,
        mixed $summaryResult,
    ): string {
        $status = $this->persistRunning($run, $attributes, $mailboxClaims);
        if ($status === 'cancelled') {
            return $status;
        }

        $this->updateFlowSummary($flow, $run, [
            'last_run_result' => $run->redactResolvedSecrets($summaryResult),
            'last_run_at' => now(),
        ]);
        $this->actionDispatcher->dispatchActions($flow, $run);
        $this->retention->enforce($flow);

        return $status;
    }

    /**
     * @param  array<string, mixed>  $attributes
     * @param  list<array{message_id: int, claim_token: string}>  $mailboxClaims
     */
    public function persistRunning(FlowRun $run, array $attributes, array $mailboxClaims): string
    {
        return DB::transaction(function () use ($run, $attributes, $mailboxClaims): string {
            $persistedRun = FlowRun::query()
                ->whereKey($run->getKey())
                ->lockForUpdate()
                ->first();
            if (! $persistedRun instanceof FlowRun || $persistedRun->status !== 'running') {
                throw new \RuntimeException('Run is no longer active.');
            }

            $attributes = $this->applyCancellation($persistedRun, $run, $attributes);
            $this->persistLocked($persistedRun, $run, $attributes, $mailboxClaims);

            return $this->terminalStatus($attributes);
        }, 3);
    }

    public function cancelActiveRun(FlowRun $run, string $message): bool
    {
        return DB::transaction(function () use ($run, $message): bool {
            $persistedRun = FlowRun::query()
                ->whereKey($run->getKey())
                ->lockForUpdate()
                ->first();
            if (
                ! $persistedRun instanceof FlowRun
                || ! in_array((string) $persistedRun->status, ['pending', 'running'], true)
            ) {
                return false;
            }

            $attributes = [
                'status' => 'cancelled',
                'cancellation_requested_at' => $persistedRun->cancellation_requested_at ?? now(),
                'error_message' => $message,
            ];
            if ($persistedRun->status === 'running') {
                $attributes['duration_ms'] = $this->durationMs($persistedRun);
            }

            $this->persistLocked($persistedRun, $run, $attributes, []);

            return true;
        }, 3);
    }

    public function recoverStaleRun(FlowRun $run, CarbonInterface $now, int $graceSeconds): ?string
    {
        return DB::transaction(function () use ($run, $now, $graceSeconds): ?string {
            $persistedRun = FlowRun::query()
                ->whereKey($run->getKey())
                ->lockForUpdate()
                ->first();
            if (! $persistedRun instanceof FlowRun || $persistedRun->status !== 'running') {
                return null;
            }

            if ($persistedRun->cancellation_requested_at !== null) {
                $attributes = [
                    'status' => 'cancelled',
                    'error_message' => $persistedRun->error_message ?: 'Cancelled by user.',
                    'duration_ms' => $this->durationMs($persistedRun),
                ];
            } else {
                $flow = $persistedRun->flow;
                $timeout = $flow instanceof Flow ? $flow->getEffectiveTimeoutSeconds() : 300;
                $runningAt = $persistedRun->running_at;
                if (
                    ! $runningAt instanceof CarbonInterface
                    || $runningAt->copy()->addSeconds($timeout + max(0, $graceSeconds))->isAfter($now)
                ) {
                    return null;
                }

                $attributes = [
                    'status' => 'error',
                    'error_message' => 'Run worker stopped before reporting a terminal status.',
                    'duration_ms' => $this->durationMs($persistedRun),
                ];
            }

            $this->persistLocked($persistedRun, $run, $attributes, []);

            return $this->terminalStatus($attributes);
        }, 3);
    }

    public function failQueuedRun(FlowRun $run, mixed $error): bool
    {
        $message = $this->safeErrorMessage($run, $error);
        $consoleLogs = $run->console_logs;
        try {
            $artifactSummary = $this->finalizeArtifacts($run);
        } catch (InstanceStorageQuotaExceededException) {
            $artifactSummary = $this->storedArtifactSummary($run);
        }
        $attributes = [
            'status' => 'error',
            'error_message' => $message,
            'console_logs' => array_merge(is_array($consoleLogs) ? $consoleLogs : [], [
                ['level' => 'error', 'message' => $message, 'ts' => now()->toISOString()],
            ]),
            'action_logs' => $run->redactResolvedSecrets(
                $this->outputSanitizer->extractActionLogs($run, false) ?? $run->action_logs,
            ),
            'duration_ms' => $this->durationMs($run) ?? $run->duration_ms,
            ...$artifactSummary,
        ];

        $status = DB::transaction(function () use ($run, $attributes): ?string {
            $persistedRun = FlowRun::query()
                ->whereKey($run->getKey())
                ->lockForUpdate()
                ->first();
            if (
                ! $persistedRun instanceof FlowRun
                || ! in_array((string) $persistedRun->status, ['pending', 'running'], true)
            ) {
                return null;
            }

            $attributes = $this->applyCancellation($persistedRun, $run, $attributes);
            $this->persistLocked($persistedRun, $run, $attributes, []);

            return $this->terminalStatus($attributes);
        }, 3);

        if ($status === 'error') {
            $this->updateFailureSummary($run, $message);
        }

        return $status === 'error';
    }

    public function recordTerminalFailure(FlowRun $run, mixed $error): void
    {
        $this->productionRuns->handleTerminalRun($run);
        $this->updateFailureSummary($run, $error);
    }

    /** @return array{screenshots_count: int, downloads_count: int, has_recording: bool} */
    public function finalizeArtifacts(FlowRun $run): array
    {
        try {
            $summary = $this->artifactFinalizer->finalizeRun($run);
        } catch (InstanceStorageQuotaExceededException $exception) {
            $this->artifactFinalizer->discardWorkspace($run);
            throw $exception;
        } catch (\Throwable $exception) {
            report($exception);
            $summary = $this->artifactFinalizer->workspaceSummary($run);
        }
        $summary['has_recording'] = $this->featureFlags->enabled('recording_enabled')
            && $summary['has_recording'];

        return $summary;
    }

    /** @return array{screenshots_count: int, downloads_count: int, has_recording: bool} */
    public function storedArtifactSummary(FlowRun $run): array
    {
        $summary = $this->artifactFinalizer->storedSummary($run);
        $summary['has_recording'] = $this->featureFlags->enabled('recording_enabled')
            && $summary['has_recording'];

        return $summary;
    }

    /** @param array<string, mixed> $attributes */
    public function updateFlowSummary(Flow $flow, FlowRun $run, array $attributes): void
    {
        $timestamps = $flow->timestamps;
        $flow->timestamps = false;

        try {
            $flow->forceFill($attributes);
            $updates = array_intersect_key($flow->getAttributes(), $attributes);
            $flow->newModelQuery()
                ->whereKey($flow->getKey())
                ->whereDoesntHave('runs', function ($query) use ($run): void {
                    $query->where(function ($query) use ($run): void {
                        $query->where('created_at', '>', $run->created_at)
                            ->orWhere(function ($query) use ($run): void {
                                $query->where('created_at', $run->created_at)
                                    ->where($run->getKeyName(), '>', $run->getKey());
                            });
                    });
                })
                ->update($updates);
        } finally {
            $flow->timestamps = $timestamps;
        }
    }

    public function isCancelled(FlowRun $run): bool
    {
        $persistedCancellation = $run->newModelQuery()
            ->whereKey($run->getKey())
            ->where(function ($query): void {
                $query->where('status', 'cancelled')
                    ->orWhereNotNull('cancellation_requested_at');
            })
            ->exists();
        if ($persistedCancellation) {
            return true;
        }

        try {
            return (bool) Cache::get("flow_run_kill:{$run->id}", false);
        } catch (\Throwable) {
            return false;
        }
    }

    public function cancelledMessage(FlowRun $run): string
    {
        $persistedMessage = $run->newModelQuery()->whereKey($run->getKey())->value('error_message');
        if (is_string($persistedMessage) && $persistedMessage !== '') {
            return $persistedMessage;
        }

        try {
            $by = Cache::get("flow_run_killed_by:{$run->id}");
        } catch (\Throwable) {
            $by = null;
        }

        return is_scalar($by) && $by
            ? 'Cancelled by user '.(string) $by.'.'
            : 'Cancelled by user.';
    }

    /**
     * @param  array<string, mixed>  $attributes
     * @param  list<array{message_id: int, claim_token: string}>  $mailboxClaims
     */
    private function persistLocked(
        FlowRun $persistedRun,
        FlowRun $run,
        array $attributes,
        array $mailboxClaims,
    ): void {
        $persistedRun->forceFill($attributes);
        $updates = array_intersect_key($persistedRun->getAttributes(), $attributes);
        $persistedRun->newModelQuery()->whereKey($persistedRun->getKey())->update($updates);
        $run->forceFill($updates);

        $this->productionRuns->handleLockedTerminalRun($persistedRun, $run);
        $this->mailboxRunQueue->acknowledgePersistedClaims($run, $mailboxClaims);
        $this->mailboxRunQueue->expireActive($run);
        $this->runnerSignals->expireWaiting($run);
    }

    /**
     * @param  array<string, mixed>  $attributes
     * @return array<string, mixed>
     */
    private function applyCancellation(FlowRun $persistedRun, FlowRun $run, array $attributes): array
    {
        $cancelled = $persistedRun->cancellation_requested_at !== null;
        if (! $cancelled) {
            try {
                $cancelled = (bool) Cache::get("flow_run_kill:{$run->id}", false);
            } catch (\Throwable) {
            }
        }

        if ($cancelled) {
            $attributes['status'] = 'cancelled';
            $attributes['error_message'] = $this->cancelledMessage($run);
        }

        return $attributes;
    }

    /** @param array<string, mixed> $attributes */
    private function terminalStatus(array $attributes): string
    {
        $status = $attributes['status'] ?? null;
        if (! is_string($status)) {
            throw new \LogicException('Terminal run status must be a string.');
        }

        return $status;
    }

    private function updateFailureSummary(FlowRun $run, mixed $error): void
    {
        $flow = $run->flow;
        if (! $flow instanceof Flow) {
            return;
        }

        $safeError = $run->redactResolvedSecrets($error);
        $this->updateFlowSummary($flow, $run, [
            'last_run_result' => is_array($safeError) ? $safeError : ['error' => $safeError],
            'last_run_at' => now(),
        ]);
    }

    private function safeErrorMessage(FlowRun $run, mixed $error): string
    {
        $message = $error instanceof \Throwable ? $error->getMessage() : $error;
        $redacted = $run->redactResolvedSecrets($message ?? 'Job failed unexpectedly.');

        return is_string($redacted) ? $redacted : 'Job failed unexpectedly.';
    }

    private function durationMs(FlowRun $run): ?int
    {
        $runningAt = $run->getAttribute('running_at');
        if ($runningAt instanceof DateTimeInterface && ! $runningAt instanceof CarbonInterface) {
            $runningAt = Carbon::instance($runningAt);
        } elseif (is_string($runningAt)) {
            $runningAt = Carbon::parse($runningAt);
        }

        return $runningAt instanceof CarbonInterface
            ? max(0, (int) $runningAt->diffInMilliseconds(now()))
            : null;
    }
}
