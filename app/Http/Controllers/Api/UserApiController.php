<?php

/*
 * Explicit proprietary scope: team assignment and fine-grained workspace role
 * branches in this controller are licensed under the Puppetflow Proprietary
 * License. See LICENSE_PROPRIETARY.md.
 */

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceTeam;
use App\Services\Auth\EmailAuthChallengeService;
use App\Services\FeatureFlags\FeatureFlagService;
use App\Services\Workspace\UserIdentityManager;
use App\Services\Workspace\WorkspaceMembershipManager;
use App\Services\Workspace\WorkspaceTeamMembershipManager;
use App\Support\IdentityEmail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class UserApiController extends Controller
{
    public function __construct(
        private WorkspaceMembershipManager $workspaceMemberships,
        private WorkspaceTeamMembershipManager $workspaceTeams,
        private UserIdentityManager $userIdentities,
        private FeatureFlagService $features,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorizeInstanceAdmin($request);

        $query = User::query()
            ->with(['workspaces:id,name', 'teams:id,workspace_id,name', 'teams.workspace:id'])
            ->orderBy('name');

        if ($search = $request->string('search')->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $limit = min(max($request->integer('limit', 50), 1), 100);

        return response()->json(
            $query->limit($limit)->get()->map(fn (User $user) => $this->serializeUser($user))->values()
        );
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorizeInstanceAdmin($request);
        $request->merge(['email' => IdentityEmail::normalize($request->input('email'))]);

        $data = $request->validate($this->rules());
        $userData = $this->userData($data, requireName: true);

        $user = DB::transaction(function () use ($request, $data, $userData) {
            $user = User::create($userData);

            if (array_key_exists('workspaces', $data)) {
                $memberships = $this->workspaceMemberships($user, $data['workspaces']);
                $this->workspaceMemberships->replace($user, $memberships, $request->user());
            }

            if (array_key_exists('team_ids', $data)) {
                $this->features->abortIfDisabled('teams_enabled');
                $teamIds = $this->resolveTeamIds($data['team_ids']);

                if (isset($memberships)) {
                    $this->assertTeamsBelongToWorkspaces($teamIds, array_keys($memberships));
                }

                $this->workspaceTeams->replaceUserTeams($user, $teamIds, actor: $request->user());
            }

            $this->lockAndAuthorizeInstanceAdmin($request, $user);

            return $user;
        }, 3);

        $user->load(['workspaces:id,name', 'teams:id,workspace_id,name', 'teams.workspace:id']);

        return response()->json($this->serializeUser($user), 201);
    }

    public function show(Request $request, User $user): JsonResponse
    {
        $this->authorizeInstanceAdmin($request);

        $user->load(['workspaces:id,name', 'teams:id,workspace_id,name', 'teams.workspace:id']);

        return response()->json($this->serializeUser($user));
    }

    /**
     * Issue a single-use magic sign-in URL for a user, so a trusted caller
     * (e.g. the landing site after a verified demo signup) can redirect the
     * user into an already-authenticated session.
     */
    public function loginLink(Request $request, User $user, EmailAuthChallengeService $challenges): JsonResponse
    {
        $this->authorizeInstanceAdmin($request);

        if (! Setting::magicLinkEnabled()) {
            return response()->json(['error' => 'Magic link sign-in is disabled on this instance.'], 409);
        }

        $validated = $request->validate([
            'workspace_id' => ['nullable', 'string', 'exists:workspaces,id'],
        ]);
        $workspaceId = $validated['workspace_id'] ?? null;

        if (is_string($workspaceId)) {
            $workspace = Workspace::findOrFail($workspaceId);
            abort_unless($user->isAdmin() || $user->belongsToWorkspace($workspace), 403);
        }

        [$challenge, $url] = $challenges->issueLink(
            $user->email,
            array_filter(['workspace_id' => $workspaceId]),
        );

        return response()->json([
            'url' => $url,
            'expires_at' => $challenge->expires_at,
        ]);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $this->authorizeInstanceAdmin($request);
        if ($request->has('email')) {
            $request->merge(['email' => IdentityEmail::normalize($request->input('email'))]);
        }

        $data = $request->validate($this->rules($user));
        /** @var User $actor */
        $actor = $request->user();

        if (($data['role'] ?? null) !== null && $user->id === $actor->id && $data['role'] !== 'admin') {
            return response()->json(['error' => 'Cannot remove your own admin role.'], 400);
        }

        DB::transaction(function () use ($request, $data, $user) {
            $userData = $this->userData($data, requireName: false);

            if (array_key_exists('workspaces', $data)) {
                $memberships = $this->workspaceMemberships($user, $data['workspaces']);
                $this->workspaceMemberships->replace($user, $memberships, $request->user());
            }

            if (array_key_exists('team_ids', $data)) {
                $this->features->abortIfDisabled('teams_enabled');
                $teamIds = $this->resolveTeamIds($data['team_ids']);

                if (isset($memberships)) {
                    $this->assertTeamsBelongToWorkspaces($teamIds, array_keys($memberships));
                }

                $this->workspaceTeams->replaceUserTeams($user, $teamIds, actor: $request->user());
            }

            $email = $userData['email'] ?? null;
            if (is_string($email) && $email !== $user->email) {
                $this->userIdentities->changeEmail($user, $email, $request->user());
            }
            unset($userData['email']);

            $lockedUser = $this->lockAndAuthorizeInstanceAdmin($request, $user);

            if ($userData !== []) {
                $lockedUser->update($userData);
            }
        }, 3);

        $user->refresh()->load(['workspaces:id,name', 'teams:id,workspace_id,name', 'teams.workspace:id']);

        return response()->json($this->serializeUser($user));
    }

    /**
     * @return array<string, list<mixed>>
     */
    private function rules(?User $user = null): array
    {
        return [
            'name' => [$user ? 'sometimes' : 'nullable', 'string', 'max:255'],
            'first_name' => ['nullable', 'string', 'max:120'],
            'last_name' => ['nullable', 'string', 'max:120'],
            'email' => [$user ? 'sometimes' : 'required', 'email', Rule::unique('users', 'email')->ignore($user?->id)],
            'password' => [$user ? 'nullable' : 'required', Password::defaults()],
            'role' => ['sometimes', Rule::in(['admin', 'member'])],
            'can_create_workspace' => ['sometimes', 'boolean'],
            'timezone' => ['sometimes', 'string', 'max:64'],
            'explorer_view_mode' => ['sometimes', Rule::in(['grid', 'list'])],
            'workspaces' => ['sometimes', 'array'],
            'workspaces.*.id' => ['required_with:workspaces', 'string', 'exists:workspaces,id'],
            'workspaces.*.role' => ['sometimes', Rule::in($this->allowedWorkspaceRoles())],
            'team_ids' => ['sometimes', 'array'],
            'team_ids.*' => ['string', 'distinct', 'exists:workspace_teams,id'],
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function userData(array $data, bool $requireName): array
    {
        $userData = [];

        $name = $data['name'] ?? trim(implode(' ', array_filter([
            $data['first_name'] ?? null,
            $data['last_name'] ?? null,
        ])));

        if ($name !== '') {
            $userData['name'] = $name;
        } elseif ($requireName) {
            $userData['name'] = $data['email'];
        }

        foreach (['email', 'role', 'can_create_workspace', 'timezone', 'explorer_view_mode'] as $field) {
            if (array_key_exists($field, $data)) {
                $userData[$field] = $data[$field];
            }
        }

        $password = $data['password'] ?? null;
        if (is_string($password) && $password !== '') {
            $userData['password'] = Hash::make($password);
        }

        return $userData;
    }

    /**
     * @param  list<array{id: string, role?: string}>  $workspaces
     * @return array<string, string>
     */
    private function workspaceMemberships(User $user, array $workspaces): array
    {
        $existingRoles = $user->workspaces()->pluck('user_workspace.role', 'workspaces.id');
        $workspaceIds = Workspace::whereIn('id', array_column($workspaces, 'id'))
            ->pluck('id', 'id');

        return collect($workspaces)
            ->mapWithKeys(function (array $workspace) use ($existingRoles, $workspaceIds): array {
                $workspaceId = $workspaceIds->get($workspace['id']);
                if (! is_string($workspaceId)) {
                    throw ValidationException::withMessages(['workspaces' => 'Workspace not found.']);
                }
                $role = $workspace['role']
                    ?? $existingRoles[$workspaceId]
                    ?? 'member';

                return [$workspaceId => is_string($role) ? $role : 'member'];
            })
            ->all();
    }

    /**
     * @param  list<string>  $teamIds
     * @return list<string>
     */
    private function resolveTeamIds(array $teamIds): array
    {
        return array_values(
            WorkspaceTeam::whereIn('id', $teamIds)
                ->pluck('id')
                ->filter(fn (mixed $id): bool => is_string($id))
                ->all(),
        );
    }

    /**
     * @param  list<string>  $teamIds
     * @param  list<string>  $workspaceIds
     */
    private function assertTeamsBelongToWorkspaces(array $teamIds, array $workspaceIds): void
    {
        $invalidTeamExists = WorkspaceTeam::query()
            ->whereIn('id', $teamIds)
            ->whereNotIn('workspace_id', $workspaceIds)
            ->exists();

        if ($invalidTeamExists) {
            throw ValidationException::withMessages([
                'team_ids' => 'Every selected team must belong to a selected workspace.',
            ]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeUser(User $user): array
    {
        [$firstName, $lastName] = $this->splitName($user->name);

        return [
            'id' => $user->id,
            'name' => $user->name,
            'first_name' => $firstName,
            'last_name' => $lastName,
            'email' => $user->email,
            'role' => $user->role,
            'can_create_workspace' => (bool) $user->can_create_workspace,
            'timezone' => $user->timezone,
            'explorer_view_mode' => $user->explorer_view_mode,
            'workspaces' => $user->workspaces->map(fn (Workspace $workspace) => [
                'id' => $workspace->id,
                'name' => $workspace->name,
                'role' => $workspace->pivot->role ?? 'member',
            ])->values(),
            'teams' => $user->teams->map(fn (WorkspaceTeam $team) => [
                'id' => $team->id,
                'workspace_id' => $team->workspace?->id,
                'name' => $team->name,
            ])->values(),
            'created_at' => $user->created_at?->toIso8601String(),
            'updated_at' => $user->updated_at?->toIso8601String(),
        ];
    }

    /**
     * @return array{0: string|null, 1: string|null}
     */
    private function splitName(string $name): array
    {
        $parts = preg_split('/\s+/', trim($name), 2) ?: [];

        return [$parts[0] ?? null, $parts[1] ?? null];
    }

    private function authorizeInstanceAdmin(Request $request): void
    {
        /** @var User $user */
        $user = $request->user();
        abort_unless($user->isAdmin(), 403);
    }

    /**
     * @return array<int, string>
     */
    private function allowedWorkspaceRoles(): array
    {
        return $this->features->sharingRolesEnabled()
            ? ['admin', 'manager', 'member']
            : ['member'];
    }

    private function lockAndAuthorizeInstanceAdmin(Request $request, User $target): User
    {
        /** @var User $requestUser */
        $requestUser = $request->user();
        $users = User::query()
            ->whereIn('id', [$requestUser->id, $target->id])
            ->orderBy('id')
            ->lockForUpdate()
            ->get()
            ->keyBy('id');
        $actor = $users->get($requestUser->id);
        abort_unless($actor?->isAdmin() === true, 403);
        $lockedTarget = $users->get($target->id);

        if (! $lockedTarget instanceof User) {
            throw ValidationException::withMessages([
                'user' => 'The user no longer exists.',
            ]);
        }

        return $lockedTarget;
    }
}
