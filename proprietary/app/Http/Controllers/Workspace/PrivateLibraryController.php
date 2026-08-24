<?php

namespace App\Http\Controllers\Workspace;

use App\Authorization\ResourceAssignmentValidator;
use App\DTO\Library\LibraryManifest;
use App\Enums\Authorization\Ability;
use App\Http\Controllers\Controller;
use App\Models\Flow;
use App\Models\PrivateLibrary;
use App\Models\Snippet;
use App\Models\Workspace;
use App\Services\FeatureFlags\FeatureFlagService;
use App\Services\Library\LibraryCatalogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class PrivateLibraryController extends Controller
{
    public function __construct(
        private readonly ResourceAssignmentValidator $assignments,
    ) {}

    public function store(Request $request, LibraryCatalogService $catalog): JsonResponse
    {
        $this->abortIfDisabled();
        $this->authorizeWorkspaceAdmin($request);

        $workspaceId = $this->currentWorkspaceId();
        $validated = $this->validated($request);
        $requestedTeamId = null;
        if (array_key_exists('team_id', $validated)) {
            $requestedTeamId = $this->resolveWorkspaceTeamId($validated['team_id'], $workspaceId);
        }
        $user = $request->user();
        abort_unless($user !== null, 401);
        // Typed reads happen before resolveOwnerId: passing $validated by
        // reference widens its type to array<string, mixed> afterwards.
        $visibility = $validated['visibility'];
        $group = trim($validated['group'] ?? '') ?: null;
        $branch = trim($validated['branch'] ?? '') ?: 'main';
        $ownerId = $this->resolveOwnerId($validated, $workspaceId, $user->id);
        $teamId = $visibility === 'team' ? $requestedTeamId : null;

        try {
            $library = DB::transaction(function () use ($validated, $workspaceId, $ownerId, $visibility, $teamId, $group, $branch, $catalog) {
                $this->assignments->validate($workspaceId, $ownerId, $visibility, $teamId, null, null);

                $library = PrivateLibrary::create([
                    ...$validated,
                    'workspace_id' => $workspaceId,
                    'user_id' => $ownerId,
                    'team_id' => $teamId,
                    'group' => $group,
                    'branch' => $branch,
                    'visibility' => $visibility,
                ]);

                return $catalog->refreshPrivateLibrary($library);
            });
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json($this->serialize($library), 201);
    }

    public function update(Request $request, PrivateLibrary $privateLibrary, LibraryCatalogService $catalog): JsonResponse
    {
        $this->abortIfDisabled();
        $this->features()->abortIfStale($privateLibrary);
        $this->authorizeWorkspaceAdmin($request);
        $this->abortUnlessCurrentWorkspace($privateLibrary);

        $workspaceId = $privateLibrary->workspace_id;
        $validated = $this->validated($request);
        $requestedTeamId = null;
        if (array_key_exists('team_id', $validated)) {
            $requestedTeamId = $this->resolveWorkspaceTeamId($validated['team_id'], $workspaceId);
        }
        $user = $request->user();
        abort_unless($user !== null, 401);
        // Typed reads happen before resolveOwnerId: passing $validated by
        // reference widens its type to array<string, mixed> afterwards.
        $visibility = $validated['visibility'];
        $group = trim($validated['group'] ?? '') ?: null;
        $nextBranch = trim($validated['branch'] ?? $privateLibrary->branch ?? '') ?: 'main';
        $urlChanged = $validated['url'] !== $privateLibrary->url;
        $ownerId = $this->resolveOwnerId(
            $validated,
            $workspaceId,
            $privateLibrary->user_id ?? $user->id,
        );
        $teamId = $visibility === 'team'
            ? ($requestedTeamId ?? $privateLibrary->team_id)
            : null;

        $branchChanged = $nextBranch !== ($privateLibrary->branch ?: 'main');
        try {
            $privateLibrary = DB::transaction(function () use (
                $privateLibrary,
                $validated,
                $ownerId,
                $visibility,
                $teamId,
                $group,
                $nextBranch,
                $urlChanged,
                $branchChanged,
                $catalog,
            ) {
                $this->assignments->validate(
                    $privateLibrary->workspace_id,
                    $ownerId,
                    $visibility,
                    $teamId === null ? null : $teamId,
                    null,
                    null,
                );

                $privateLibrary->update([
                    ...$validated,
                    'user_id' => $ownerId,
                    'team_id' => $teamId,
                    'group' => $group,
                    'branch' => $nextBranch,
                    'visibility' => $visibility,
                ]);

                return $urlChanged || $branchChanged
                    ? $catalog->refreshPrivateLibrary($privateLibrary)
                    : $privateLibrary;
            });
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json($this->serialize($privateLibrary->fresh(['owner:id,name', 'team:id,name']) ?? $privateLibrary));
    }

    public function refresh(Request $request, PrivateLibrary $privateLibrary, LibraryCatalogService $catalog): JsonResponse
    {
        $this->abortIfDisabled();
        $this->features()->abortIfStale($privateLibrary);
        $this->authorizeWorkspaceAdmin($request);
        $this->abortUnlessCurrentWorkspace($privateLibrary);

        try {
            $privateLibrary = $catalog->refreshPrivateLibrary($privateLibrary);
        } catch (\Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json($this->serialize($privateLibrary));
    }

    public function destroy(Request $request, PrivateLibrary $privateLibrary): JsonResponse
    {
        $this->authorizeWorkspaceAdmin($request);
        $this->abortUnlessCurrentWorkspace($privateLibrary);

        $validated = $request->validate([
            'delete_imports' => ['sometimes', 'boolean'],
        ]);

        if ($validated['delete_imports'] ?? false) {
            $linkedKey = "private:{$privateLibrary->id}:%";
            Flow::where('workspace_id', $privateLibrary->workspace_id)
                ->where('library_external_key', 'like', $linkedKey)
                ->get()
                ->each
                ->delete();
            Snippet::where('workspace_id', $privateLibrary->workspace_id)
                ->where('library_external_key', 'like', $linkedKey)
                ->delete();
        }

        $privateLibrary->delete();

        return response()->json(['message' => 'Private library deleted.']);
    }

    /**
     * @return array{
     *     label: string,
     *     description?: string|null,
     *     url: string,
     *     branch?: string|null,
     *     visibility: string,
     *     user_id?: string|null,
     *     team_id?: string|null,
     *     group?: string|null
     * }
     */
    private function validated(Request $request): array
    {
        return $request->validate([
            'label' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'url' => ['required', 'string', 'max:1000', 'regex:#github\.com[:/][^/]+/[^/]+#'],
            'branch' => ['nullable', 'string', 'max:255', 'regex:/^[A-Za-z0-9._\/-]+$/'],
            'visibility' => ['required', 'in:'.implode(',', $this->features()->allowedScopes())],
            'user_id' => ['nullable', 'string', 'exists:users,id'],
            'team_id' => ['nullable', 'string'],
            'group' => ['nullable', 'string', 'max:255'],
        ]);
    }

    /**
     * @return array{
     *     id: int,
     *     label: string,
     *     description: string|null,
     *     url: string,
     *     visibility: string,
     *     user_id: string|null,
     *     team_id: string|null,
     *     group: string|null,
     *     repo: string|null,
     *     branch: string|null,
     *     cached_at: string|null,
     *     last_error: string|null,
     *     items_count: int,
     *     owner: array{id: string, name: string}|null,
     *     team: array{id: string, name: string}|null
     * }
     */
    private function serialize(PrivateLibrary $library): array
    {
        $library->loadMissing(['owner:id,name', 'team:id,name']);
        $manifestValues = $library->manifest;
        $manifest = is_array($manifestValues) ? LibraryManifest::fromArray($manifestValues) : LibraryManifest::empty();

        return [
            'id' => $library->id,
            'label' => $library->label,
            'description' => $library->description,
            'url' => $library->url,
            'visibility' => $library->visibility,
            'user_id' => $library->owner?->id,
            'team_id' => $library->team?->id,
            'group' => $library->group,
            'repo' => $library->repo,
            'branch' => $library->branch,
            'cached_at' => $library->cached_at?->toIso8601String(),
            'last_error' => $library->last_error,
            'items_count' => count($manifest->items),
            'owner' => $library->owner ? ['id' => $library->owner->id, 'name' => $library->owner->name] : null,
            'team' => $library->team ? ['id' => $library->team->id, 'name' => $library->team->name] : null,
        ];
    }

    private function authorizeWorkspaceAdmin(Request $request): void
    {
        $workspace = Workspace::query()->findOrFail($this->currentWorkspaceId());
        Gate::authorize(Ability::UPDATE->value, $workspace);
    }

    private function abortUnlessCurrentWorkspace(PrivateLibrary $library): void
    {
        abort_unless($library->workspace_id === $this->currentWorkspaceId(), 404);
    }

    private function currentWorkspaceId(): string
    {
        $workspaceId = $this->workspaceIdFromSession();

        return $workspaceId;
    }

    private function abortIfDisabled(): void
    {
        $this->features()->abortIfDisabled('private_libraries_enabled');
    }

    private function features(): FeatureFlagService
    {
        return app(FeatureFlagService::class);
    }
}
