<?php

namespace App\Services\Flow;

use App\Authorization\AuthorizationContextFactory;
use App\Authorization\ResourceAssignmentValidator;
use App\Authorization\Visibility\SharedResourceVisibility;
use App\Enums\Authorization\Ability;
use App\Models\Flow;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceProxy;
use App\Rules\ValidNodalGraph;
use App\Services\FeatureFlags\FeatureFlagService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

final class FlowCreationService
{
    public function __construct(
        private readonly ResourceAssignmentValidator $assignments,
        private readonly AuthorizationContextFactory $contexts,
        private readonly SharedResourceVisibility $sharedVisibility,
        private readonly FeatureFlagService $features,
    ) {}

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function create(array $attributes, User $user, Workspace $workspace, bool $strictContent = false): Flow
    {
        return DB::transaction(
            fn (): Flow => $this->createWithinTransaction($attributes, $user, $workspace, $strictContent),
            3,
        );
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function createWithinTransaction(
        array $attributes,
        User $user,
        Workspace $workspace,
        bool $strictContent,
    ): Flow {
        Gate::forUser($user)->authorize(Ability::CREATE->value, Flow::class);

        $rules = [
            'name' => ['required', 'string', 'max:128'],
            'description' => ['nullable', 'string'],
            'code' => [$strictContent ? 'required' : 'nullable', 'string'],
            'flow_type' => ['sometimes', Rule::in(['code', 'nodal'])],
            'nodal_graph' => ['sometimes', 'nullable', 'array', new ValidNodalGraph],
            'visibility' => ['sometimes', Rule::in($this->features->allowedScopes())],
            'team_id' => ['nullable', 'string'],
            'folder_id' => ['nullable', 'string'],
            'workspace_folder_id' => ['nullable', 'string'],
            'is_published' => ['sometimes', 'boolean'],
            'available_in_mcp' => ['sometimes', 'boolean'],
            'queue_index' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:'.config()->integer('puppetflow.queues_counter', 1)],
            'proxy_mode' => ['sometimes', Rule::in(['none', 'auto', 'specific'])],
            'workspace_proxy_id' => [
                'nullable',
                'integer',
                'required_if:proxy_mode,specific',
                Rule::exists('workspace_proxies', 'id')->where('workspace_id', $workspace->id),
            ],
        ];
        $validated = validator($attributes, $rules)->validate();
        $data = array_intersect_key($attributes, array_flip((new Flow)->getFillable()));
        $data = [...$data, ...$validated];
        $flowType = (string) ($validated['flow_type'] ?? $workspace->default_flow_type ?? 'nodal');
        $data['flow_type'] = $flowType;
        $data['proxy_mode'] ??= 'none';
        if ($data['proxy_mode'] !== 'specific') {
            $data['workspace_proxy_id'] = null;
        } else {
            $proxyQuery = WorkspaceProxy::query()
                ->whereKey($data['workspace_proxy_id']);
            $this->sharedVisibility->applyUse(
                $proxyQuery,
                $this->contexts->for($user, $workspace->id),
                scopeColumn: 'visibility',
            );
            if (! $proxyQuery->lockForUpdate()->first() instanceof WorkspaceProxy) {
                throw ValidationException::withMessages([
                    'workspace_proxy_id' => 'The selected proxy is not available to you.',
                ]);
            }
        }
        if ($flowType === 'nodal' && ! array_key_exists('nodal_graph', $data) && is_array($workspace->default_flow_nodal_graph)) {
            $data['nodal_graph'] = $workspace->default_flow_nodal_graph;
        }
        if ($flowType === 'code' && ! array_key_exists('code', $data) && is_string($workspace->default_flow_code)) {
            $data['code'] = $workspace->default_flow_code;
        }
        if ($strictContent && $flowType === 'nodal' && empty($validated['nodal_graph'])) {
            validator([], ['nodal_graph' => ['required']])->validate();
        }

        $visibility = (string) ($data['visibility'] ?? 'owner');
        $teamId = $visibility === 'team' && isset($data['team_id']) ? $data['team_id'] : null;
        $folderId = $visibility === 'owner' && isset($data['folder_id']) ? $data['folder_id'] : null;
        $workspaceFolderId = in_array($visibility, ['workspace', 'team'], true) && isset($data['workspace_folder_id'])
            ? $data['workspace_folder_id']
            : null;

        $this->assignments->validate(
            $workspace->id,
            $user->id,
            $visibility,
            $teamId,
            $folderId,
            $workspaceFolderId,
        );

        return Flow::create([
            ...$data,
            'source_type' => 'code',
            'workspace_id' => $workspace->id,
            'owner_id' => $user->id,
            'visibility' => $visibility,
            'team_id' => $teamId,
            'folder_id' => $folderId,
            'workspace_folder_id' => $workspaceFolderId,
            'is_published' => (bool) ($data['is_published'] ?? ! $strictContent),
            'available_in_mcp' => (bool) ($data['available_in_mcp'] ?? false),
        ]);
    }
}
