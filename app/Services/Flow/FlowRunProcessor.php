<?php

/*
 * Explicit proprietary scope: licensed run execution and replay orchestration implement paid Puppetflow features
 * and are licensed under the Puppetflow Proprietary License. See LICENSE_PROPRIETARY.md.
 */

namespace App\Services\Flow;

use App\Contracts\FlowExecutionEngine;
use App\Exceptions\InstanceStorageQuotaExceededException;
use App\Models\Flow;
use App\Models\FlowRun;
use App\Services\Licensing\LicenseRuntimeGuard;
use App\Services\Puppeteer\FlowExecutionException;
use App\Services\Puppeteer\FlowExecutionResult;
use App\Services\Storage\RunArtifactStorage;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

final class FlowRunProcessor
{
    public function __construct(
        private readonly FlowExecutionEngine $executionEngine,
        private readonly LicenseRuntimeGuard $licenseGuard,
        private readonly FlowRunExecutionBootstrapper $executionBootstrapper,
        private readonly FlowRunOutputSanitizer $outputSanitizer,
        private readonly FlowRunTerminalizer $terminalizer,
    ) {}

    public function process(FlowRun $run): void
    {
        $flow = $run->flow;
        $timeout = $flow instanceof Flow ? $flow->getEffectiveTimeoutSeconds() : 300;

        Cache::lock(RunArtifactStorage::writerLockName($run), max(300, $timeout + 180))->block(
            30,
            function () use ($run): void {
                if (! $run->newModelQuery()->whereKey($run->getKey())->exists()) {
                    return;
                }

                $run->refresh();
                $this->processWithWriterLock($run);
            },
        );
    }

    private function processWithWriterLock(FlowRun $run): void
    {
        $this->licenseGuard->ensure('flow worker');
        if ($this->terminalizer->isCancelled($run)) {
            $run->refresh();
            if ($run->status === 'running') {
                $this->terminalizer->persistRunning($run, [
                    'status' => 'cancelled',
                    'error_message' => $this->terminalizer->cancelledMessage($run),
                ], []);
            }

            return;
        }

        [$flow, $resolvedInput, $varsEnv] = $this->executionBootstrapper->bootstrap($run);
        $this->execute($run, $flow, $resolvedInput, $varsEnv);
    }

    /**
     * @param  array<array-key, mixed>  $resolvedInput
     * @param  array<string, array{value: string|null, vault_field_type: string|null}>  $varsEnv
     */
    private function execute(FlowRun $run, Flow $flow, array $resolvedInput, array $varsEnv): void
    {
        $consoleLogs = [];
        $startTime = microtime(true);
        $executionResult = null;
        $artifactSummary = null;
        $actionLogs = null;

        try {
            $executionResult = $this->executionEngine->execute(
                $flow,
                $run,
                $consoleLogs,
                fn (): bool => $this->terminalizer->isCancelled($run),
                $varsEnv,
                $resolvedInput,
                fn () => $this->markRunning($run),
            );
            $result = $executionResult->output;
            $actionLogs = $this->outputSanitizer->extractActionLogs($run)
                ?? $executionResult->actionLogs;
            $artifactSummary = $this->terminalizer->finalizeArtifacts($run);
            $attributes = $this->resultAttributes(
                $run,
                $flow,
                $executionResult,
                $consoleLogs,
                (int) ((microtime(true) - $startTime) * 1000),
                $artifactSummary,
                $actionLogs,
            );

            if ($this->terminalizer->isCancelled($run)) {
                $attributes['status'] = 'cancelled';
                $attributes['error_message'] = $this->terminalizer->cancelledMessage($run);
                $this->terminalizer->persistRunning($run, $attributes, $executionResult->mailboxClaims);

                return;
            }

            $attributes['status'] = 'success';
            $attributes['error_message'] = null;
            if (! $flow->always_success_response && ($result['status'] ?? null) === 'error') {
                $attributes['status'] = 'error';
                $attributes['error_message'] = $run->redactResolvedSecrets($result['message'] ?? null);
            }
            $this->terminalizer->finishExecution(
                $flow,
                $run,
                $attributes,
                $executionResult->mailboxClaims,
                $attributes['output'],
            );
        } catch (\Throwable $exception) {
            $this->handleExecutionFailure(
                $exception,
                $run,
                $flow,
                $executionResult,
                $consoleLogs,
                $startTime,
                $artifactSummary,
                $actionLogs,
            );
        }
    }

    /**
     * @param  array<int, array{level: string, message: string, ts: string}>  $consoleLogs
     * @param  array{screenshots_count: int, downloads_count: int, has_recording: bool}  $artifacts
     * @param  array<array-key, mixed>|null  $actionLogs
     * @return array<string, mixed>
     */
    private function resultAttributes(
        FlowRun $run,
        Flow $flow,
        FlowExecutionResult $result,
        array $consoleLogs,
        int $durationMs,
        array $artifacts,
        ?array $actionLogs,
    ): array {
        $output = $result->output;

        return [
            'output' => $run->redactResolvedSecrets($this->outputSanitizer->cleanOutput($output, $flow)),
            'console_logs' => $consoleLogs,
            'action_logs' => $run->redactResolvedSecrets($actionLogs),
            'duration_ms' => $durationMs,
            'legend' => $run->redactResolvedSecrets($this->outputSanitizer->extractLegend($output)),
            'meta' => $run->redactResolvedSecrets($this->outputSanitizer->extractMeta($output)),
            'internal_meta' => $run->redactResolvedSecrets(
                $this->outputSanitizer->extractInternalMeta($result->internalOutput),
            ),
            ...$artifacts,
        ];
    }

    /**
     * @param  array<int, array{level: string, message: string, ts: string}>  $consoleLogs
     * @param  array{screenshots_count: int, downloads_count: int, has_recording: bool}|null  $artifacts
     * @param  array<array-key, mixed>|null  $actionLogs
     */
    private function handleExecutionFailure(
        \Throwable $exception,
        FlowRun $run,
        Flow $flow,
        ?FlowExecutionResult $executionResult,
        array $consoleLogs,
        float $startTime,
        ?array $artifacts,
        ?array $actionLogs,
    ): void {
        if ($exception instanceof FlowExecutionException) {
            $executionResult = $exception->result;
        }
        $artifacts ??= $exception instanceof InstanceStorageQuotaExceededException
            ? $this->terminalizer->storedArtifactSummary($run)
            : $this->terminalizer->finalizeArtifacts($run);
        $persistedStatus = $run->newModelQuery()->whereKey($run->getKey())->value('status');
        if (in_array($persistedStatus, ['success', 'error', 'cancelled'], true)) {
            Log::error('Post-terminal flow run processing failed.', [
                'flow_id' => $flow->id,
                'run_id' => $run->id,
                'error' => $exception->getMessage(),
            ]);

            return;
        }

        $partialOutput = $executionResult?->partialOutput;
        $errorOutput = $partialOutput
            ? $run->redactResolvedSecrets($this->outputSanitizer->cleanOutput($partialOutput, $flow))
            : null;
        $latestActionLogs = $this->outputSanitizer->extractActionLogs($run);
        if ($latestActionLogs === null && $executionResult instanceof FlowExecutionResult) {
            $latestActionLogs = $executionResult->actionLogs;
        }
        $latestActionLogs ??= $actionLogs;

        $attributes = [
            'output' => $errorOutput,
            'console_logs' => $consoleLogs,
            'action_logs' => $run->redactResolvedSecrets($latestActionLogs),
            'duration_ms' => (int) ((microtime(true) - $startTime) * 1000),
            'legend' => $run->redactResolvedSecrets(
                $partialOutput ? $this->outputSanitizer->extractLegend($partialOutput) : null,
            ),
            'meta' => $run->redactResolvedSecrets(
                $partialOutput ? $this->outputSanitizer->extractMeta($partialOutput) : null,
            ),
            'internal_meta' => $run->redactResolvedSecrets(
                $this->outputSanitizer->extractInternalMeta($executionResult?->internalOutput),
            ),
            ...$artifacts,
        ];
        $claims = $executionResult?->mailboxClaims;
        $claims ??= [];

        if ($this->terminalizer->isCancelled($run)) {
            $attributes['status'] = 'cancelled';
            $attributes['error_message'] = $this->terminalizer->cancelledMessage($run);
            $this->terminalizer->persistRunning($run, $attributes, $claims);

            return;
        }

        $redacted = $run->redactResolvedSecrets($exception->getMessage());
        $message = is_string($redacted) ? $redacted : $exception->getMessage();
        Log::error("Flow run failed: {$message}", ['flow_id' => $flow->id, 'run_id' => $run->id]);
        $attributes['status'] = 'error';
        $attributes['error_message'] = $message;
        $attributes['console_logs'][] = [
            'level' => 'error',
            'message' => $message,
            'ts' => now()->toISOString(),
        ];
        $this->terminalizer->finishExecution(
            $flow,
            $run,
            $attributes,
            $claims,
            $errorOutput ?: ['error' => $message],
        );
    }

    private function markRunning(FlowRun $run): void
    {
        $runningAt = now();
        $updated = $run->newModelQuery()
            ->whereKey($run->getKey())
            ->where('status', 'pending')
            ->update([
                'status' => 'running',
                'running_at' => $runningAt,
                'console_logs' => '[]',
                'updated_at' => now(),
            ]);
        if ($updated !== 1) {
            throw new \RuntimeException('Run is no longer pending.');
        }

        $run->forceFill([
            'status' => 'running',
            'running_at' => $runningAt,
            'console_logs' => [],
        ]);
    }
}
