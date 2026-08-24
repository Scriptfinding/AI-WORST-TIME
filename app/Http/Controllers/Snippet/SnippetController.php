<?php

/*
 * Explicit proprietary scope: the paid shared snippet scopes and private-library source branches in this file implement paid
 * Puppetflow features and are licensed under the Puppetflow Proprietary License.
 * See LICENSE_PROPRIETARY.md.
 */

namespace App\Http\Controllers\Snippet;

use App\Authorization\AuthorizationContextFactory;
use App\Authorization\ResourceAssignmentValidator;
use App\Authorization\ScopeEvaluator;
use App\Authorization\Visibility\SharedResourceVisibility;
use App\DTO\Library\LibraryBlueprint;
use App\DTO\Library\LibrarySnippetItem;
use App\Enums\Authorization\Ability;
use App\Http\Controllers\Controller;
use App\Models\Flow;
use App\Models\Snippet;
use App\Models\User;
use App\Models\WorkspaceTeam;
use App\Rules\ValidNodalGraph;
use App\Services\FeatureFlags\FeatureFlagService;
use App\Services\Library\LibraryCatalogService;
use App\Services\Library\LibrarySnippetReferenceRewriter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class SnippetController extends Controller
{
    public function __construct(
        private readonly AuthorizationContextFactory $authorizationContexts,
        private readonly SharedResourceVisibility $sharedVisibility,
        private readonly ScopeEvaluator $scopeEvaluator,
        private readonly ResourceAssignmentValidator $assignments,
        private readonly LibrarySnippetReferenceRewriter $snippetReferences,
    ) {}

    public function index(Request $request): Response
    {
        $workspaceId = $this->currentWorkspaceId();
        /** @var User $user */
        $user = $request->user();
        $context = $this->authorizationContexts->for($user, $workspaceId);
        $isAdmin = $this->scopeEvaluator->isAdministrator($context);

        if (! $this->features()->enabled('snippets_enabled')) {
            return Inertia::render('Snippet/Snippets', [
                'snippets' => [],
                'teams' => [],
                'isAdmin' => $isAdmin,
                'snippetGroups' => [],
            ]);
        }

        $query = Snippet::query()->where('stale', false);
        $this->sharedVisibility->applyView($query, $context);

        $snippetModels = $query
            ->with(['user:id,name', 'team:id,name'])
            ->orderBy('label')
            ->get();

        $ownerIds = $snippetModels->pluck('user_id')->filter()->unique()->values()->all();
        $ownerRoles = ! empty($ownerIds)
            ? DB::table('user_workspace')
                ->where('workspace_id', $workspaceId)
                ->whereIn('user_id', $ownerIds)
                ->pluck('role', 'user_id')
                ->all()
            : [];

        $snippets = $snippetModels->map(function (Snippet $s) use ($ownerRoles) {
            return array_merge($s->toArray(), [
                'owner_workspace_role' => $ownerRoles[$s->user_id] ?? 'member',
                'user_id' => $s->user?->id,
                'library_latest_source_sha' => null,
                'library_update_available' => false,
            ]);
        });

        $teams = $this->features()->teamsEnabled()
            ? WorkspaceTeam::where('workspace_id', $workspaceId)->orderBy('name')->get(['id', 'name'])
            : collect();

        // Same visibility scope as the loaded collection, so derive the
        // groups in memory instead of re-querying.
        $snippetGroups = $snippetModels
            ->pluck('group')
            ->filter()
            ->unique()
            ->sort()
            ->values()
            ->all();

        return Inertia::render('Snippet/Snippets', [
            'snippets' => $snippets,
            'teams' => $teams,
            'isAdmin' => $isAdmin,
            'snippetGroups' => $snippetGroups,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->features()->abortIfDisabled('snippets_enabled');
        Gate::authorize(Ability::CREATE->value, Snippet::class);
        $workspaceId = $this->currentWorkspaceId();

        /** @var array{label: string, description?: string|null, group?: string|null, args?: string|null, code?: string|null, snippet_type?: string, nodal_graph?: array<mixed>|null, scope?: string, team_id?: string|null, is_active?: bool} $validated */
        $validated = $request->validate([
            'label' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'group' => 'nullable|string|max:255',
            'args' => 'nullable|string|max:500',
            'code' => 'nullable|string',
            'snippet_type' => 'sometimes|in:code,nodal',
            'nodal_graph' => ['nullable', 'array', new ValidNodalGraph('function')],
            'scope' => 'sometimes|in:'.implode(',', $this->features()->allowedScopes()),
            'team_id' => 'nullable|string',
            'is_active' => 'sometimes|boolean',
        ]);
        if (array_key_exists('team_id', $validated)) {
            $validated['team_id'] = $this->resolveWorkspaceTeamId($validated['team_id'], $workspaceId);
        }
        $snippetType = $validated['snippet_type'] ?? 'code';
        if ($snippetType === 'nodal') {
            validator($validated, ['nodal_graph' => ['required', 'array']])->validate();
            $this->validateNodalArguments($validated['args'] ?? '');
            if (trim($validated['code'] ?? '') === '') {
                throw ValidationException::withMessages(['code' => 'Nodal snippets must include compiled code.']);
            }
        }
        $nodalGraph = $snippetType === 'nodal' && is_array($validated['nodal_graph'] ?? null)
            ? $validated['nodal_graph']
            : null;

        $scope = $validated['scope'] ?? 'owner';
        $teamId = $scope === 'team' ? ($validated['team_id'] ?? null) : null;
        /** @var User $user */
        $user = $request->user();
        $ownerId = $user->id;
        $this->assignments->validate($workspaceId, $ownerId, $scope, $teamId, null, null);

        $snippet = Snippet::create([
            'workspace_id' => $workspaceId,
            'user_id' => $user->id,
            'label' => $validated['label'],
            'description' => $validated['description'] ?? null,
            'group' => isset($validated['group']) ? (trim($validated['group']) ?: null) : null,
            'args' => $validated['args'] ?? '',
            'code' => $validated['code'] ?? '',
            'snippet_type' => $snippetType,
            'nodal_graph' => $nodalGraph,
            'scope' => $scope,
            'team_id' => $teamId,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        $snippet->load('user:id,name', 'team:id,name');
        $this->injectOwnerWorkspaceRoles([$snippet], $workspaceId);

        return response()->json($snippet, 201);
    }

    public function update(Request $request, Snippet $snippet): JsonResponse
    {
        $this->features()->abortIfDisabled('snippets_enabled');
        $this->features()->abortIfStale($snippet);
        abort_unless($snippet->workspace_id === $this->currentWorkspaceId(), 404);
        Gate::authorize(Ability::UPDATE->value, $snippet);

        if ($request->has('snippet_type') && $request->input('snippet_type') !== $snippet->snippet_type) {
            abort(422, 'Snippet type cannot be changed after creation.');
        }

        /** @var array{label?: string, description?: string|null, group?: string|null, args?: string|null, code?: string|null, nodal_graph?: array<mixed>|null, scope?: string, team_id?: string|null, user_id?: string|null, is_active?: bool} $validated */
        $validated = $request->validate([
            'label' => 'sometimes|string|max:255',
            'description' => 'nullable|string|max:1000',
            'group' => 'nullable|string|max:255',
            'args' => 'nullable|string|max:500',
            'code' => 'nullable|string',
            'nodal_graph' => ['sometimes', 'nullable', 'array', new ValidNodalGraph('function')],
            'scope' => 'sometimes|in:'.implode(',', $this->features()->allowedScopes()),
            'team_id' => 'nullable|string',
            'user_id' => 'nullable|string|exists:users,id',
            'is_active' => 'sometimes|boolean',
        ]);
        if (array_key_exists('team_id', $validated)) {
            $validated['team_id'] = $this->resolveWorkspaceTeamId($validated['team_id'], $snippet->workspace_id);
        }
        if ($snippet->snippet_type === 'nodal' && array_key_exists('args', $validated)) {
            $this->validateNodalArguments($validated['args'] ?? '');
        }
        if ($snippet->snippet_type === 'code' && array_key_exists('nodal_graph', $validated) && $validated['nodal_graph'] !== null) {
            abort(422, 'Code snippets cannot contain a nodal graph.');
        }
        if ($snippet->snippet_type === 'nodal') {
            if (array_key_exists('nodal_graph', $validated) && $validated['nodal_graph'] === null) {
                throw ValidationException::withMessages(['nodal_graph' => 'Nodal snippets must keep their nodal graph.']);
            }
            if (array_key_exists('code', $validated) && trim($validated['code'] ?? '') === '') {
                throw ValidationException::withMessages(['code' => 'Nodal snippets must include compiled code.']);
            }
        }

        if (
            (isset($validated['scope']) && $validated['scope'] !== $snippet->scope)
            || (array_key_exists('team_id', $validated) && $validated['team_id'] !== $snippet->team_id)
        ) {
            Gate::authorize(Ability::MANAGE_SCOPE->value, $snippet);
        }

        $targetScope = $validated['scope'] ?? $snippet->scope;
        $targetTeamId = null;
        if ($targetScope === 'team') {
            $targetTeamId = $validated['team_id'] ?? $snippet->team_id;
            $validated['team_id'] = $targetTeamId;
        } elseif (isset($validated['scope']) || array_key_exists('team_id', $validated)) {
            $validated['team_id'] = null;
        }

        /** @var User $user */
        $user = $request->user();
        $ownerId = $this->resolveOwnerId($validated, $snippet->workspace_id, $snippet->user_id ?? $user->id);
        /** @var array{label?: string, description?: string|null, group?: string|null, args?: string|null, code?: string|null, nodal_graph?: array<mixed>|null, scope?: string, team_id?: string|null, user_id?: string|null, is_active?: bool} $validated */
        if (array_key_exists('code', $validated) && $validated['code'] === null) {
            $validated['code'] = '';
        }

        if ($snippet->library_locked && array_key_exists('code', $validated)) {
            abort_if($validated['code'] !== ($snippet->code ?? ''), 423, 'Duplicate this library snippet before editing its code.');
            unset($validated['code']);
        }
        if ($snippet->library_locked && array_key_exists('args', $validated)) {
            abort_if(($validated['args'] ?? '') !== ($snippet->args ?? ''), 423, 'Duplicate this library snippet before editing its arguments.');
            unset($validated['args']);
        }
        if ($snippet->library_locked && array_key_exists('nodal_graph', $validated)) {
            abort_if($validated['nodal_graph'] !== $snippet->nodal_graph, 423, 'Duplicate this library snippet before editing its graph.');
            unset($validated['nodal_graph']);
        }

        DB::transaction(function () use (
            $snippet,
            $validated,
            $ownerId,
            $targetScope,
            $targetTeamId,
        ) {
            $this->assignments->validate(
                $snippet->workspace_id,
                $ownerId,
                $targetScope,
                $targetTeamId,
                null,
                null,
            );
            $snippet->update($validated);
        });
        $snippet->load('user:id,name', 'team:id,name');
        $this->injectOwnerWorkspaceRoles([$snippet], $snippet->workspace_id);

        return response()->json($snippet);
    }

    public function destroy(Request $request, Snippet $snippet): JsonResponse
    {
        abort_unless($snippet->workspace_id === $this->currentWorkspaceId(), 404);
        Gate::authorize(Ability::DELETE->value, $snippet);

        abort_if(
            $this->snippetUsageCount($snippet) > 0,
            422,
            'This snippet cannot be deleted because it is still used by a flow or another snippet.',
        );
        $snippet->delete();

        return response()->json(['message' => 'Snippet deleted.']);
    }

    public function destroyBatch(Request $request): JsonResponse
    {
        $workspaceId = $this->currentWorkspaceId();
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => [
                'string',
                'distinct',
                \Illuminate\Validation\Rule::exists('snippets', 'id')
                    ->where('workspace_id', $workspaceId),
            ],
        ]);

        /** @var list<string> $ids */
        $ids = $validated['ids'];
        $snippets = Snippet::query()->whereIn('id', $ids)->orderBy('id')->get();

        foreach ($snippets as $snippet) {
            Gate::authorize(Ability::DELETE->value, $snippet);
        }

        /** @var list<string> $selectedIds */
        $selectedIds = $snippets->pluck('id')->all();
        foreach ($snippets as $snippet) {
            abort_if(
                $this->snippetUsageCount($snippet, $selectedIds) > 0,
                422,
                "The snippet \"{$snippet->label}\" cannot be deleted because it is still in use.",
            );
        }

        DB::transaction(fn () => $snippets->each->delete(), 3);

        return response()->json([
            'message' => $snippets->count() === 1
                ? 'Snippet deleted.'
                : $snippets->count().' snippets deleted.',
        ]);
    }

    public function updateLibrarySource(Request $request, Snippet $snippet, LibraryCatalogService $catalog): JsonResponse
    {
        $this->features()->abortIfDisabled('snippets_enabled');
        $this->features()->abortIfStale($snippet);
        abort_unless($snippet->workspace_id === $this->currentWorkspaceId(), 404);
        Gate::authorize(Ability::UPDATE->value, $snippet);

        abort_unless($snippet->library_namespace && $snippet->library_reference, 404);

        /** @var User $user */
        $user = $request->user();
        $item = $catalog->findChild('snippet', $snippet->library_namespace, $snippet->library_reference, refresh: true, workspaceId: $snippet->workspace_id, userId: $user->id, catalogKey: $snippet->library_external_key);
        if (! $item instanceof LibrarySnippetItem) {
            abort(404, 'Library source not found.');
        }
        $blueprint = $catalog->findParentBlueprint(
            $snippet->library_namespace,
            $snippet->library_external_key,
            $snippet->workspace_id,
            $user->id,
        );
        abort_if(
            $item->snippetType === 'nodal' && ($item->nodalGraph === null || trim($item->code ?? '') === ''),
            422,
            'Nodal library snippets must include a graph and compiled code.',
        );
        $requiredSnippetConventions = $this->snippetReferences->references($item->code, $item->nodalGraph);
        $snippetRewrites = $this->snippetReferences->mapForWorkspace(
            $snippet->workspace_id,
            $user,
            conventions: $requiredSnippetConventions,
        );
        $code = $this->snippetReferences->code($item->code ?? '', $snippetRewrites);
        $nodalGraph = $item->snippetType === 'nodal'
            ? $this->snippetReferences->graph($item->nodalGraph, $snippetRewrites)
            : null;
        $this->snippetReferences->assertKnownReferencesResolved(
            $code,
            $nodalGraph,
            $blueprint instanceof LibraryBlueprint ? $blueprint->snippets : [],
        );

        DB::transaction(function () use ($snippet, $item, $code, $nodalGraph): void {
            $snippet->update([
                'args' => $item->args,
                'code' => $code,
                'snippet_type' => $item->snippetType,
                'nodal_graph' => $nodalGraph,
                'library_source_path' => $item->sourcePath ?: $snippet->library_source_path,
                'library_source_sha' => $item->sourceSha ?: $snippet->library_source_sha,
                'library_source_url' => $item->sourceUrl ?: $snippet->library_source_url,
                'library_imported_at' => now(),
            ]);
        });

        $snippet->load('user:id,name', 'team:id,name');
        $this->injectOwnerWorkspaceRoles(collect([$snippet]), $snippet->workspace_id);
        $this->withLibraryUpdateState($snippet, $catalog);

        return response()->json($snippet);
    }

    public function checkLibrarySourceUpdate(Request $request, Snippet $snippet, LibraryCatalogService $catalog): JsonResponse
    {
        $this->features()->abortIfDisabled('snippets_enabled');
        $this->features()->abortIfStale($snippet);
        abort_unless($snippet->workspace_id === $this->currentWorkspaceId(), 404);
        Gate::authorize(Ability::UPDATE->value, $snippet);

        abort_unless($snippet->library_namespace && $snippet->library_reference, 404);

        $this->withLibraryUpdateState($snippet, $catalog, refresh: true);

        return response()->json([
            'library_latest_source_sha' => $snippet->library_latest_source_sha,
            'library_update_available' => $snippet->library_update_available,
        ]);
    }

    public function suggestions(Request $request): JsonResponse
    {
        if (! $this->features()->enabled('snippets_enabled')) {
            return response()->json([]);
        }

        $workspaceId = $this->currentWorkspaceId();
        /** @var User $user */
        $user = $request->user();
        $context = $this->authorizationContexts->for($user, $workspaceId);

        $query = Snippet::query()
            ->where('is_active', true)
            ->where('stale', false);
        $this->sharedVisibility->applyUse($query, $context);
        $snippets = $query
            ->orderBy('label')
            ->get(['id', 'label', 'args', 'description']);

        return response()->json($snippets->map(fn ($s) => [
            'id' => $s->id,
            'label' => $s->label,
            'args' => $s->args ?? '',
            'description' => $s->description,
            'edit_url' => route('snippets.index', ['s' => $s->id], false),
        ])->values());
    }

    public function export(Request $request): JsonResponse
    {
        if (! $this->features()->enabled('snippets_enabled')) {
            return response()->json([]);
        }

        $validated = $request->validate([
            'references' => 'required|array|max:100',
            'references.*' => ['required', 'string', 'max:100', 'regex:/^[a-zA-Z0-9_]+$/'],
        ]);

        $workspaceId = $this->currentWorkspaceId();
        /** @var list<string> $references */
        $references = array_values(array_unique($validated['references']));
        /** @var User $user */
        $user = $request->user();
        $context = $this->authorizationContexts->for($user, $workspaceId);

        $query = Snippet::query()
            ->where('is_active', true)
            ->where('stale', false)
            ->whereIn('id', $references);
        $this->sharedVisibility->applyUse($query, $context);
        $snippets = $query
            ->get(['id', 'label', 'args', 'description', 'code', 'snippet_type', 'nodal_graph'])
            ->keyBy('id');

        return response()->json(collect($references)
            ->map(fn ($reference) => $snippets->get($reference))
            ->filter()
            ->map(fn (Snippet $snippet) => [
                'id' => $snippet->id,
                'label' => $snippet->label,
                'args' => $snippet->args ?? '',
                'description' => $snippet->description,
                'code' => $snippet->code ?? '',
                'snippet_type' => $snippet->snippet_type ?? 'code',
                'nodal_graph' => $snippet->nodal_graph,
            ])
            ->values());
    }

    private function withLibraryUpdateState(Snippet $snippet, LibraryCatalogService $catalog, bool $refresh = false): void
    {
        $latest = null;
        if ($snippet->library_namespace && $snippet->library_reference) {
            $latest = $catalog->findChild('snippet', $snippet->library_namespace, $snippet->library_reference, refresh: $refresh, workspaceId: $snippet->workspace_id, userId: request()->user()?->id, catalogKey: $snippet->library_external_key);
        }

        $latestSha = $latest?->sourceSha;
        $snippet->setAttribute('library_latest_source_sha', $latestSha);
        $snippet->setAttribute('library_update_available', (bool) (
            $latestSha
            && $snippet->library_source_sha
            && $latestSha !== $snippet->library_source_sha
        ));
    }

    public function usages(Request $request, Snippet $snippet): JsonResponse
    {
        $this->features()->abortIfStale($snippet);
        abort_unless($snippet->workspace_id === $this->currentWorkspaceId(), 404);
        Gate::authorize(Ability::UPDATE->value, $snippet);

        $patterns = $this->snippetRefPatterns($snippet->id);

        $flows = Flow::where('workspace_id', $snippet->workspace_id)
            ->where(fn ($query) => $query->whereNotNull('code')->orWhereNotNull('nodal_graph'))
            ->get([
                'id', 'name', 'code', 'nodal_graph',
                'workspace_id', 'owner_id', 'visibility', 'team_id',
                'icon_type', 'icon_value', 'icon_color', 'icon_upload_path',
            ]);

        $flowUsages = [];
        /** @var User $user */
        $user = $request->user();
        foreach ($flows as $flow) {
            if (! $user->can(Ability::VIEW->value, $flow)) {
                continue;
            }

            foreach ($patterns as $pattern) {
                $graph = is_array($flow->nodal_graph) ? (json_encode($flow->nodal_graph) ?: '') : '';
                if (preg_match($pattern, $flow->code ?? '') === 1 || preg_match($pattern, $graph) === 1) {
                    $flowUsages[] = [
                        'type' => 'flow',
                        'flow_id' => $flow->id,
                        'flow_name' => $flow->name,
                        'icon_type' => $flow->icon_type,
                        'icon_value' => $flow->icon_value,
                        'icon_color' => $flow->icon_color,
                        'icon_url' => $flow->icon_url,
                    ];
                    break;
                }
            }
        }

        $otherSnippets = Snippet::where('workspace_id', $snippet->workspace_id)
            ->where('id', '!=', $snippet->id)
            ->where('stale', false)
            ->where(fn ($query) => $query->whereNotNull('code')->orWhereNotNull('nodal_graph'))
            ->get(['id', 'label', 'code', 'nodal_graph', 'workspace_id', 'user_id', 'scope', 'team_id']);

        $snippetUsages = [];
        foreach ($otherSnippets as $other) {
            if (! $user->can(Ability::VIEW->value, $other)) {
                continue;
            }

            foreach ($patterns as $pattern) {
                $graph = is_array($other->nodal_graph) ? (json_encode($other->nodal_graph) ?: '') : '';
                if (preg_match($pattern, $other->code ?? '') === 1 || preg_match($pattern, $graph) === 1) {
                    $snippetUsages[] = [
                        'type' => 'snippet',
                        'id' => $other->id,
                        'label' => $other->label,
                    ];
                    break;
                }
            }
        }

        return response()->json(array_merge($flowUsages, $snippetUsages));
    }

    /** @return list<string> */
    private function snippetRefPatterns(string $id): array
    {
        return [
            '~'.preg_quote('$$'.$id, '~').'\s*\(~',
            '~"'.preg_quote('$$'.$id, '~').'"~',
        ];
    }

    /** @param list<string> $excludedSnippetIds */
    private function snippetUsageCount(Snippet $snippet, array $excludedSnippetIds = []): int
    {
        $patterns = $this->snippetRefPatterns($snippet->id);
        $count = 0;
        $flows = Flow::query()
            ->where('workspace_id', $snippet->workspace_id)
            ->where(fn ($query) => $query->whereNotNull('code')->orWhereNotNull('nodal_graph'))
            ->get(['code', 'nodal_graph']);

        foreach ($flows as $flow) {
            if ($this->containsSnippetReference($flow->code, $flow->nodal_graph, $patterns)) {
                $count++;
            }
        }

        $otherSnippets = Snippet::query()
            ->where('workspace_id', $snippet->workspace_id)
            ->where('id', '!=', $snippet->id)
            ->whereNotIn('id', $excludedSnippetIds)
            ->where('stale', false)
            ->where(fn ($query) => $query->whereNotNull('code')->orWhereNotNull('nodal_graph'))
            ->get(['code', 'nodal_graph']);

        foreach ($otherSnippets as $other) {
            if ($this->containsSnippetReference($other->code, $other->nodal_graph, $patterns)) {
                $count++;
            }
        }

        return $count;
    }

    /**
     * @param  array<string, mixed>|null  $graph
     * @param  list<string>  $patterns
     */
    private function containsSnippetReference(?string $code, ?array $graph, array $patterns): bool
    {
        $encodedGraph = is_array($graph) ? (json_encode($graph) ?: '') : '';
        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $code ?? '') === 1 || preg_match($pattern, $encodedGraph) === 1) {
                return true;
            }
        }

        return false;
    }

    private function features(): FeatureFlagService
    {
        return app(FeatureFlagService::class);
    }

    private function validateNodalArguments(string $args): void
    {
        $parameters = array_values(array_filter(array_map('trim', explode(',', $args)), fn (string $arg): bool => $arg !== ''));
        $reserved = [
            'await', 'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger',
            'default', 'delete', 'do', 'else', 'enum', 'export', 'extends', 'false',
            'finally', 'for', 'function', 'if', 'import', 'in', 'instanceof', 'let',
            'new', 'null', 'return', 'static', 'super', 'switch', 'this', 'throw',
            'true', 'try', 'typeof', 'var', 'void', 'while', 'with', 'yield',
            '$page', '$input', '$nodes', '$run', '$output', '$context', '$json',
            '$vars', '$userOutput', '$renderExpression', '$keyboardSpeed',
            '$viewportWidth', '$viewportHeight',
        ];
        if (count($parameters) !== count(array_unique($parameters))) {
            throw ValidationException::withMessages(['args' => 'Nodal snippet arguments must be unique.']);
        }

        foreach ($parameters as $parameter) {
            if (
                preg_match('/^[A-Za-z_$][A-Za-z0-9_$]*$/', $parameter) !== 1
                || in_array($parameter, $reserved, true)
                || str_starts_with($parameter, '__pf')
                || str_starts_with($parameter, 'nodeResult')
            ) {
                throw ValidationException::withMessages([
                    'args' => 'Nodal snippet arguments must be JavaScript identifiers and cannot use reserved visual-runtime names.',
                ]);
            }
        }
    }

    private function currentWorkspaceId(): string
    {
        $currentWorkspaceId = $this->workspaceIdFromSession();

        return $currentWorkspaceId;
    }
}
