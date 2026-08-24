<?php

namespace App\Services\Mcp\Tools;

use App\Enums\Authorization\Ability;
use App\Models\FlowRun;
use App\Services\Flow\FlowRunnerService;
use App\Services\Flow\FlowRunSearchService;
use App\Services\Runtime\RunnerSignalService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Validation\ValidationException;

/** @phpstan-type Arguments array<string, mixed> */
final class RunMcpTools implements McpToolHandler
{
    public function __construct(
        private readonly FlowRunnerService $runner,
        private readonly FlowRunSearchService $search,
        private readonly RunnerSignalService $signals,
        private readonly McpResourceResolver $resources,
    ) {}

    public function definitions(): array
    {
        $identifier = ['type' => 'string', 'description' => 'Flow ID.'];
        $runProperties = ['flow_id' => $identifier, 'run_id' => ['type' => 'integer', 'minimum' => 1]];

        return [
            ['name' => 'search_runs', 'description' => 'Search MCP-enabled flow runs using Runs page filters.', 'inputSchema' => ['type' => 'object', 'properties' => [
                'flow_id' => $identifier, 'query' => ['type' => 'string'], 'flow_search' => ['type' => 'string'],
                'statuses' => ['type' => 'array', 'items' => ['type' => 'string', 'enum' => FlowRunSearchService::STATUSES]],
                'status' => ['type' => 'string', 'enum' => FlowRunSearchService::STATUSES],
                'date_from' => ['type' => 'string'], 'date_to' => ['type' => 'string'], 'legend' => ['type' => 'string'],
                'duration_min_ms' => ['type' => 'integer', 'minimum' => 0], 'duration_max_ms' => ['type' => 'integer', 'minimum' => 0],
                'triggered_by' => ['type' => 'string', 'pattern' => '^user_[A-Za-z0-9]{12}$'], 'meta_presence' => ['type' => 'string', 'enum' => ['any', 'none']],
                'meta_predicate' => ['type' => 'string', 'enum' => ['and', 'or']],
                'limit' => ['type' => 'integer', 'minimum' => 1, 'maximum' => 100, 'default' => 20],
                'include_logs' => ['type' => 'boolean'], 'include_code' => ['type' => 'boolean'],
            ]]],
            ['name' => 'list_flow_runs', 'description' => 'List recent runs for an MCP-enabled flow.', 'inputSchema' => ['type' => 'object', 'required' => ['flow_id'], 'properties' => [
                'flow_id' => $identifier, 'status' => ['type' => 'string', 'enum' => FlowRunSearchService::STATUSES],
                'limit' => ['type' => 'integer', 'minimum' => 1, 'maximum' => 100, 'default' => 20],
                'include_logs' => ['type' => 'boolean'], 'include_code' => ['type' => 'boolean'],
            ]]],
            ['name' => 'run_flow', 'description' => 'Run an MCP-enabled flow with optional JSON input.', 'inputSchema' => ['type' => 'object', 'required' => ['flow_id'], 'properties' => [
                'flow_id' => $identifier, 'input' => ['type' => 'object', 'additionalProperties' => true],
            ]]],
            ['name' => 'get_run', 'description' => 'Get an MCP-enabled flow run, optionally including logs and code.', 'inputSchema' => ['type' => 'object', 'required' => ['flow_id', 'run_id'], 'properties' => [
                ...$runProperties, 'include_logs' => ['type' => 'boolean'], 'include_code' => ['type' => 'boolean'],
            ]]],
            ['name' => 'get_run_result', 'description' => 'Get the result output for an MCP-enabled flow run.', 'inputSchema' => ['type' => 'object', 'required' => ['flow_id', 'run_id'], 'properties' => $runProperties]],
            ['name' => 'continue_human_validation', 'description' => 'Continue a running flow waiting for human validation.', 'inputSchema' => ['type' => 'object', 'required' => ['flow_id', 'run_id', 'wait_id'], 'properties' => [
                ...$runProperties, 'wait_id' => ['type' => 'string', 'format' => 'uuid'],
            ]]],
        ];
    }

    public function handles(string $name): bool
    {
        return in_array($name, array_column($this->definitions(), 'name'), true);
    }

    public function call(string $name, array $arguments, McpToolContext $context): array
    {
        return match ($name) {
            'search_runs' => $this->searchRuns($arguments, $context),
            'list_flow_runs' => $this->listRuns($arguments, $context),
            'run_flow' => $this->execute($arguments, $context),
            'get_run' => $this->getRun($arguments, $context),
            'get_run_result' => $this->getResult($arguments, $context),
            'continue_human_validation' => $this->continueRun($arguments, $context),
            default => throw ValidationException::withMessages(['name' => 'Unknown run tool.']),
        };
    }

    /** @param Arguments $arguments
     * @return array<string, mixed>
     */
    private function searchRuns(array $arguments, McpToolContext $context): array
    {
        $limit = max(1, min(McpToolArguments::integer($arguments, 'limit', 20), 100));
        $filters = $arguments;
        if (! empty($filters['query']) && empty($filters['flow_search'])) {
            $filters['flow_search'] = $filters['query'];
        }

        $query = $this->search->visibleRunsQuery($context->user, $context->workspace->id)
            ->whereHas('flow', fn ($flow) => $flow->where('available_in_mcp', true));
        if (($identifier = trim(McpToolArguments::string($arguments, 'flow_id'))) !== '') {
            $flow = $this->resources->flow($identifier, $context);
            $query->where('flow_id', $flow->id);
        }
        $this->search->applyFilters($query, $filters);
        $runs = $query->limit($limit)->get();
        $this->prepareRuns($runs, $arguments);

        return ['runs' => $runs->values()];
    }

    /** @param Arguments $arguments
     * @return array<string, mixed>
     */
    private function listRuns(array $arguments, McpToolContext $context): array
    {
        $flow = $this->resources->flow(trim(McpToolArguments::string($arguments, 'flow_id')), $context);
        $query = $this->search->visibleRunsQuery($context->user, $context->workspace->id)->where('flow_id', $flow->id);
        if (! empty($arguments['status'])) {
            $query->where('status', $arguments['status']);
        }
        $runs = $query->limit(max(1, min(McpToolArguments::integer($arguments, 'limit', 20), 100)))->get();
        $this->prepareRuns($runs, $arguments);

        return ['runs' => $runs->values()];
    }

    /** @param Arguments $arguments
     * @return array<string, mixed>
     */
    private function execute(array $arguments, McpToolContext $context): array
    {
        $flow = $this->resources->flow(trim(McpToolArguments::string($arguments, 'flow_id')), $context);
        $input = is_array($arguments['input'] ?? null) ? $arguments['input'] : [];
        try {
            $run = $this->runner->dispatch($flow, $context->user, $input, 'api');
        } catch (AuthorizationException $e) {
            throw ValidationException::withMessages([
                'flow_id' => $e->getMessage(),
            ]);
        }

        return ['run_id' => $run->id, 'flow_id' => $flow->id, 'status' => $run->status];
    }

    /** @param Arguments $arguments
     * @return array<string, mixed>
     */
    private function getRun(array $arguments, McpToolContext $context): array
    {
        [, $run] = $this->resources->run($arguments, $context);
        $run->load(['triggeredBy:id,name', 'trigger:id']);
        /** @var Collection<int, FlowRun> $singleRunCollection */
        $singleRunCollection = new Collection([$run]);
        $this->prepareRuns($singleRunCollection, $arguments);
        $waitId = $run->runtimeWaitId();
        $data = $run->toArray();
        $data['waiting_for_human_validation'] = $waitId !== null;
        $data['human_validation_wait_id'] = $waitId;

        return ['run' => $data];
    }

    /** @param Arguments $arguments
     * @return array<string, mixed>
     */
    private function getResult(array $arguments, McpToolContext $context): array
    {
        [, $run] = $this->resources->run($arguments, $context);
        $run->redactSecretsForClient();

        return ['run_id' => $run->id, 'status' => $run->status, 'output' => $run->output, 'error_message' => $run->error_message, 'duration_ms' => $run->duration_ms];
    }

    /** @param Arguments $arguments
     * @return array<string, mixed>
     */
    private function continueRun(array $arguments, McpToolContext $context): array
    {
        [, $run] = $this->resources->run($arguments, $context, Ability::CONTINUE_RUN);
        $waitId = trim(McpToolArguments::string($arguments, 'wait_id'));
        if (! preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i', $waitId)) {
            throw ValidationException::withMessages(['wait_id' => 'A valid wait identifier is required.']);
        }
        $result = $this->signals->requestContinuation($run, $waitId);
        if ($result !== RunnerSignalService::RESULT_ACCEPTED) {
            throw ValidationException::withMessages(['wait_id' => $result === RunnerSignalService::RESULT_INACTIVE ? 'Run is not active.' : 'Run is not waiting for this validation request.']);
        }

        return ['run_id' => $run->id, 'status' => $run->status, 'continue_requested' => true];
    }

    /**
     * @param  Collection<int, FlowRun>  $runs
     * @param  Arguments  $arguments
     */
    private function prepareRuns(Collection $runs, array $arguments): void
    {
        $runs->each(function (FlowRun $run) use ($arguments) {
            $run->redactSecretsForClient();
            $visible = [];
            if (! empty($arguments['include_logs'])) {
                $visible[] = 'console_logs';
                $visible[] = 'action_logs';
            }
            if (! empty($arguments['include_code'])) {
                $visible[] = 'code_snapshot';
            }
            if ($visible !== []) {
                $run->makeVisible($visible);
            }
        });
    }
}
