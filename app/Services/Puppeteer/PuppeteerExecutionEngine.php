<?php

namespace App\Services\Puppeteer;

use App\Contracts\FlowExecutionEngine;
use App\Models\Flow;
use App\Models\FlowRun;
use App\Services\Storage\RunArtifactStorage;
use Illuminate\Contracts\Process\ProcessResult;
use Illuminate\Support\Facades\Log;

final class PuppeteerExecutionEngine implements FlowExecutionEngine
{
    public function __construct(
        private readonly PuppeteerRunspaceBootstrapper $runspaces,
        private readonly PuppeteerEnvironmentBuilder $environments,
        private readonly PuppeteerProcessRunner $processes,
        private readonly RuntimeOutputReader $outputs,
        private readonly RuntimeSecretManager $secrets,
        private readonly RunArtifactStorage $artifactStorage,
    ) {}

    public function execute(
        Flow $flow,
        FlowRun $run,
        array &$consoleLogs,
        ?callable $isCancelled = null,
        array $varsEnv = [],
        array $resolvedInput = [],
        ?callable $onReady = null,
    ): FlowExecutionResult {
        $tag = "[flow:{$flow->id}:{$run->id}]";
        $runspace = null;
        $process = null;
        $partialOutput = null;
        $internalOutput = null;
        /** @var array<int, array{level: string, message: string, ts: string}>|null $actionLogs */
        $actionLogs = null;
        $mailboxClaims = [];

        try {
            try {
                $runspace = $this->runspaces->bootstrap($flow, $run, $resolvedInput);
                if ($onReady !== null) {
                    $onReady();
                }
                $runspace = new PuppeteerRunspace(
                    $runspace->directories,
                    $runspace->files,
                    $this->runspaces->bootstrapSandbox($run->getFlowRunArtifactsBasePath()),
                    $runspace->cookieJars,
                );
                $env = $this->environments->build(
                    $flow,
                    $runspace->files,
                    $runspace->directories,
                    $run,
                    $runspace->sandbox,
                );
                if ($varsEnv !== []) {
                    $env['PUPPETFLOW_VARS_ENV'] = json_encode($varsEnv) ?: '';
                }
                $command = $this->processes->command($flow, $runspace->sandbox);
                Log::info("{$tag} Executing: node -e <bootstrap>");
                $process = $this->processes->run(
                    $flow,
                    $command,
                    $env,
                    $tag,
                    $run,
                    $consoleLogs,
                    $runspace->files['runtime_secrets'],
                    $isCancelled,
                );
            } finally {
                if ($runspace !== null) {
                    try {
                        $this->secrets->merge($run, $runspace->files['runtime_secrets']);
                        $mailboxClaims = $this->outputs->mailboxClaims($runspace->files['mailbox_claims']);
                        $this->runspaces->persistCookies($flow, $run, $runspace);
                    } finally {
                        $this->runspaces->cleanupInputs($runspace->files);
                        $this->runspaces->cleanupSandbox($runspace->sandbox);
                        try {
                            $this->artifactStorage->cleanupIncompleteRecording($run);
                        } catch (\Throwable $exception) {
                            report($exception);
                        }
                        $actionLogs = $this->outputs->actionLogs($runspace->files['action_logs']);
                        if ($process === null) {
                            $partialOutput = $this->outputs->output($runspace->files['output']);
                            $internalOutput = $this->outputs->output($runspace->files['internal_output']);
                            $this->runspaces->cleanupAll($runspace->files);
                        }
                    }
                } else {
                    try {
                        $this->artifactStorage->cleanupIncompleteRecording($run);
                    } catch (\Throwable $exception) {
                        report($exception);
                    }
                }
            }

            Log::info("{$tag} Process finished", [
                'exit_code' => $process->exitCode(),
                'stdout_length' => strlen($process->output()),
                'stderr_length' => strlen($process->errorOutput()),
            ]);
            if ($process->failed()) {
                $partialOutput = $this->outputs->output($runspace->files['output']);
                $internalOutput = $this->outputs->output($runspace->files['internal_output']);
                $this->outputs->throwProcessFailure($process, $runspace->files, $tag, $run);
            }

            $output = $this->outputs->successfulOutput($flow, $run, $process, $runspace->files);
            $internalOutput = $this->outputs->output($runspace->files['internal_output']);

            return new FlowExecutionResult(
                output: $output,
                internalOutput: $internalOutput,
                actionLogs: $actionLogs,
                mailboxClaims: $mailboxClaims,
                executionData: $this->executionData($process, $tag),
            );
        } catch (\Throwable $exception) {
            $result = new FlowExecutionResult(
                partialOutput: $partialOutput,
                internalOutput: $internalOutput,
                actionLogs: $actionLogs,
                mailboxClaims: $mailboxClaims,
                executionData: $process instanceof ProcessResult
                    ? $this->executionData($process, $tag)
                    : ['tag' => $tag],
            );

            throw new FlowExecutionException($exception->getMessage(), $result, $exception);
        }
    }

    /** @return array{tag: string, exit_code: int|null, stdout_length: int, stderr_length: int} */
    private function executionData(ProcessResult $process, string $tag): array
    {
        return [
            'tag' => $tag,
            'exit_code' => $process->exitCode(),
            'stdout_length' => strlen($process->output()),
            'stderr_length' => strlen($process->errorOutput()),
        ];
    }
}
