<?php

/*
 * Explicit proprietary scope: repository-backed flows, team/workspace sharing,
 * paid visibility scopes and private-library branches in this controller are
 * licensed under the Puppetflow Proprietary License. See LICENSE_PROPRIETARY.md.
 */

namespace App\Http\Controllers\Flow;

use App\Authorization\AuthorizationContextFactory;
use App\Authorization\OnBehalfOwnerResolver;
use App\Authorization\ResourceAssignmentValidator;
use App\Authorization\Visibility\SharedResourceVisibility;
use App\Enums\Authorization\Ability;
use App\Http\Controllers\Controller;
use App\Http\Requests\Flow\StoreFlowRequest;
use App\Http\Requests\Flow\UpdateFlowRequest;
use App\Models\Flow;
use App\Models\FlowRepositoryLink;
use App\Models\Folder;
use App\Models\Integration;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceProxy;
use App\Services\FeatureFlags\FeatureFlagService;
use App\Services\Flow\FlowCreationService;
use App\Services\Flow\FlowPlacementService;
use App\Services\Flow\FlowRepositoryLinkService;
use App\Services\Flow\Query\FlowEditorQuery;
use App\Services\Flow\Query\FlowExplorerQuery;
use App\Services\Flow\Query\FlowTreeBuilder;
use App\Services\Library\BlueprintInputSchemaService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

final class FlowController extends Controller
{
    public function __construct(
        private readonly FlowExplorerQuery $explorer,
        private readonly FlowEditorQuery $editor,
        private readonly FlowTreeBuilder $trees,
        private readonly AuthorizationContextFactory $contexts,
        private readonly SharedResourceVisibility $sharedVisibility,
        private readonly FeatureFlagService $features,
        private readonly ResourceAssignmentValidator $assignments,
        private readonly FlowCreationService $creation,
        private readonly FlowRepositoryLinkService $repositoryLinks,
        private readonly FlowPlacementService $placement,
        private readonly BlueprintInputSchemaService $inputSchemas,
        private readonly OnBehalfOwnerResolver $onBehalfOwners,
    ) {}

    public function index(Request $request): Response
    {
        return $this->explorer->render($request, $this->workspaceId(), $this->user($request));
    }

    public function create(Request $request): Response
    {
        $workspaceId = $this->workspaceId();
        $user = $this->user($request);
        $context = $this->contexts->for($user, $workspaceId);
        $repositoryQuery = Integration::query()->where('category', 'repository')
            ->where('is_active', true)->where('stale', false)->orderBy('name');
        $this->sharedVisibility->applyUse($repositoryQuery, $context);
        $repositories = $this->features->enabled('vcs_enabled')
            ? $repositoryQuery->get()->filter(fn ($integration) => $integration->provider_status === 'connected')->values()
            : collect();
        $folderId = trim($request->string('folder_id')->toString());
        $folderTeamId = null;
        $folder = null;
        if ($folderId !== '') {
            $folder = Folder::where('workspace_id', $workspaceId)
                ->where('id', $folderId)
                ->first();
            abort_unless($folder instanceof Folder, 404);
            $folderTeamId = $folder->team?->id;
        }
        // Instance admins can create flows on behalf of another user when
        // browsing that user's personal space in the explorer.
        $requestedOwnerId = $folder && ! $folder->is_shared
            ? $folder->owner_id
            : null;
        if ($requestedOwnerId === null && $request->filled('owner_id')) {
            $requestedOwnerId = User::workspaceMemberId($request->string('owner_id')->toString(), $workspaceId);
            abort_unless($requestedOwnerId !== null, 404);
        }
        $personalOwner = $this->onBehalfOwners->resolveOrFallback($user, $workspaceId, $requestedOwnerId);

        return Inertia::render('Flow/FlowCreate/FlowCreate', [
            'personalTree' => $this->trees->personal($workspaceId, $personalOwner),
            'defaultOwnerId' => $personalOwner->id === $user->id ? null : $personalOwner->id,
            'defaultFolderId' => $folder?->id,
            'defaultFolderTeamId' => $folderTeamId,
            'repositoryIntegrations' => $repositories,
            'workspaceTree' => $this->trees->workspace($workspaceId, $user),
            'teamTrees' => $this->trees->teams($workspaceId, $user, $this->trees->visibleTeamIds($context, $workspaceId)),
            'view' => $request->input('view'),
        ]);
    }

    public function store(StoreFlowRequest $request): RedirectResponse
    {
        $workspaceId = $this->workspaceId();
        $user = $this->user($request);
        /** @var array{
         *   name: string, description?: string|null, visibility?: string,
         *   team_id?: string|null, owner_id?: string|null,
         *   folder_id?: string|null,
         *   workspace_folder_id?: string|null, source_type?: string,
         *   proxy_mode?: string, workspace_proxy_id?: int|null,
         *   repo_link?: array{integration_id: string, repo_full_name: string, branch: string, file_path?: string|null}|null,
         *   ...
         * } $validated
         */
        $validated = $request->validated();
        $validated['proxy_mode'] ??= 'none';
        if ($validated['proxy_mode'] !== 'specific') {
            $validated['workspace_proxy_id'] = null;
        }
        if (array_key_exists('team_id', $validated)) {
            $validated['team_id'] = $this->resolveWorkspaceTeamId($validated['team_id'], $workspaceId);
        }
        if (array_key_exists('folder_id', $validated)) {
            $validated['folder_id'] = $this->resolveWorkspaceFolderId($validated['folder_id'], $workspaceId);
        }
        if (array_key_exists('workspace_folder_id', $validated)) {
            $validated['workspace_folder_id'] = $this->resolveWorkspaceFolderId($validated['workspace_folder_id'], $workspaceId, 'workspace_folder_id');
        }
        $requestedOwnerId = $validated['owner_id'] ?? null;
        unset($validated['owner_id']);
        $data = [...$validated, 'workspace_id' => $workspaceId, 'owner_id' => $user->id];
        $data['visibility'] ??= 'owner';
        if ($data['visibility'] === 'owner' && is_string($requestedOwnerId)) {
            // Only instance admins may create a personal flow for another
            // member of the current workspace.
            $requestedOwnerId = User::workspaceMemberId($requestedOwnerId, $workspaceId);
            abort_unless($requestedOwnerId !== null, 404);
            $data['owner_id'] = $this->onBehalfOwners
                ->resolveOrFail($user, $workspaceId, $requestedOwnerId)
                ->id;
        }
        if ($data['visibility'] === 'workspace') {
            $data['folder_id'] = null;
            $data['team_id'] = null;
        } elseif ($data['visibility'] === 'team') {
            $data['folder_id'] = null;
            $data['team_id'] = $validated['team_id'] ?? null;
        } else {
            $data['workspace_folder_id'] = null;
            $data['team_id'] = null;
        }
        $this->assignments->validate(
            $workspaceId,
            $data['owner_id'],
            $data['visibility'],
            $validated['team_id'] ?? null,
            $data['folder_id'] ?? null,
            $data['workspace_folder_id'] ?? null,
        );
        $repoLink = $validated['repo_link'] ?? null;
        $repositoryIntegration = null;
        if (($validated['source_type'] ?? null) === 'repository') {
            $this->features->abortIfDisabled('vcs_enabled');
            if ($repoLink !== null) {
                $repositoryIntegration = $this->repositoryLinks->availableIntegration(
                    $workspaceId,
                    $repoLink['integration_id'],
                );
            }
        }
        $flow = DB::transaction(function () use ($validated, $workspaceId, $user, $data, $repoLink, $repositoryIntegration): Flow {
            if (
                ($validated['source_type'] ?? 'code') === 'repository'
                && $validated['proxy_mode'] === 'specific'
            ) {
                $this->ensureProxyAccessible($validated['workspace_proxy_id'] ?? null, $workspaceId, $user);
            }
            $flow = ($validated['source_type'] ?? 'code') === 'repository'
                ? Flow::create($data)
                : $this->creation->create($data, $user, Workspace::findOrFail($workspaceId));
            if (($validated['source_type'] ?? null) === 'repository' && $repoLink !== null) {
                abort_unless($repositoryIntegration instanceof Integration, 422);
                FlowRepositoryLink::create([
                    'flow_id' => $flow->id,
                    'integration_id' => $repositoryIntegration->id,
                    'repo_full_name' => $repoLink['repo_full_name'],
                    'branch' => $repoLink['branch'],
                    'file_path' => $repoLink['file_path'] ?? '',
                ]);
            }

            return $flow;
        }, 3);

        return redirect()->to(route('flows.show', $flow).'#code')->with('success', 'Flow created.');
    }

    public function show(Request $request, Flow $flow): Response
    {
        abort_unless($flow->workspace_id === $this->workspaceId(), 404);
        $this->authorize(Ability::VIEW->value, $flow);

        return $this->editor->render($request, $flow, $this->user($request));
    }

    public function update(UpdateFlowRequest $request, Flow $flow): RedirectResponse
    {
        abort_unless($flow->workspace_id === $this->workspaceId(), 404);
        $this->authorize(Ability::UPDATE->value, $flow);
        $user = $this->user($request);
        $data = $request->validated();
        $proxyMode = $data['proxy_mode'] ?? $flow->proxy_mode ?? 'none';
        $requestedProxyId = array_key_exists('workspace_proxy_id', $data)
            ? $data['workspace_proxy_id']
            : $flow->workspace_proxy_id;
        $proxyConfigurationChanged = $proxyMode !== ($flow->proxy_mode ?? 'none')
            || $requestedProxyId !== $flow->workspace_proxy_id;
        if ($proxyMode !== 'specific') {
            $data['workspace_proxy_id'] = null;
        }
        if (array_key_exists('folder_id', $data)) {
            $data['folder_id'] = $this->resolveWorkspaceFolderId(
                is_string($data['folder_id']) ? $data['folder_id'] : null,
                $flow->workspace_id,
            );
        }
        if (array_key_exists('workspace_folder_id', $data)) {
            $data['workspace_folder_id'] = $this->resolveWorkspaceFolderId(
                is_string($data['workspace_folder_id']) ? $data['workspace_folder_id'] : null,
                $flow->workspace_id,
                'workspace_folder_id',
            );
        }
        if (
            (isset($data['visibility']) && $data['visibility'] !== $flow->visibility)
            || (array_key_exists('folder_id', $data) && ($data['folder_id'] ?? 0) !== ($flow->folder_id ?? 0))
            || (array_key_exists('workspace_folder_id', $data) && ($data['workspace_folder_id'] ?? 0) !== ($flow->workspace_folder_id ?? 0))
        ) {
            Gate::authorize(Ability::MANAGE_SCOPE->value, $flow);
        }
        $this->resolveOwnerId($data, $flow->workspace_id, $flow->owner_id, 'owner_id');
        if (isset($data['owner_id']) && $data['owner_id'] !== $flow->owner_id
            && $flow->visibility === 'owner' && ! array_key_exists('folder_id', $data)) {
            $data['folder_id'] = null;
        }
        $ownerId = $data['owner_id'] ?? $flow->owner_id;
        $visibility = $data['visibility'] ?? $flow->visibility;
        $folderId = array_key_exists('folder_id', $data) ? $data['folder_id'] : $flow->folder_id;
        $workspaceFolderId = array_key_exists('workspace_folder_id', $data)
            ? $data['workspace_folder_id']
            : $flow->workspace_folder_id;
        if (
            ! is_string($ownerId)
            || ! is_string($visibility)
            || (! is_string($folderId) && $folderId !== null)
            || (! is_string($workspaceFolderId) && $workspaceFolderId !== null)
        ) {
            throw new \LogicException('Flow assignment contains invalid values.');
        }
        $this->assignments->validate(
            $flow->workspace_id,
            $ownerId,
            $visibility,
            $flow->team_id,
            $folderId,
            $workspaceFolderId,
        );
        $this->applyLimits($flow, $data);
        if (
            array_key_exists('default_inputs', $data)
            && $flow->library_namespace
            && (is_array($flow->blueprint_input_definitions) || $flow->flow_type === 'code')
        ) {
            $definitions = $this->inputSchemas->currentDefinitions($flow);
            // An empty schema means free-form inputs; never wipe user values in that case.
            if ($definitions !== []) {
                $data['default_inputs'] = $this->inputSchemas->sanitize(
                    $definitions,
                    is_array($data['default_inputs']) ? $data['default_inputs'] : [],
                ) ?: null;
            }
        }
        DB::transaction(function () use ($proxyMode, $proxyConfigurationChanged, $requestedProxyId, $flow, $user, $data): void {
            if ($proxyMode === 'specific' && $proxyConfigurationChanged) {
                $this->ensureProxyAccessible(
                    is_int($requestedProxyId) ? $requestedProxyId : null,
                    $flow->workspace_id,
                    $user,
                );
            }
            $this->placement->update($flow, $data);
        }, 3);

        return back()->with('success', 'Flow updated.');
    }

    private function ensureProxyAccessible(
        ?int $proxyId,
        string $workspaceId,
        User $user,
    ): void {
        if ($proxyId === null) {
            throw ValidationException::withMessages([
                'workspace_proxy_id' => 'Select a proxy.',
            ]);
        }

        $query = WorkspaceProxy::query()->whereKey($proxyId);
        $this->sharedVisibility->applyUse(
            $query,
            $this->contexts->for($user, $workspaceId),
            scopeColumn: 'visibility',
        );

        if (! $query->lockForUpdate()->first() instanceof WorkspaceProxy) {
            throw ValidationException::withMessages([
                'workspace_proxy_id' => 'The selected proxy is not available to you.',
            ]);
        }
    }

    public function destroy(Request $request, Flow $flow): RedirectResponse
    {
        $this->authorize(Ability::DELETE->value, $flow);
        $validated = $request->validate(['redirect_url' => ['nullable', 'string']]);
        $deleted = DB::transaction(function () use ($flow): bool {
            $locked = Flow::whereKey($flow->getKey())->lockForUpdate()->first();

            return $locked instanceof Flow && ! $locked->hasActiveRuns() && (bool) $locked->delete();
        }, 3);
        if (! $deleted) {
            return back()->with('error', 'Cannot delete a flow with an active or cancellation-requested run.');
        }
        $url = $validated['redirect_url'] ?? null;
        if (is_string($url) && ($url === '/flows' || str_starts_with($url, '/flows?'))) {
            return redirect($url)->with('success', 'Flow deleted.');
        }

        return redirect()->route('flows.index')->with('success', 'Flow deleted.');
    }

    /** @param array<string, mixed> $data */
    private function applyLimits(Flow $flow, array &$data): void
    {
        if (isset($data['runs_retention_limit'])) {
            $max = $flow->workspace?->getEffectiveRetentionMax() ?? 0;
            if ($max > 0) {
                $data['runs_retention_limit'] = $data['runs_retention_limit'] > 0
                    ? min($data['runs_retention_limit'], $max) : $max;
            }
        }
        if (isset($data['timeout_seconds'])) {
            $max = $flow->getEffectiveMaxTimeoutSeconds();
            if ($max > 0) {
                $data['timeout_seconds'] = $data['timeout_seconds'] > 0 ? min($data['timeout_seconds'], $max) : $max;
            }
        }
        if (isset($data['max_retries'])) {
            $workspace = $flow->workspace;
            if (! $workspace instanceof Workspace) {
                throw new \LogicException('Flow workspace relation is missing.');
            }
            $configuredMax = max(0, $workspace->max_retries_max ?? 0);
            $max = $workspace->getEffectiveMaxRetriesLimit();
            $data['max_retries'] = $configuredMax > 0 && $data['max_retries'] === 0
                ? $max : min($data['max_retries'], $max);
        }
    }

    private function workspaceId(): string
    {
        return $this->workspaceIdFromSession();
    }

    private function user(Request $request): User
    {
        $user = $request->user();
        if (! $user instanceof User) {
            abort(401);
        }

        return $user;
    }
}
