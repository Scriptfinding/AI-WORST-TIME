<?php

namespace App\Http\Controllers\Workspace;

use App\Authorization\ResourceAssignmentValidator;
use App\Enums\Authorization\Ability;
use App\Http\Controllers\Controller;
use App\Models\Flow;
use App\Models\Workspace;
use App\Models\WorkspaceProxy;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class WorkspaceProxyController extends Controller
{
    public function __construct(
        private readonly ResourceAssignmentValidator $assignments,
    ) {}

    public function store(Request $request): JsonResponse
    {
        $workspace = $this->currentWorkspace();
        Gate::authorize(Ability::UPDATE->value, $workspace);
        $validated = $this->validated($request, $workspace);
        $user = $request->user();
        abort_unless($user !== null, 401);
        $visibility = $validated['visibility'];
        $teamId = $visibility === 'team'
            ? $this->resolveWorkspaceTeamId($validated['team_id'] ?? null, $workspace->id)
            : null;
        $group = trim($validated['group'] ?? '') ?: null;
        $attributes = $this->attributes($validated);
        $ownerId = $this->resolveOwnerId($validated, $workspace->id, $user->id);

        $proxy = DB::transaction(function () use ($workspace, $attributes, $visibility, $ownerId, $teamId, $group) {
            $this->assignments->validate($workspace->id, $ownerId, $visibility, $teamId, null, null);

            return $workspace->proxies()->create([
                ...$attributes,
                'user_id' => $ownerId,
                'team_id' => $teamId,
                'visibility' => $visibility,
                'group' => $group,
            ]);
        });

        return response()->json($this->serialize($proxy), 201);
    }

    public function update(Request $request, WorkspaceProxy $workspaceProxy): JsonResponse
    {
        $workspace = $this->currentWorkspace();
        Gate::authorize(Ability::UPDATE->value, $workspace);
        $this->abortUnlessCurrentWorkspace($workspaceProxy, $workspace);
        $validated = $this->validated($request, $workspace, $workspaceProxy);
        $user = $request->user();
        abort_unless($user !== null, 401);
        $attributes = $this->attributes($validated);
        if ($validated['authenticated']) {
            if (($validated['username'] ?? '') === '') {
                unset($attributes['username']);
            }
            if (($validated['password'] ?? '') === '') {
                unset($attributes['password']);
            }
        }
        $group = trim($validated['group'] ?? '') ?: null;
        $updatedProxy = DB::transaction(function () use ($workspaceProxy, $workspace, $validated, $attributes, $user, $group): WorkspaceProxy {
            $lockedProxy = WorkspaceProxy::query()
                ->whereKey($workspaceProxy->id)
                ->where('workspace_id', $workspace->id)
                ->lockForUpdate()
                ->firstOrFail();
            $visibility = $validated['visibility'];
            $teamId = $visibility === 'team'
                ? $this->resolveWorkspaceTeamId($validated['team_id'] ?? $lockedProxy->team_id, $workspace->id)
                : null;
            $ownerId = $this->resolveOwnerId(
                $validated,
                $workspace->id,
                $lockedProxy->user_id ?? $user->id,
            );
            $assignmentChanged = $ownerId !== $lockedProxy->user_id
                || $teamId !== $lockedProxy->team_id
                || $visibility !== $lockedProxy->visibility;
            if ($assignmentChanged && Flow::query()
                ->where('workspace_id', $workspace->id)
                ->where('proxy_mode', 'specific')
                ->where('workspace_proxy_id', $lockedProxy->id)
                ->exists()) {
                throw ValidationException::withMessages([
                    'proxy' => 'This proxy is assigned to one or more flows. Reassign those flows before changing its owner or visibility.',
                ]);
            }
            $this->assignments->validate($workspace->id, $ownerId, $visibility, $teamId, null, null);
            $lockedProxy->update([
                ...$attributes,
                'user_id' => $ownerId,
                'team_id' => $teamId,
                'visibility' => $visibility,
                'group' => $group,
            ]);

            return $lockedProxy;
        });

        return response()->json($this->serialize($updatedProxy->fresh() ?? $updatedProxy));
    }

    public function destroy(Request $request, WorkspaceProxy $workspaceProxy): JsonResponse
    {
        $workspace = $this->currentWorkspace();
        Gate::authorize(Ability::UPDATE->value, $workspace);
        $this->abortUnlessCurrentWorkspace($workspaceProxy, $workspace);

        try {
            DB::transaction(function () use ($workspaceProxy, $workspace): void {
                $lockedProxy = WorkspaceProxy::query()
                    ->whereKey($workspaceProxy->id)
                    ->where('workspace_id', $workspace->id)
                    ->lockForUpdate()
                    ->firstOrFail();
                if (Flow::query()
                    ->where('workspace_id', $workspace->id)
                    ->where('proxy_mode', 'specific')
                    ->where('workspace_proxy_id', $lockedProxy->id)
                    ->exists()) {
                    throw ValidationException::withMessages([
                        'proxy' => 'This proxy is assigned to one or more flows. Reassign those flows before deleting it.',
                    ]);
                }

                $lockedProxy->delete();
            });
        } catch (QueryException $exception) {
            if (in_array((string) $exception->getCode(), ['23000', '23503'], true)) {
                throw ValidationException::withMessages([
                    'proxy' => 'This proxy was assigned to a flow while it was being deleted. Reassign that flow and try again.',
                ]);
            }

            throw $exception;
        }

        return response()->json(['message' => 'Proxy deleted.']);
    }

    /**
     * @return array{
     *     label: string,
     *     scheme: string,
     *     host: string,
     *     port: int,
     *     authenticated: bool,
     *     visibility: string,
     *     user_id?: string|null,
     *     team_id?: string|null,
     *     group?: string|null,
     *     username?: string|null,
     *     password?: string|null
     * }
     */
    private function validated(
        Request $request,
        Workspace $workspace,
        ?WorkspaceProxy $proxy = null,
    ): array {
        $request->merge([
            'label' => trim($request->string('label')->toString()),
            'host' => trim($request->string('host')->toString()),
        ]);
        $validated = $request->validate([
            'label' => [
                'required',
                'string',
                'max:255',
                Rule::unique('workspace_proxies', 'label')
                    ->where('workspace_id', $workspace->id)
                    ->ignore($proxy?->id),
            ],
            'scheme' => ['required', Rule::in(['http', 'https', 'socks4', 'socks5'])],
            'host' => [
                'required',
                'string',
                'max:255',
                'regex:/^(?!.*[\\s\\/@])(?:\\[[0-9A-Fa-f:]+\\]|[0-9A-Za-z](?:[0-9A-Za-z.-]*[0-9A-Za-z])?)$/',
            ],
            'port' => ['required', 'integer', 'between:1,65535'],
            'authenticated' => ['required', 'boolean'],
            'visibility' => [
                'required',
                Rule::in(app(\App\Services\FeatureFlags\FeatureFlagService::class)->allowedScopes()),
            ],
            'user_id' => ['nullable', 'string', 'exists:users,id'],
            'team_id' => ['nullable', 'string'],
            'group' => ['nullable', 'string', 'max:255'],
            'username' => ['nullable', 'string', 'max:1000'],
            'password' => ['nullable', 'string', 'max:4000'],
        ]);

        if (
            ($validated['authenticated'] ?? false)
            && ($proxy === null || $proxy->username === null)
            && ($validated['username'] ?? '') === ''
        ) {
            throw ValidationException::withMessages([
                'username' => 'A username is required for proxy authentication.',
            ]);
        }

        $validated['host'] = trim($validated['host'], '[]');

        return $validated;
    }

    /**
     * @param  array{
     *     label: string,
     *     scheme: string,
     *     host: string,
     *     port: int,
     *     authenticated: bool,
     *     visibility: string,
     *     user_id?: string|null,
     *     team_id?: string|null,
     *     group?: string|null,
     *     username?: string|null,
     *     password?: string|null
     * }  $validated
     * @return array<string, mixed>
     */
    private function attributes(array $validated): array
    {
        $authenticated = (bool) $validated['authenticated'];

        return [
            'label' => trim($validated['label']),
            'scheme' => $validated['scheme'],
            'host' => $validated['host'],
            'port' => $validated['port'],
            'username' => $authenticated ? ($validated['username'] ?? null) : null,
            'password' => $authenticated ? ($validated['password'] ?? '') : null,
        ];
    }

    /** @return array<string, mixed> */
    private function serialize(WorkspaceProxy $proxy): array
    {
        $proxy->loadMissing(['owner:id,name', 'team:id,name']);

        return [
            'id' => $proxy->id,
            'label' => $proxy->label,
            'scheme' => $proxy->scheme,
            'host' => $proxy->host,
            'port' => $proxy->port,
            'has_authentication' => $proxy->username !== null,
            'visibility' => $proxy->visibility,
            'user_id' => $proxy->owner?->id,
            'team_id' => $proxy->team?->id,
            'group' => $proxy->group,
            'owner' => $proxy->owner ? ['id' => $proxy->owner->id, 'name' => $proxy->owner->name] : null,
            'team' => $proxy->team ? ['id' => $proxy->team->id, 'name' => $proxy->team->name] : null,
            'created_at' => $proxy->created_at?->toIso8601String(),
            'updated_at' => $proxy->updated_at?->toIso8601String(),
        ];
    }

    private function currentWorkspace(): Workspace
    {
        return Workspace::query()->findOrFail($this->workspaceIdFromSession());
    }

    private function abortUnlessCurrentWorkspace(WorkspaceProxy $proxy, Workspace $workspace): void
    {
        abort_unless($proxy->workspace_id === $workspace->id, 404);
    }
}
