<?php

/*
 * Explicit proprietary scope: runtime bootstrapping implements paid Puppetflow features and is licensed under the
 * Puppetflow Proprietary License. See LICENSE_PROPRIETARY.md.
 */

namespace App\Services\Flow;

use App\Enums\Authorization\Ability;
use App\Models\Flow;
use App\Models\FlowRun;
use App\Models\FlowTrigger;
use App\Models\User;
use App\Services\Puppeteer\FlowCodeResolver;
use App\Services\Variable\VariableResolverService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;

final class FlowRunExecutionBootstrapper
{
    public function __construct(
        private readonly FlowCodeResolver $codeResolver,
        private readonly VariableResolverService $variableResolver,
        private readonly InputResourceReferenceResolver $inputResourceReferenceResolver,
        private readonly RunProgressInstrumenter $runProgressInstrumenter,
    ) {}

    /**
     * @return array{
     *     Flow,
     *     array<array-key, mixed>,
     *     array<string, array{value: string|null, vault_field_type: string|null}>
     * }
     */
    public function bootstrap(FlowRun $run): array
    {
        [$flow, $user] = $this->authorizeRun($run);
        $this->authorizeTriggerExecution($run->trigger_id, $user, $flow);

        $resolvedSecrets = [];
        $input = $this->inputResourceReferenceResolver->resolve($run->input ?? []);
        $resolvedInput = $this->variableResolver->resolve(
            $input,
            $user->id,
            $flow->workspace_id,
            $resolvedSecrets,
        );
        $run->update([
            'resolved_secrets' => is_array($resolvedSecrets) && $resolvedSecrets !== []
                ? array_values(array_unique($resolvedSecrets))
                : null,
        ]);

        $this->refreshCodeSnapshot($run, $flow, $user);

        try {
            $varsEnv = $this->variableResolver->buildVarsEnv($user->id, $flow->workspace_id);
        } catch (\Throwable) {
            Log::warning('Failed to build vars env.', ['run_id' => $run->id]);
            $varsEnv = [];
        }

        return [$flow, $resolvedInput, $varsEnv];
    }

    /** @return array{Flow, User} */
    private function authorizeRun(FlowRun $run): array
    {
        $flow = $run->flow;
        if (! $flow instanceof Flow) {
            throw new AuthorizationException('The flow for this run no longer exists.');
        }
        $flow->refresh();

        $user = $run->triggered_by ? User::find($run->triggered_by) : null;
        if (! $user) {
            throw new AuthorizationException('The user who triggered this run no longer exists.');
        }

        $ability = $run->trigger_type === 'manual'
            ? Ability::EXECUTE
            : Ability::EXECUTE_AUTOMATED;
        Gate::forUser($user)->authorize($ability->value, $flow);

        return [$flow, $user];
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

    private function refreshCodeSnapshot(FlowRun $run, Flow $flow, User $user): void
    {
        if (! empty($run->code_snapshot)) {
            return;
        }

        $publishedVersion = $run->flowVersion()->first();
        $code = $publishedVersion
            ? $publishedVersion->code
            : $this->codeResolver->resolve($flow, actor: $user);
        if ($code) {
            $run->update(['code_snapshot' => $this->runProgressInstrumenter->instrument($code)]);

            return;
        }
        if ($flow->source_type === 'repository') {
            throw new AuthorizationException('Repository flow source is no longer available.');
        }
    }
}
