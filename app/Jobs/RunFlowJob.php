<?php

/*
 * Explicit proprietary scope: the licensed run-cycle enforcement and replay exposure in this file implement paid
 * Puppetflow features and are licensed under the Puppetflow Proprietary License.
 * See LICENSE_PROPRIETARY.md.
 */

namespace App\Jobs;

use App\Exceptions\FeatureFlags\RunQuotaExceededException;
use App\Exceptions\Licensing\LicenseRuntimeLockedException;
use App\Models\Flow;
use App\Models\FlowRun;
use App\Services\Flow\FlowRunnerService;
use App\Services\Flow\FlowRunTerminalizer;
use App\Services\Variable\UnresolvedVariableException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class RunFlowJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries;

    public int $timeout;

    public function __construct(
        public FlowRun $run
    ) {
        $flow = $this->flowFor($run);
        $this->timeout = $flow->getEffectiveTimeoutSeconds() + 30;
        $this->tries = $flow->getEffectiveMaxRetries() + 1;
    }

    public function handle(FlowRunnerService $runner, FlowRunTerminalizer $terminalizer): void
    {
        try {
            $runner->process($this->run);
        } catch (
            LicenseRuntimeLockedException
            |RunQuotaExceededException
            |UnresolvedVariableException
            |AuthorizationException $e
        ) {
            $terminalizer->failQueuedRun($this->run, $e);
            $this->delete();
        }
    }

    public function failed(?\Throwable $exception): void
    {
        app(FlowRunTerminalizer::class)->failQueuedRun($this->run, $exception);
    }

    private function flowFor(FlowRun $run): Flow
    {
        $flow = $run->flow;

        if (! $flow instanceof Flow) {
            throw new \LogicException('Flow run is missing its flow.');
        }

        return $flow;
    }
}
