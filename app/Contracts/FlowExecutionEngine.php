<?php

namespace App\Contracts;

use App\Models\Flow;
use App\Models\FlowRun;
use App\Services\Puppeteer\FlowExecutionResult;
use App\Services\Puppeteer\PuppeteerExecutionEngine;
use Illuminate\Container\Attributes\Bind;

#[Bind(PuppeteerExecutionEngine::class)]
interface FlowExecutionEngine
{
    /**
     * @param  array<int, array{level: string, message: string, ts: string}>  $consoleLogs
     * @param  array<string, array{value: string|null, vault_field_type: string|null}>  $varsEnv
     * @param  array<array-key, mixed>  $resolvedInput
     */
    public function execute(
        Flow $flow,
        FlowRun $run,
        array &$consoleLogs,
        ?callable $isCancelled = null,
        array $varsEnv = [],
        array $resolvedInput = [],
        ?callable $onReady = null,
    ): FlowExecutionResult;
}
