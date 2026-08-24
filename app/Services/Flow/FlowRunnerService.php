<?php

/*
 * Explicit proprietary scope: the licensed run quotas, concurrency limits and replay exposure in this file implement paid
 * Puppetflow features and are licensed under the Puppetflow Proprietary License.
 * See LICENSE_PROPRIETARY.md.
 */

namespace App\Services\Flow;

use App\Models\Flow;
use App\Models\FlowRun;
use App\Models\User;

class FlowRunnerService
{
    public function __construct(
        private readonly FlowRunDispatcher $dispatcher,
        private readonly FlowRunProcessor $processor,
        private readonly FlowRunTerminalizer $terminalizer,
    ) {}

    /**
     * @param  array<string, mixed>  $input
     * @param  array<string, mixed>|null  $webhookInfo
     */
    public function dispatch(
        Flow $flow,
        User $user,
        array $input = [],
        string $triggerType = 'manual',
        ?string $codeOverride = null,
        ?string $triggerId = null,
        ?array $webhookInfo = null,
    ): FlowRun {
        return $this->dispatcher->dispatch(
            $flow,
            $user,
            $input,
            $triggerType,
            $codeOverride,
            $triggerId,
            $webhookInfo,
        );
    }

    public function process(FlowRun $run): void
    {
        $this->processor->process($run);
    }

    public function recordTerminalFailure(FlowRun $run, mixed $error): void
    {
        $this->terminalizer->recordTerminalFailure($run, $error);
    }
}
