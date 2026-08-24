<?php

namespace App\Services\Mcp\Tools;

use App\Authorization\Visibility\FlowVisibility;
use App\Authorization\Visibility\FolderVisibility;
use App\Models\Flow;
use App\Models\Folder;
use App\Models\WorkspaceTeam;
use App\Services\FeatureFlags\FeatureFlagService;
use App\Services\Flow\FlowCreationService;
use App\Services\Flow\NodalCatalogService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Validation\ValidationException;

/** @phpstan-type Arguments array<string, mixed> */
final class FlowMcpTools implements McpToolHandler
{
    public function __construct(
        private readonly FlowVisibility $flowVisibility,
        private readonly FolderVisibility $folderVisibility,
        private readonly McpResourceResolver $resources,
        private readonly FlowCreationService $creation,
        private readonly NodalCatalogService $nodalCatalog,
        private readonly FeatureFlagService $features,
    ) {}

    public function definitions(): array
    {
        $identifier = ['type' => 'string', 'description' => 'Flow ID.'];
        $graph = [
            'type' => 'object',
            'required' => ['nodes', 'edges'],
            'properties' => [
                'nodes' => ['type' => 'array', 'items' => ['type' => 'object', 'additionalProperties' => true]],
                'edges' => ['type' => 'array', 'items' => ['type' => 'object', 'additionalProperties' => true]],
            ],
        ];

        return [
            ['name' => 'search_flows', 'description' => 'Search flows visible to the connected user in this workspace.', 'inputSchema' => ['type' => 'object', 'properties' => [
                'query' => ['type' => 'string'], 'name' => ['type' => 'string'],
                'flow_type' => ['type' => 'string', 'enum' => ['code', 'nodal']],
                'type' => ['type' => 'string', 'enum' => ['code', 'nodal']],
                'folder_id' => ['type' => 'string', 'description' => 'Folder ID.'],
                'limit' => ['type' => 'integer', 'minimum' => 1, 'maximum' => 100, 'default' => 20],
            ]]],
            ['name' => 'get_flow_details', 'description' => 'Get safe details for an MCP-enabled flow.', 'inputSchema' => ['type' => 'object', 'required' => ['flow_id'], 'properties' => ['flow_id' => $identifier]]],
            ['name' => 'get_flow_source', 'description' => 'Get the source code and complete nodal graph for an MCP-enabled flow.', 'inputSchema' => ['type' => 'object', 'required' => ['flow_id'], 'properties' => ['flow_id' => $identifier]]],
            ['name' => 'list_folders', 'description' => 'List folders visible to the connected user in this workspace.', 'inputSchema' => ['type' => 'object', 'properties' => ['search' => ['type' => 'string']]]],
            ['name' => 'get_flow_creation_options', 'description' => 'List allowed visibility scopes, teams, and folders for creating a flow.', 'inputSchema' => ['type' => 'object', 'properties' => new \stdClass]],
            ['name' => 'get_nodal_catalog', 'description' => 'List native visual-flow nodes, parameters, and ports.', 'inputSchema' => ['type' => 'object', 'properties' => ['query' => ['type' => 'string']]]],
            ['name' => 'create_flow', 'description' => 'Create a code or nodal flow in this workspace.', 'inputSchema' => ['type' => 'object', 'required' => ['name', 'flow_type', 'code'], 'properties' => [
                'name' => ['type' => 'string', 'maxLength' => 128],
                'description' => ['type' => 'string'],
                'flow_type' => ['type' => 'string', 'enum' => ['code', 'nodal']],
                'code' => ['type' => 'string'],
                'nodal_graph' => $graph,
                'visibility' => ['type' => 'string', 'enum' => ['owner', 'workspace', 'team'], 'default' => 'owner'],
                'team_id' => ['type' => 'string', 'pattern' => '^team_[A-Za-z0-9]{12}$'],
                'folder_id' => ['type' => 'string', 'description' => 'Personal folder ID.'],
                'workspace_folder_id' => ['type' => 'string', 'description' => 'Workspace or team folder ID.'],
                'is_published' => ['type' => 'boolean', 'default' => false],
                'available_in_mcp' => ['type' => 'boolean', 'default' => false],
                'queue_index' => ['type' => ['integer', 'null'], 'minimum' => 1, 'maximum' => config()->integer('puppetflow.queues_counter', 1)],
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
            'search_flows' => $this->search($arguments, $context),
            'get_flow_details' => $this->details($arguments, $context),
            'get_flow_source' => $this->source($arguments, $context),
            'list_folders' => $this->folders($arguments, $context),
            'get_flow_creation_options' => $this->creationOptions($context),
            'get_nodal_catalog' => $this->catalog($arguments),
            'create_flow' => $this->create($arguments, $context),
            default => throw ValidationException::withMessages(['name' => 'Unknown flow tool.']),
        };
    }

    /** @param Arguments $arguments
     * @return array<string, mixed>
     */
    private function search(array $arguments, McpToolContext $context): array
    {
        $limit = max(1, min(McpToolArguments::integer($arguments, 'limit', 20), 100));
        $query = Flow::query()->where('workspace_id', $context->workspace->id)
            ->with(['folder:id', 'workspaceFolder:id', 'team:id'])
            ->select(['id', 'name', 'description', 'flow_type', 'visibility', 'team_id', 'folder_id', 'workspace_folder_id', 'is_published', 'available_in_mcp', 'updated_at']);
        $this->flowVisibility->applyForUser($query, $context->user, $context->workspace->id);
        if (! $context->setting->include_unexposed_flow_previews) {
            $query->where('available_in_mcp', true);
        }

        $text = trim(McpToolArguments::string($arguments, 'query'));
        if ($text !== '') {
            $query->where(fn (Builder $q) => $q->where('name', 'like', "%{$text}%")
                ->orWhere('description', 'like', "%{$text}%")
                ->orWhere('id', 'like', "%{$text}%"));
        }
        if (($name = trim(McpToolArguments::string($arguments, 'name'))) !== '') {
            $query->where('name', 'like', "%{$name}%");
        }
        $type = trim(McpToolArguments::string($arguments, 'flow_type', McpToolArguments::string($arguments, 'type')));
        if ($type !== '') {
            $query->where('flow_type', $type);
        }
        $folderId = trim(McpToolArguments::string($arguments, 'folder_id'));
        if ($folderId !== '') {
            $folderId = $this->resolveFolderId($folderId, $context, 'folder_id');
            $query->where(fn (Builder $query) => $query
                ->where('folder_id', $folderId)
                ->orWhere('workspace_folder_id', $folderId));
        }

        return ['flows' => $query->orderBy('name')->limit($limit)->get()
            ->map(fn (Flow $flow): array => [
                'id' => $flow->id,
                'name' => $flow->name,
                'description' => $flow->description,
                'flow_type' => $flow->flow_type,
                'visibility' => $flow->visibility,
                'team_id' => $flow->team?->id,
                'folder_id' => $flow->folder?->id,
                'workspace_folder_id' => $flow->workspaceFolder?->id,
                'is_published' => (bool) $flow->is_published,
                'available_in_mcp' => (bool) $flow->available_in_mcp,
                'updated_at' => $flow->updated_at?->toIso8601String(),
            ])->values()];
    }

    /** @param Arguments $arguments
     * @return array<string, mixed>
     */
    private function details(array $arguments, McpToolContext $context): array
    {
        $flow = $this->resources->flow(trim(McpToolArguments::string($arguments, 'flow_id')), $context);
        $flow->load(['owner:id,name', 'team:id,name', 'folder:id', 'workspaceFolder:id']);

        return ['flow' => [
            'id' => $flow->id, 'name' => $flow->name,
            'description' => $flow->description, 'readme' => $flow->readme,
            'source_type' => $flow->source_type, 'flow_type' => $flow->flow_type,
            'manual_input' => $flow->manual_input, 'default_inputs' => $flow->default_inputs,
            'is_published' => (bool) $flow->is_published, 'available_in_mcp' => (bool) $flow->available_in_mcp,
            'visibility' => $flow->visibility, 'team_id' => $flow->team?->id,
            'folder_id' => $flow->folder?->id,
            'workspace_folder_id' => $flow->workspaceFolder?->id,
            'owner_id' => $flow->owner?->id,
            'settings' => [
                'queue_index' => $flow->queue_index,
                'timeout_seconds' => $flow->timeout_seconds, 'operator_seconds' => $flow->operator_seconds,
                'max_retries' => $flow->max_retries, 'include_raw_output' => (bool) $flow->include_raw_output,
                'include_input_in_output' => (bool) $flow->include_input_in_output,
                'include_context_in_output' => (bool) $flow->include_context_in_output,
                'always_success_response' => (bool) $flow->always_success_response,
                'export_artifacts_screenshots' => (bool) $flow->export_artifacts_screenshots,
                'export_artifacts_downloads' => (bool) $flow->export_artifacts_downloads,
                'export_artifacts_recording' => (bool) $flow->export_artifacts_recording,
            ],
            'created_at' => $flow->created_at?->toIso8601String(), 'updated_at' => $flow->updated_at?->toIso8601String(),
        ]];
    }

    /** @param Arguments $arguments
     * @return array<string, mixed>
     */
    private function source(array $arguments, McpToolContext $context): array
    {
        $flow = $this->resources->flow(trim(McpToolArguments::string($arguments, 'flow_id')), $context);

        return ['flow' => [
            'id' => $flow->id, 'flow_type' => $flow->flow_type,
            'code' => $flow->code, 'nodal_graph' => $flow->nodal_graph,
            'content_updated_at' => $flow->content_updated_at?->toIso8601String(),
        ]];
    }

    /** @param Arguments $arguments
     * @return array<string, mixed>
     */
    private function folders(array $arguments, McpToolContext $context): array
    {
        $query = Folder::query()->where('workspace_id', $context->workspace->id)
            ->with(['parent:id', 'team:id', 'owner:id'])
            ->select(['id', 'name', 'parent_id', 'is_shared', 'team_id', 'owner_id']);
        $this->folderVisibility->applyForUser($query, $context->user, $context->workspace->id);
        if (($search = trim(McpToolArguments::string($arguments, 'search'))) !== '') {
            $query->where('name', 'like', "%{$search}%");
        }

        return ['folders' => $query->orderBy('name')->get()
            ->map(fn (Folder $folder): array => [
                'id' => $folder->id,
                'name' => $folder->name,
                'parent_id' => $folder->parent?->id,
                'is_shared' => (bool) $folder->is_shared,
                'team_id' => $folder->team?->id,
                'owner_id' => $folder->owner?->id,
            ])->values()];
    }

    /** @return array<string, mixed> */
    private function creationOptions(McpToolContext $context): array
    {
        $folders = $this->folders([], $context)['folders'];
        $teamIds = $context->user->teams()->where('workspace_id', $context->workspace->id)->pluck('workspace_teams.id');

        return [
            'visibility_scopes' => $this->features->allowedScopes(),
            'teams' => WorkspaceTeam::where('workspace_id', $context->workspace->id)->whereIn('id', $teamIds)->orderBy('name')->get(['id', 'name']),
            'folders' => $folders,
            'defaults' => ['visibility' => 'owner', 'is_published' => false, 'available_in_mcp' => false],
        ];
    }

    /** @param Arguments $arguments
     * @return array<string, mixed>
     */
    private function catalog(array $arguments): array
    {
        $entries = collect($this->nodalCatalog->entries());
        if (($query = strtolower(trim(McpToolArguments::string($arguments, 'query')))) !== '') {
            $entries = $entries->filter(fn (array $entry) => str_contains(strtolower(
                $this->catalogValue($entry, 'name').' '.$this->catalogValue($entry, 'description').' '.$this->catalogValue($entry, 'category')
            ), $query));
        }

        return ['nodes' => $entries->values()];
    }

    /** @param Arguments $arguments
     * @return array<string, mixed>
     */
    private function create(array $arguments, McpToolContext $context): array
    {
        $attributes = $arguments;
        unset($attributes['folder_id'], $attributes['workspace_folder_id'], $attributes['team_id']);

        $teamId = trim(McpToolArguments::string($arguments, 'team_id'));
        if ($teamId !== '') {
            $teamId = WorkspaceTeam::where('workspace_id', $context->workspace->id)
                ->where('id', $teamId)
                ->value('id');
            if (! is_string($teamId)) {
                throw ValidationException::withMessages(['team_id' => 'The selected team is invalid.']);
            }
            $attributes['team_id'] = $teamId;
        }

        $folderId = trim(McpToolArguments::string($arguments, 'folder_id'));
        if ($folderId !== '') {
            $attributes['folder_id'] = $this->resolveFolderId($folderId, $context, 'folder_id');
        }

        $workspaceFolderId = trim(McpToolArguments::string($arguments, 'workspace_folder_id'));
        if ($workspaceFolderId !== '') {
            $attributes['workspace_folder_id'] = $this->resolveFolderId($workspaceFolderId, $context, 'workspace_folder_id');
        }

        $flow = $this->creation->create($attributes, $context->user, $context->workspace, strictContent: true);

        return ['flow' => [
            'id' => $flow->id, 'name' => $flow->name,
            'flow_type' => $flow->flow_type,
            'visibility' => $flow->visibility, 'is_published' => (bool) $flow->is_published,
            'available_in_mcp' => (bool) $flow->available_in_mcp,
            'queue_index' => $flow->queue_index,
            'url' => route('flows.show', $flow).'#code',
        ]];
    }

    private function resolveFolderId(string $id, McpToolContext $context, string $field): string
    {
        $query = Folder::query()
            ->where('workspace_id', $context->workspace->id)
            ->where('id', $id);
        $this->folderVisibility->applyForUser($query, $context->user, $context->workspace->id);
        $folder = $query->first();

        if (! $folder) {
            throw ValidationException::withMessages([$field => 'The selected folder is invalid.']);
        }

        return $folder->id;
    }

    /** @param array<string, mixed> $entry */
    private function catalogValue(array $entry, string $key): string
    {
        return is_string($entry[$key] ?? null) ? $entry[$key] : '';
    }
}
