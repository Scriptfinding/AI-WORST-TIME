<?php

/*
 * Explicit proprietary scope: the paid private-repository and shared destination branches in this file implement paid
 * Puppetflow features and are licensed under the Puppetflow Proprietary License.
 * See LICENSE_PROPRIETARY.md.
 */

namespace App\Http\Controllers\Library;

use App\Authorization\ResourceAssignmentValidator;
use App\DTO\Library\LibraryBlueprint;
use App\DTO\Library\LibraryFlowItem;
use App\DTO\Library\LibraryImportOverrides;
use App\DTO\Library\LibrarySnippetItem;
use App\Enums\Authorization\Ability;
use App\Http\Controllers\Controller;
use App\Models\Flow;
use App\Models\Snippet;
use App\Models\User;
use App\Services\FeatureFlags\FeatureFlagService;
use App\Services\Library\BlueprintAppearanceService;
use App\Services\Library\LibraryCatalogService;
use App\Services\Library\LibraryExternalClient;
use App\Services\Library\LibrarySnippetReferenceRewriter;
use App\Services\Workspace\Identity\IdentityRows;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class LibraryController extends Controller
{
    public function __construct(
        private readonly LibraryCatalogService $catalog,
        private readonly LibraryExternalClient $externalClient,
        private readonly ResourceAssignmentValidator $assignments,
        private readonly BlueprintAppearanceService $appearance,
        private readonly LibrarySnippetReferenceRewriter $snippetReferences,
        private readonly IdentityRows $identityRows,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'type' => ['nullable', 'in:flow,snippet'],
            'search' => ['nullable', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:255'],
            'sort' => ['nullable', 'in:popular,downloaded,liked,newest,used'],
            'refresh' => ['nullable', 'boolean'],
        ]);

        $workspaceId = $this->currentWorkspaceId();
        /** @var User $user */
        $user = $request->user();
        $sort = $request->string('sort', 'popular')->toString();
        $catalog = $this->catalog->items(
            $request->filled('type') ? $request->string('type')->toString() : null,
            $request->filled('search') ? $request->string('search')->toString() : null,
            $request->filled('category') ? $request->string('category')->toString() : null,
            $sort,
            $request->boolean('refresh'),
            $this->externalClient->identityHash($workspaceId, $user->id),
            $workspaceId,
            $user->id,
        );

        return response()->json($this->withLocalUsage($catalog->toArray(), $sort));
    }

    public function import(Request $request, string $namespace): JsonResponse
    {
        /** @var array{
         *     flows?: list<string>,
         *     snippets?: list<string>,
         *     overrides?: array{
         *         name?: string|null,
         *         label?: string|null,
         *         reference?: string|null,
         *         description?: string|null,
         *         group?: string|null,
         *         visibility?: string|null,
         *         scope?: string|null,
         *         team_id?: string|null,
         *         owner_id?: string|null
         *     }|null,
         *     scope?: string|null,
         *     team_id?: string|null
         * } $validated */
        $validated = $request->validate([
            'flows' => ['array'],
            'flows.*' => ['string'],
            'snippets' => ['array'],
            'snippets.*' => ['string'],
            'overrides' => ['nullable', 'array'],
            'overrides.name' => ['nullable', 'string', 'max:128'],
            'overrides.label' => ['nullable', 'string', 'max:255'],
            'overrides.description' => ['nullable', 'string', 'max:1000'],
            'overrides.group' => ['nullable', 'string', 'max:255'],
            'overrides.visibility' => ['nullable', 'in:'.implode(',', app(FeatureFlagService::class)->allowedScopes())],
            'overrides.scope' => ['nullable', 'in:'.implode(',', app(FeatureFlagService::class)->allowedScopes())],
            'overrides.team_id' => ['nullable', 'string'],
            'overrides.owner_id' => ['nullable', 'string', 'exists:users,id'],
            'scope' => ['nullable', 'in:'.implode(',', app(FeatureFlagService::class)->allowedScopes())],
            'team_id' => ['nullable', 'string'],
        ]);

        $workspaceId = $this->currentWorkspaceId();
        if (isset($validated['overrides']['owner_id'])) {
            $ownerId = User::workspaceMemberId($validated['overrides']['owner_id'], $workspaceId);
            abort_unless($ownerId !== null, 422, 'The selected owner is not a workspace member.');
            $validated['overrides']['owner_id'] = $ownerId;
        }
        if (array_key_exists('team_id', $validated)) {
            $validated['team_id'] = $this->resolveWorkspaceTeamId($validated['team_id'], $workspaceId);
        }
        if (isset($validated['overrides']) && array_key_exists('team_id', $validated['overrides'])) {
            $validated['overrides']['team_id'] = $this->resolveWorkspaceTeamId(
                $validated['overrides']['team_id'],
                $workspaceId,
            );
        }
        /** @var User $user */
        $user = $request->user();
        $blueprint = $this->catalog->findBlueprint($namespace, workspaceId: $workspaceId, userId: $user->id);
        if ($blueprint === null) {
            abort(404);
        }

        $requestedFlows = $validated['flows'] ?? [];
        $requestedSnippets = $validated['snippets'] ?? [];
        $selectedFlows = collect($blueprint->flows)
            ->filter(fn (LibraryFlowItem $item): bool => in_array($item->reference, $requestedFlows, true))
            ->values();
        $selectedSnippets = collect($blueprint->snippets)
            ->filter(fn (LibrarySnippetItem $item): bool => in_array($item->reference, $requestedSnippets, true))
            ->values();

        abort_if($selectedFlows->isEmpty() && $selectedSnippets->isEmpty(), 422, 'Select at least one flow or snippet.');

        $overrides = LibraryImportOverrides::fromValidated($validated['overrides'] ?? []);
        $ownerId = $overrides->ownerId($user->id);
        $snippetDefaultScope = $selectedFlows->isNotEmpty()
            ? $overrides->flowVisibility()
            : ($validated['scope'] ?? 'owner');
        $snippetDefaultTeamId = $selectedFlows->isNotEmpty()
            ? $overrides->flowTeamId()
            : ($validated['team_id'] ?? null);
        $snippetScope = $overrides->snippetScope($snippetDefaultScope);
        $snippetTeamId = $overrides->snippetTeamId($snippetScope, $snippetDefaultTeamId);
        $selectedSnippets = $this->withSnippetDependencies(
            $blueprint,
            $selectedFlows,
            $selectedSnippets,
            $workspaceId,
            $user,
            $ownerId,
            $snippetScope,
            $snippetTeamId,
        );
        if ($selectedSnippets->isNotEmpty()) {
            app(FeatureFlagService::class)->abortIfDisabled('snippets_enabled');
        }

        if ($selectedFlows->isNotEmpty()) {
            Gate::authorize(Ability::CREATE->value, Flow::class);
            $this->assignments->validate(
                $workspaceId,
                $ownerId,
                $overrides->flowVisibility(),
                $overrides->flowTeamId(),
            );
        }
        if ($selectedSnippets->isNotEmpty()) {
            Gate::authorize(Ability::CREATE->value, Snippet::class);
            $this->assignments->validate(
                $workspaceId,
                $ownerId,
                $snippetScope,
                $snippetTeamId,
            );
        }

        /** @var list<string> $flowReferences */
        $flowReferences = array_values($selectedFlows->map(fn (LibraryFlowItem $item): string => $item->reference)->all());
        /** @var list<string> $snippetReferences */
        $snippetReferences = array_values($selectedSnippets->map(fn (LibrarySnippetItem $item): string => $item->reference)->all());
        $selectedConventions = $selectedSnippets
            ->map(fn (LibrarySnippetItem $item): string => $this->snippetReferences->convention(
                $item->namespace ?: 'library',
                $item->reference ?: 'snippet',
            ))
            ->unique()
            ->values();

        $externalId = $blueprint->stats->id;

        [$snippets, $flows] = DB::transaction(function () use (
            $selectedSnippets,
            $selectedFlows,
            $blueprint,
            $workspaceId,
            $user,
            $externalId,
            $overrides,
            $snippetDefaultScope,
            $snippetDefaultTeamId,
            $flowReferences,
            $snippetReferences,
            $selectedConventions,
            $ownerId,
            $snippetScope,
            $snippetTeamId,
        ): array {
            $this->identityRows->users([$user->id, $ownerId]);
            $this->identityRows->workspaces([$workspaceId]);
            if ($selectedFlows->isNotEmpty()) {
                Gate::authorize(Ability::CREATE->value, Flow::class);
                $this->assignments->validate(
                    $workspaceId,
                    $ownerId,
                    $overrides->flowVisibility(),
                    $overrides->flowTeamId(),
                );
            }
            if ($selectedSnippets->isNotEmpty()) {
                Gate::authorize(Ability::CREATE->value, Snippet::class);
                $this->assignments->validate(
                    $workspaceId,
                    $ownerId,
                    $snippetScope,
                    $snippetTeamId,
                );
            }
            $this->abortIfAttachedChildrenAlreadyExist(
                $blueprint,
                $flowReferences,
                $snippetReferences,
                $workspaceId,
            );
            $installedSnippetConventions = $this->snippetReferences->mapForWorkspace(
                $workspaceId,
                $user,
                conventions: $selectedConventions->all(),
            );
            foreach ($selectedSnippets as $item) {
                $convention = $this->snippetReferences->convention(
                    $item->namespace ?: 'library',
                    $item->reference ?: 'snippet',
                );
                if (isset($installedSnippetConventions[$convention])) {
                    throw ValidationException::withMessages([
                        'library' => "The snippet reference \"{$convention}\" conflicts with an installed snippet.",
                    ]);
                }
            }

            $snippets = $selectedSnippets
                ->map(fn (LibrarySnippetItem $item): Snippet => $this->importSnippet(
                    $item,
                    $blueprint,
                    $workspaceId,
                    $user->id,
                    $externalId,
                    $overrides,
                    $snippetDefaultScope,
                    $snippetDefaultTeamId,
                ))
                ->values();

            $snippetRewrites = $this->snippetReferenceRewrites(
                $blueprint,
                $selectedFlows,
                $selectedSnippets,
                $snippets,
                $workspaceId,
                $user,
            );
            $snippets->each(function (Snippet $snippet) use ($snippetRewrites): void {
                $snippet->update([
                    'code' => $this->snippetReferences->code($snippet->code ?? '', $snippetRewrites),
                    'nodal_graph' => $snippet->snippet_type === 'nodal'
                        ? $this->snippetReferences->graph($snippet->nodal_graph, $snippetRewrites)
                        : null,
                ]);
            });
            $flows = $selectedFlows
                ->map(fn (LibraryFlowItem $item): Flow => $this->importFlow($item, $blueprint, $workspaceId, $user->id, $externalId, $overrides, $snippetRewrites))
                ->values();

            return [$snippets, $flows];
        }, 3);

        if (is_int($externalId) && $externalId > 0) {
            $this->externalClient->recordEvent(
                $externalId,
                'import',
                $this->externalClient->identityHash($workspaceId, $user->id),
                [
                    'namespace' => $namespace,
                    'flows' => $selectedFlows->map(fn (LibraryFlowItem $item): string => $item->reference)->values()->all(),
                    'snippets' => $selectedSnippets->map(fn (LibrarySnippetItem $item): string => $item->reference)->values()->all(),
                ],
            );
        }

        if ($flows->isNotEmpty()) {
            $firstFlow = $flows->first();
            $url = route('flows.show', $firstFlow).'#code';
        } else {
            $lastSnippet = $snippets->last();
            if (! $lastSnippet instanceof Snippet) {
                throw new \LogicException('Library import produced no resources.');
            }
            $url = route('snippets.index').'?s='.$lastSnippet->id;
        }

        return response()->json([
            'blueprint' => $blueprint->toArray(),
            'resources' => [
                'flows' => $flows,
                'snippets' => $snippets,
            ],
            'url' => $url,
        ], 201);
    }

    public function upvote(Request $request, string $namespace): JsonResponse
    {
        $workspaceId = $this->currentWorkspaceId();
        /** @var User $user */
        $user = $request->user();
        $blueprint = $this->catalog->findBlueprint($namespace, workspaceId: $workspaceId, userId: $user->id);
        if ($blueprint === null) {
            abort(404);
        }
        $statsId = $blueprint->stats->id;
        abort_if($blueprint->sourceKind === 'private', 422, 'Private libraries cannot be liked.');

        $externalId = $statsId;
        if ($externalId === null || $externalId <= 0) {
            abort(502, 'Library stats service is unavailable.');
        }

        $result = $this->externalClient->upvote(
            $externalId,
            $this->externalClient->identityHash($workspaceId, $user->id),
            ['namespace' => $namespace],
        );

        abort_unless($result !== null, 502, 'Library stats service is unavailable.');

        return response()->json($result);
    }

    /** @param array<string, string> $snippetRewrites */
    private function importFlow(LibraryFlowItem $item, LibraryBlueprint $blueprint, string $workspaceId, string $userId, ?int $externalId, LibraryImportOverrides $overrides, array $snippetRewrites = []): Flow
    {
        $visibility = $overrides->flowVisibility();

        $namespace = $item->namespace ?: 'library';
        $reference = $item->reference ?: 'flow';
        $label = $item->label ?: $reference;

        $code = $this->snippetReferences->code($item->code ?? '', $snippetRewrites);
        $nodalGraph = $item->flowType === 'nodal'
            ? $this->snippetReferences->graph($item->nodalGraph, $snippetRewrites)
            : null;

        $flow = Flow::create([
            'name' => $overrides->name ?? $label,
            'description' => $overrides->hasDescription ? ($overrides->description ?: null) : ($item->description ?? $blueprint->description),
            'code' => $code,
            'source_type' => 'library',
            'flow_type' => $item->flowType,
            'nodal_graph' => $nodalGraph,
            'default_inputs' => $item->defaultInputs ?: null,
            'blueprint_input_definitions' => $item->inputDefinitions,
            'workspace_id' => $workspaceId,
            'owner_id' => $overrides->ownerId($userId),
            'visibility' => $visibility,
            'team_id' => $overrides->flowTeamId(),
            'is_published' => true,
            'library_external_id' => $externalId,
            'library_external_key' => $item->key,
            'library_namespace' => $item->namespace,
            'library_reference' => $item->reference,
            'library_source_path' => $item->sourcePath,
            'library_source_sha' => $item->sourceSha,
            'library_source_url' => $item->sourceUrl,
            'library_imported_at' => now(),
        ]);

        $this->appearance->apply($flow, $blueprint);

        return $flow;
    }

    private function importSnippet(
        LibrarySnippetItem $item,
        LibraryBlueprint $blueprint,
        string $workspaceId,
        string $userId,
        ?int $externalId,
        LibraryImportOverrides $overrides,
        string $defaultScope,
        ?string $defaultTeamId,
    ): Snippet {
        abort_if(
            $item->snippetType === 'nodal' && ($item->nodalGraph === null || trim($item->code ?? '') === ''),
            422,
            'Nodal library snippets must include a graph and compiled code.',
        );

        $scope = $overrides->snippetScope($defaultScope);

        return DB::transaction(fn (): Snippet => Snippet::create([
            'workspace_id' => $workspaceId,
            'user_id' => $overrides->ownerId($userId),
            'label' => $overrides->label ?? $item->label,
            'description' => $overrides->hasDescription ? ($overrides->description ?: null) : ($item->description ?? $blueprint->description),
            'group' => $overrides->hasGroup && $overrides->group !== null ? (trim($overrides->group) ?: null) : $blueprint->category,
            'args' => $item->args,
            'code' => $item->code ?? '',
            'snippet_type' => $item->snippetType,
            'nodal_graph' => $item->snippetType === 'nodal' ? $item->nodalGraph : null,
            'scope' => $scope,
            'team_id' => $overrides->snippetTeamId($scope, $defaultTeamId),
            'is_active' => true,
            'library_external_id' => $externalId,
            'library_external_key' => $item->key,
            'library_namespace' => $item->namespace,
            'library_reference' => $item->reference,
            'library_source_path' => $item->sourcePath,
            'library_source_sha' => $item->sourceSha,
            'library_source_url' => $item->sourceUrl,
            'library_imported_at' => now(),
        ]));
    }

    /**
     * @param  Collection<int, LibraryFlowItem>  $selectedFlows
     * @param  Collection<int, LibrarySnippetItem>  $selectedSnippets
     * @return Collection<int, LibrarySnippetItem>
     */
    private function withSnippetDependencies(
        LibraryBlueprint $blueprint,
        Collection $selectedFlows,
        Collection $selectedSnippets,
        string $workspaceId,
        User $actor,
        string $destinationOwnerId,
        string $destinationScope,
        ?string $destinationTeamId,
    ): Collection {
        /** @var Collection<string, LibrarySnippetItem> $available */
        $available = collect();
        foreach ($blueprint->snippets as $item) {
            $convention = $this->snippetReferences->convention(
                $item->namespace ?: 'library',
                $item->reference,
            );
            if ($available->has($convention)) {
                throw ValidationException::withMessages([
                    'library' => "Multiple snippets resolve to the library reference \"{$convention}\".",
                ]);
            }
            $available->put($convention, $item);
        }
        if ($available->isEmpty()) {
            return $selectedSnippets;
        }

        $namespaces = $available
            ->map(fn (LibrarySnippetItem $item): string => $item->namespace ?: 'library')
            ->unique()
            ->values();
        /** @var Collection<string, string> $installed */
        $installed = collect();
        $checkedInstalled = [];

        $selected = $selectedSnippets->mapWithKeys(
            fn (LibrarySnippetItem $item): array => [
                $this->snippetReferences->convention($item->namespace ?: 'library', $item->reference) => $item,
            ],
        );
        $libraryPrefixes = $namespaces
            ->map(fn (string $namespace): string => $this->snippetReferences->convention($namespace, ''))
            ->all();
        $queue = [];
        foreach ($selectedFlows as $flow) {
            array_push($queue, ...$this->snippetReferences->references($flow->code, $flow->nodalGraph));
        }
        foreach ($selectedSnippets as $snippet) {
            array_push($queue, ...$this->snippetReferences->references($snippet->code, $snippet->nodalGraph));
        }

        while ($queue !== []) {
            $convention = array_shift($queue);
            if (! isset($checkedInstalled[$convention])) {
                $installed = $installed->merge($this->snippetReferences->mapForWorkspace(
                    $workspaceId,
                    $actor,
                    $namespaces->all(),
                    [$convention],
                ));
                $checkedInstalled[$convention] = true;
            }
            if ($installed->has($convention) || $selected->has($convention)) {
                if ($installed->has($convention)) {
                    $installedSnippet = Snippet::query()->find($installed->get($convention));
                    if ($installedSnippet instanceof Snippet && ! $this->snippetCoversDestination(
                        $installedSnippet,
                        $destinationOwnerId,
                        $destinationScope,
                        $destinationTeamId,
                    )) {
                        throw ValidationException::withMessages([
                            'library' => "The installed dependency \"{$convention}\" is not visible to the selected destination.",
                        ]);
                    }
                }

                continue;
            }

            $dependency = $available->get($convention);
            if (! $dependency instanceof LibrarySnippetItem) {
                if (collect($libraryPrefixes)->contains(
                    fn (string $prefix): bool => str_starts_with($convention, $prefix),
                )) {
                    throw ValidationException::withMessages([
                        'library' => "The library dependency \"{$convention}\" is missing from this blueprint.",
                    ]);
                }

                continue;
            }

            $selected->put($convention, $dependency);
            array_push($queue, ...$this->snippetReferences->references($dependency->code, $dependency->nodalGraph));
        }

        return $selected->values();
    }

    private function snippetCoversDestination(
        Snippet $snippet,
        string $ownerId,
        string $scope,
        ?string $teamId,
    ): bool {
        if ($snippet->scope === 'workspace') {
            return true;
        }
        if ($scope === 'team') {
            return $snippet->scope === 'team' && $snippet->team_id === $teamId;
        }

        return $scope === 'owner'
            && $snippet->scope === 'owner'
            && $snippet->user_id === $ownerId;
    }

    /**
     * Maps catalog snippet references in library flow code to installed snippet IDs.
     * Includes imported and already installed snippets.
     *
     * @param  \Illuminate\Support\Collection<int, LibraryFlowItem>  $selectedFlows
     * @param  \Illuminate\Support\Collection<int, LibrarySnippetItem>  $selectedSnippets
     * @param  \Illuminate\Support\Collection<int, Snippet>  $importedSnippets
     * @return array<string, string> convention reference => snippet ID
     */
    private function snippetReferenceRewrites(
        LibraryBlueprint $blueprint,
        $selectedFlows,
        $selectedSnippets,
        $importedSnippets,
        string $workspaceId,
        User $actor,
    ): array {
        $namespaces = collect($blueprint->snippets)
            ->map(fn (LibrarySnippetItem $item): string => $item->namespace ?: 'library')
            ->push($blueprint->namespace ?: 'library')
            ->unique()
            ->values();

        $requiredConventions = [];
        foreach ($selectedFlows as $flow) {
            array_push($requiredConventions, ...$this->snippetReferences->references($flow->code, $flow->nodalGraph));
        }
        foreach ($selectedSnippets as $snippet) {
            array_push($requiredConventions, ...$this->snippetReferences->references($snippet->code, $snippet->nodalGraph));
        }
        $rewrites = $this->snippetReferences->mapForWorkspace(
            $workspaceId,
            $actor,
            $namespaces->all(),
            array_values(array_unique($requiredConventions)),
        );

        foreach ($selectedSnippets as $index => $item) {
            $imported = $importedSnippets->get($index);
            if (! $imported instanceof Snippet) {
                continue;
            }
            $convention = $this->snippetReferences->convention(
                $item->namespace ?: 'library',
                $item->reference ?: 'snippet',
            );
            $rewrites[$convention] = $imported->id;
        }

        return $rewrites;
    }

    /**
     * @param  list<string>  $flowReferences
     * @param  list<string>  $snippetReferences
     */
    private function abortIfAttachedChildrenAlreadyExist(LibraryBlueprint $blueprint, array $flowReferences, array $snippetReferences, string $workspaceId): void
    {
        $namespace = $blueprint->namespace;
        if (! $namespace) {
            return;
        }

        if (! empty($flowReferences)) {
            $existingFlow = Flow::query()
                ->where('workspace_id', $workspaceId)
                ->where('library_namespace', $namespace)
                ->whereIn('library_reference', $flowReferences)
                ->first(['library_reference']);

            abort_if($existingFlow !== null, 422, 'This library flow is already in use. Duplicate the existing flow if you need an editable copy.');
        }

        if (! empty($snippetReferences)) {
            $existingSnippet = Snippet::query()
                ->where('workspace_id', $workspaceId)
                ->where('library_namespace', $namespace)
                ->whereIn('library_reference', $snippetReferences)
                ->first(['library_reference']);

            abort_if($existingSnippet !== null, 422, 'This library snippet is already in use. Duplicate the existing snippet if you need an editable copy.');
        }
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function withLocalUsage(array $payload, string $sort = 'popular'): array
    {
        $workspaceId = $this->currentWorkspaceId();
        /** @var list<array<string, mixed>> $payloadItems */
        $payloadItems = is_array($payload['items'] ?? null) ? array_values($payload['items']) : [];
        $namespaces = collect($payloadItems)->pluck('namespace')->filter()->values();

        if ($workspaceId === '' || $namespaces->isEmpty()) {
            return $payload;
        }

        /** @var Collection<string, Collection<int, Flow>> $flowGroups */
        $flowGroups = Flow::query()
            ->where('workspace_id', $workspaceId)
            ->whereIn('library_namespace', $namespaces)
            ->get(['id', 'library_namespace', 'library_reference'])
            ->groupBy(fn (Flow $flow) => $flow->library_namespace.':'.$flow->library_reference);
        /** @var Collection<string, array{count: int, url: string}> $flowInstalls */
        $flowInstalls = $flowGroups->map(function (Collection $flows): array {
            $flow = $flows->first();
            if (! $flow instanceof Flow) {
                throw new \LogicException('Grouped flow collection is empty.');
            }

            return [
                'count' => $flows->count(),
                'url' => route('flows.show', $flow),
            ];
        });

        /** @var Collection<string, Collection<int, Snippet>> $snippetGroups */
        $snippetGroups = Snippet::query()
            ->where('workspace_id', $workspaceId)
            ->where('stale', false)
            ->whereIn('library_namespace', $namespaces)
            ->get(['id', 'library_namespace', 'library_reference'])
            ->groupBy(fn (Snippet $snippet) => $snippet->library_namespace.':'.$snippet->library_reference);
        /** @var Collection<string, array{count: int, url: string}> $snippetInstalls */
        $snippetInstalls = $snippetGroups->map(function (Collection $snippets): array {
            $snippet = $snippets->first();
            if (! $snippet instanceof Snippet) {
                throw new \LogicException('Grouped snippet collection is empty.');
            }

            return [
                'count' => $snippets->count(),
                'url' => route('snippets.index').'?s='.$snippet->id,
            ];
        });

        $items = collect($payloadItems)->map(function (array $item) use ($flowInstalls, $snippetInstalls): array {
            $namespace = is_string($item['namespace'] ?? null) ? $item['namespace'] : '';
            /** @var list<array<string, mixed>> $itemFlows */
            $itemFlows = is_array($item['flows'] ?? null) ? array_values($item['flows']) : [];
            $item['flows'] = collect($itemFlows)->map(function (array $flow) use ($namespace, $flowInstalls): array {
                $reference = is_string($flow['reference'] ?? null) ? $flow['reference'] : '';
                $key = $namespace.':'.$reference;
                $install = $flowInstalls[$key] ?? null;
                $count = $install['count'] ?? 0;

                return array_merge($flow, [
                    'used_count' => $count,
                    'is_installed' => $count > 0,
                    'installed_url' => $install['url'] ?? null,
                ]);
            })->values()->all();
            /** @var list<array<string, mixed>> $itemSnippets */
            $itemSnippets = is_array($item['snippets'] ?? null) ? array_values($item['snippets']) : [];
            $item['snippets'] = collect($itemSnippets)->map(function (array $snippet) use ($namespace, $snippetInstalls): array {
                $reference = is_string($snippet['reference'] ?? null) ? $snippet['reference'] : '';
                $key = $namespace.':'.$reference;
                $install = $snippetInstalls[$key] ?? null;
                $count = $install['count'] ?? 0;

                return array_merge($snippet, [
                    'used_count' => $count,
                    'is_installed' => $count > 0,
                    'installed_url' => $install['url'] ?? null,
                ]);
            })->values()->all();

            /** @var list<array<string, mixed>> $mappedFlows */
            $mappedFlows = $item['flows'];
            /** @var list<array<string, mixed>> $mappedSnippets */
            $mappedSnippets = $item['snippets'];
            $flows = collect($mappedFlows)->reduce(
                fn (int $count, array $flow): int => $count + (is_int($flow['used_count'] ?? null) ? $flow['used_count'] : 0),
                0,
            );
            $snippets = collect($mappedSnippets)->reduce(
                fn (int $count, array $snippet): int => $count + (is_int($snippet['used_count'] ?? null) ? $snippet['used_count'] : 0),
                0,
            );
            $hasAttachedItem = collect($item['flows'])->contains('is_installed', true)
                || collect($item['snippets'])->contains('is_installed', true);

            return array_merge($item, [
                'used_flows_count' => $flows,
                'used_snippets_count' => $snippets,
                'used_count' => $flows + $snippets,
                'is_installed' => $hasAttachedItem,
            ]);
        });

        if ($sort === 'used') {
            $items = $items
                ->filter(fn ($item) => (int) $item['used_count'] > 0)
                ->sortByDesc(fn ($item) => (int) $item['used_count'])
                ->values();

            $payload['categories'] = $items
                ->pluck('category')
                ->filter()
                ->unique()
                ->sort()
                ->values()
                ->all();
            $payload['category_counts'] = $items
                ->groupBy(fn (array $item): string => is_string($item['category'] ?? null) ? $item['category'] : 'Uncategorized')
                ->map(fn (Collection $group): int => $group->count())
                ->all();
            $payload['total_count'] = $items->count();
        }

        $payload['items'] = $items->values()->all();

        return $payload;
    }

    private function currentWorkspaceId(): string
    {
        $currentWorkspaceId = $this->workspaceIdFromSession();

        return $currentWorkspaceId;
    }
}
