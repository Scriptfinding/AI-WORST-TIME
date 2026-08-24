<?php

/*
 * Explicit proprietary scope: production accounting implements paid Puppetflow features and is licensed under the
 * Puppetflow Proprietary License. See LICENSE_PROPRIETARY.md.
 */

namespace App\Services\Flow;

use App\Enums\Authorization\Ability;
use App\Jobs\RunFlowJob;
use App\Models\Flow;
use App\Models\FlowRun;
use App\Models\FlowTrigger;
use App\Models\User;
use App\Services\Licensing\LicenseRuntimeGuard;
use App\Services\Puppeteer\FlowCodeResolver;
use App\Services\Storage\RunArtifactStorage;
use App\Services\Variable\VariableResolverService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

final class FlowRunDispatcher
{
    public function __construct(
        private readonly FlowCodeResolver $codeResolver,
        private readonly VariableResolverService $variableResolver,
        private readonly RunProgressInstrumenter $runProgressInstrumenter,
        private readonly FlowRunProductionService $productionRuns,
        private readonly LicenseRuntimeGuard $licenseGuard,
        private readonly FlowRunTerminalizer $terminalizer,
        private readonly FlowRunQueueRouter $queueRouter,
        private readonly FlowRunProxyRouter $proxyRouter,
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
        $this->licenseGuard->ensure('flow runner');
        $input = $this->effectiveInput($flow, $input);

        Gate::forUser($user)->authorize($this->executionAbility($triggerType)->value, $flow);
        $this->variableResolver->resolve($input, $user->id, $flow->workspace_id);
        $this->authorizeTriggerExecution($triggerId, $user, $flow);

        $flowVersionId = null;
        // Repository flows keep the repository as their source of truth and are not versioned.
        if ($triggerType !== 'manual' && $codeOverride === null && $flow->source_type !== 'repository') {
            $publishedVersion = $flow->publishedVersion()->first();
            if (! $publishedVersion) {
                throw new AuthorizationException('This flow does not have a published version.');
            }
            $resolvedCode = $publishedVersion->code;
            $flowVersionId = $publishedVersion->id;
        } else {
            $resolvedCode = $this->codeResolver->resolve($flow, $codeOverride, $user);
        }
        if ($flow->source_type === 'repository' && ! $resolvedCode) {
            throw new AuthorizationException('Repository flow source is not available to the current user.');
        }
        $codeToRun = $this->runProgressInstrumenter->instrument($resolvedCode);
        $flow->refresh();
        $productionDecision = $this->productionRuns->decide($flow, $triggerType);
        $proxySnapshot = $this->proxyRouter->resolve($flow, $user);

        $run = $this->createPendingRun(
            $flow,
            $user,
            $input,
            $triggerType,
            $codeToRun,
            $triggerId,
            $webhookInfo,
            $productionDecision,
            $flowVersionId,
            $proxySnapshot,
        );

        $this->terminalizer->updateFlowSummary($flow, $run, ['last_run_at' => now()]);
        $this->productionRuns->logDispatch($flow, $run, $productionDecision);
        RunFlowJob::dispatch($run)->onQueue($this->queueRouter->assign($run, $flow));

        return $run;
    }

    /**
     * @param  array<string, mixed>  $input
     * @param  array<string, mixed>|null  $webhookInfo
     * @param  array<string, mixed>  $proxySnapshot
     */
    private function createPendingRun(
        Flow $flow,
        User $user,
        array $input,
        string $triggerType,
        ?string $codeToRun,
        ?string $triggerId,
        ?array $webhookInfo,
        ProductionRunDecision $productionDecision,
        ?int $flowVersionId,
        array $proxySnapshot,
    ): FlowRun {
        $run = Cache::lock(RunArtifactStorage::flowLockName($flow), 300)->block(
            30,
            fn () => DB::transaction(function () use (
                $flow,
                $user,
                $input,
                $triggerType,
                $codeToRun,
                $triggerId,
                $webhookInfo,
                $productionDecision,
                $flowVersionId,
                $proxySnapshot,
            ): FlowRun {
                $this->productionRuns->reserve($productionDecision, $triggerType);

                return FlowRun::create([
                    'flow_id' => $flow->id,
                    'flow_version_id' => $flowVersionId,
                    'triggered_by' => $user->id,
                    'trigger_id' => $triggerId,
                    'trigger_type' => $triggerType,
                    'status' => 'pending',
                    'input' => $input,
                    'code_snapshot' => $codeToRun,
                    'webhook_info' => $webhookInfo,
                    'resolved_secrets' => null,
                    'is_production' => $productionDecision->isProduction,
                    'manual_run_score_audit' => $productionDecision->initialAudit(),
                    'proxy_snapshot' => $proxySnapshot,
                ]);
            }, 3),
        );
        if (! $run instanceof FlowRun) {
            throw new \LogicException('Flow run creation lock returned an invalid result.');
        }

        return $run;
    }

    /**
     * @param  array<string, mixed>  $input
     * @return array<string, mixed>
     */
    private function effectiveInput(Flow $flow, array $input): array
    {
        $rawDefaultInputs = $flow->getAttribute('default_inputs');
        $defaultInputs = is_array($rawDefaultInputs) ? $rawDefaultInputs : [];
        $input = $defaultInputs === [] ? $input : array_merge($defaultInputs, $input);
        $viewport = $flow->getEffectiveViewport();

        $effectiveKeyboardSpeed = $flow->getEffectiveKeyboardSpeed();
        $rawKeyboardSpeed = $input['$keyboardSpeed'] ?? $effectiveKeyboardSpeed;
        $keyboardSpeed = is_numeric($rawKeyboardSpeed) && (float) $rawKeyboardSpeed >= 0
            ? (float) $rawKeyboardSpeed
            : $effectiveKeyboardSpeed;
        $rawViewportWidth = $input['$viewportWidth'] ?? $viewport['width'];
        $viewportWidth = is_numeric($rawViewportWidth) && (int) $rawViewportWidth > 0
            ? (int) $rawViewportWidth
            : $viewport['width'];
        $rawViewportHeight = $input['$viewportHeight'] ?? $viewport['height'];
        $viewportHeight = is_numeric($rawViewportHeight) && (int) $rawViewportHeight > 0
            ? (int) $rawViewportHeight
            : $viewport['height'];

        return array_merge($input, [
            '$keyboardSpeed' => $keyboardSpeed,
            '$viewportWidth' => $viewportWidth,
            '$viewportHeight' => $viewportHeight,
        ]);
    }

    private function authorizeTriggerExecution(?string $triggerId, User $user, Flow $flow): void
    {
        if ($triggerId === null) {
            return;
        }

        $trigger = FlowTrigger::query()
            ->whereKey($triggerId)
            ->where('flow_id', $flow->id)
            ->where('is_active', true)
            ->first();
        if (! $trigger || $trigger->user_id !== $user->id) {
            throw new AuthorizationException('The trigger is no longer available to its owner.');
        }

        Gate::forUser($user)->authorize(Ability::USE->value, $trigger);
    }

    private function executionAbility(string $triggerType): Ability
    {
        return $triggerType === 'manual' ? Ability::EXECUTE : Ability::EXECUTE_AUTOMATED;
    }
}
