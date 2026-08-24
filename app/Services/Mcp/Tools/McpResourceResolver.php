<?php

namespace App\Services\Mcp\Tools;

use App\Enums\Authorization\Ability;
use App\Models\Flow;
use App\Models\FlowRun;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

final class McpResourceResolver
{
    public function flow(string $identifier, McpToolContext $context, bool $requireExposed = true): Flow
    {
        if ($identifier === '') {
            throw ValidationException::withMessages(['flow_id' => 'Flow ID is required.']);
        }

        $flow = Flow::where('workspace_id', $context->workspace->id)
            ->where('id', $identifier)
            ->first();

        if (! $flow || Gate::forUser($context->user)->denies(Ability::VIEW->value, $flow)) {
            throw ValidationException::withMessages(['flow_id' => 'Flow not found.']);
        }

        if ($requireExposed && ! $flow->available_in_mcp) {
            throw ValidationException::withMessages(['flow_id' => 'Flow is not available in MCP.']);
        }

        return $flow;
    }

    /**
     * @param  array<string, mixed>  $arguments
     * @return array{0: Flow, 1: FlowRun}
     */
    public function run(array $arguments, McpToolContext $context, Ability $ability = Ability::VIEW): array
    {
        $flow = $this->flow(trim(McpToolArguments::string($arguments, 'flow_id')), $context);
        $runId = McpToolArguments::integer($arguments, 'run_id');
        if ($runId <= 0) {
            throw ValidationException::withMessages(['run_id' => 'Run ID is required.']);
        }

        $run = FlowRun::where('flow_id', $flow->id)->find($runId);
        if (! $run || Gate::forUser($context->user)->denies($ability->value, $run)) {
            throw ValidationException::withMessages(['run_id' => 'Run not found.']);
        }

        return [$flow, $run];
    }
}
