<?php

/*
 * Portions of this file implement the paid Puppetflow video replay
 * (recording) feature and are licensed under the Puppetflow Proprietary
 * License. See LICENSE_PROPRIETARY.md.
 */

namespace App\Services\Puppeteer;

use App\Contracts\FlowExecutionEngine;
use App\Enums\Flow\FlowRunArtifactTypeEnum;
use App\Models\Flow;
use App\Models\FlowRun;
use App\Models\User;

/**
 * Compatibility facade for CLI commands and callers migrating to the
 * explicit FlowExecutionEngine contract.
 */
final class PuppeteerService
{
    private ?FlowExecutionResult $lastResult = null;

    public function __construct(
        private readonly FlowExecutionEngine $engine,
        private readonly FlowCodeResolver $codeResolver,
        private readonly PuppeteerRuntimeExporter $exporter,
        private readonly PuppeteerCliRunBootstrapper $cliRuns,
    ) {}

    public function resolveCode(Flow $flow, ?string $codeOverride = null, ?User $actor = null): ?string
    {
        return $this->codeResolver->resolve($flow, $codeOverride, $actor);
    }

    /**
     * @param  array<int, array{level: string, message: string, ts: string}>  $consoleLogs
     * @param  array<string, array{value: string|null, vault_field_type: string|null}>  $varsEnv
     * @param  array<array-key, mixed>  $resolvedInput
     * @return array<array-key, mixed>
     */
    public function execute(
        Flow $flow,
        FlowRun $run,
        array &$consoleLogs,
        ?callable $isCancelled = null,
        array $varsEnv = [],
        array $resolvedInput = [],
        ?callable $onReady = null,
    ): array {
        $this->lastResult = null;
        try {
            $this->lastResult = $this->engine->execute(
                $flow,
                $run,
                $consoleLogs,
                $isCancelled,
                $varsEnv,
                $resolvedInput,
                $onReady,
            );

            return $this->lastResult->output;
        } catch (FlowExecutionException $exception) {
            $this->lastResult = $exception->result;
            throw $exception->getPrevious() ?? $exception;
        }
    }

    /** @return array<array-key, mixed>|null */
    public function getLastPartialOutput(): ?array
    {
        return $this->lastResult?->partialOutput;
    }

    /** @return array<array-key, mixed>|null */
    public function getLastInternalOutput(): ?array
    {
        return $this->lastResult?->internalOutput;
    }

    /** @return array<int, array{level: string, message: string, ts: string}>|null */
    public function getLastActionLogs(): ?array
    {
        return $this->lastResult?->actionLogs;
    }

    /** @return list<array{message_id: int, claim_token: string}> */
    public function getLastMailboxClaims(): array
    {
        return $this->lastResult === null ? [] : $this->lastResult->mailboxClaims;
    }

    /** @param list<string> $secretValues */
    public function buildChannelsContent(
        Flow $flow,
        ?string $userId = null,
        array &$secretValues = [],
        bool $allAccess = false,
    ): string {
        return $this->exporter->channels($flow, $userId, $secretValues, $allAccess);
    }

    public function buildWatchersContent(Flow $flow, ?string $userId = null, bool $allAccess = false): string
    {
        return $this->exporter->watchers($flow, $userId, $allAccess);
    }

    public function buildSnippetsContent(Flow $flow, ?string $userId = null, bool $allAccess = false): string
    {
        return $this->exporter->snippets($flow, $userId, $allAccess);
    }

    /**
     * @param  array<array-key, mixed>  $input
     * @return array{command: list<string>, env: array<string, string|false>, cwd: string, sandbox: array{dir: string}}
     */
    public function bootstrapCliRun(Flow $flow, array $input, string $codePath): array
    {
        return $this->cliRuns->bootstrap($flow, $input, $codePath);
    }

    /** @param array{sandbox: array{dir: string}} $cliRun */
    public function cleanupCliRun(array $cliRun): void
    {
        $this->cliRuns->cleanup($cliRun);
    }

    public function cliFlowPath(Flow $flow): ?string
    {
        return $this->codeResolver->cliFlowPath($flow);
    }

    /** @return array<string, int> */
    public function countArtifacts(Flow $flow, FlowRun $run): array
    {
        $basePath = $run->getFlowRunArtifactsBasePath(false);
        $counts = [];
        foreach (FlowRunArtifactTypeEnum::getArtifactApiTypes(true) as $type) {
            $name = $type instanceof FlowRunArtifactTypeEnum ? $type->value : $type;
            $counts[$name.'_count'] = $this->countFiles("{$basePath}/{$name}");
        }

        return $counts;
    }

    private function countFiles(string $directory): int
    {
        if (! is_dir($directory)) {
            return 0;
        }
        $count = 0;
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($directory, \FilesystemIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::LEAVES_ONLY,
        );
        foreach ($iterator as $file) {
            if ($file instanceof \SplFileInfo && $file->isFile()) {
                $count++;
            }
        }

        return $count;
    }
}
