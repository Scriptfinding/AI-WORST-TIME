<?php

namespace App\Http\Controllers\Api;

use App\Enums\Authorization\Ability;
use App\Http\Controllers\Controller;
use App\Models\Folder;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceTeam;
use App\Services\FeatureFlags\FeatureFlagService;
use App\Services\Workspace\WorkspaceTeamMembershipManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class TeamApiController extends Controller
{
    public function __construct(
        private FeatureFlagService $features,
        private WorkspaceTeamMembershipManager $workspaceTeams,
    ) {}

    public function index(Request $request, Workspace $workspace): JsonResponse
    {
        if (Gate::forUser($request->user())->denies(Ability::VIEW_ANY->value, [WorkspaceTeam::class, $workspace])) {
            return response()->json(['error' => 'Workspace not found.'], 404);
        }

        $this->features->abortIfDisabled('teams_enabled');

        $teams = $workspace->teams()
            ->withCount('users')
            ->orderBy('name')
            ->get()
            ->filter(fn (WorkspaceTeam $team): bool => Gate::forUser($request->user())
                ->allows(Ability::VIEW->value, $team));

        return response()->json($teams->map(fn (WorkspaceTeam $team) => $this->serializeTeam($team, $workspace))->values());
    }

    public function store(Request $request, Workspace $workspace): JsonResponse
    {
        if (Gate::forUser($request->user())->denies(Ability::CREATE->value, [WorkspaceTeam::class, $workspace])) {
            return response()->json(['error' => 'Forbidden.'], 403);
        }

        $this->features->abortIfDisabled('teams_enabled');

        $data = $request->validate($this->rules($workspace));

        $team = DB::transaction(function () use ($data, $workspace) {
            $team = WorkspaceTeam::create([
                'workspace_id' => $workspace->id,
                'name' => $data['name'],
            ]);

            Folder::create([
                'name' => $team->name,
                'workspace_id' => $workspace->id,
                'is_shared' => true,
                'team_id' => $team->id,
                'parent_id' => null,
                'sort_order' => 0,
            ]);

            return $team;
        });

        $team->loadCount('users');

        return response()->json($this->serializeTeam($team, $workspace), 201);
    }

    public function show(Request $request, Workspace $workspace, WorkspaceTeam $team): JsonResponse
    {
        if ($team->workspace_id !== $workspace->id
            || Gate::forUser($request->user())->denies(Ability::VIEW->value, $team)) {
            return response()->json(['error' => 'Team not found.'], 404);
        }

        $this->features->abortIfDisabled('teams_enabled');

        $team->load(['users:id,name,email,role,can_create_workspace'])->loadCount('users');

        return response()->json($this->serializeTeam($team, $workspace, includeUsers: true));
    }

    public function update(Request $request, Workspace $workspace, WorkspaceTeam $team): JsonResponse
    {
        if ($team->workspace_id !== $workspace->id
            || Gate::forUser($request->user())->denies(Ability::UPDATE->value, $team)) {
            return response()->json(['error' => 'Forbidden.'], 403);
        }

        $this->features->abortIfDisabled('teams_enabled');

        $data = $request->validate($this->rules($workspace, $team));

        $team->update($data);

        if (isset($data['name'])) {
            Folder::where('team_id', $team->id)->whereNull('parent_id')->update(['name' => $data['name']]);
        }

        $team->refresh()->loadCount('users');

        return response()->json($this->serializeTeam($team, $workspace));
    }

    public function addUsers(Request $request, Workspace $workspace, WorkspaceTeam $team): JsonResponse
    {
        $this->features->abortIfDisabled('teams_enabled');

        if ($team->workspace_id !== $workspace->id
            || Gate::forUser($request->user())->denies(Ability::MANAGE_MEMBERS->value, $team)) {
            return response()->json(['error' => 'Forbidden.'], 403);
        }

        $data = $request->validate([
            'user_id' => [
                'sometimes',
                'string',
                Rule::exists('users', 'id'),
            ],
            'user_ids' => ['sometimes', 'array'],
            'user_ids.*' => [
                'string',
                'distinct',
                Rule::exists('users', 'id'),
            ],
            'workspace_role' => ['sometimes', Rule::in($this->allowedWorkspaceRoles())],
        ]);

        /** @var list<string> $validatedUserIds */
        $validatedUserIds = $data['user_ids'] ?? [];
        $userIds = collect($validatedUserIds)
            ->push($data['user_id'] ?? null)
            ->filter()
            ->unique()
            ->values();
        $userIds = array_values($userIds->all());

        if ($userIds === []) {
            return response()->json(['error' => 'At least one user_id is required.'], 422);
        }

        $this->workspaceTeams->addMembers(
            $team,
            $userIds,
            $data['workspace_role'] ?? null,
            $request->user(),
        );

        $team->load(['users:id,name,email,role,can_create_workspace'])->loadCount('users');

        return response()->json($this->serializeTeam($team, $workspace, includeUsers: true));
    }

    public function replaceUsers(Request $request, Workspace $workspace, WorkspaceTeam $team): JsonResponse
    {
        $this->features->abortIfDisabled('teams_enabled');

        if ($team->workspace_id !== $workspace->id
            || Gate::forUser($request->user())->denies(Ability::MANAGE_MEMBERS->value, $team)) {
            return response()->json(['error' => 'Forbidden.'], 403);
        }

        $data = $request->validate([
            'user_ids' => ['required', 'array'],
            'user_ids.*' => [
                'string',
                'distinct',
                Rule::exists('users', 'id'),
            ],
            'workspace_role' => ['sometimes', Rule::in($this->allowedWorkspaceRoles())],
        ]);

        /** @var list<string> $validatedUserIds */
        $validatedUserIds = $data['user_ids'];
        $userIds = $validatedUserIds;

        $this->workspaceTeams->replaceMembers(
            $team,
            $userIds,
            $data['workspace_role'] ?? null,
            $request->user(),
        );

        $team->load(['users:id,name,email,role,can_create_workspace'])->loadCount('users');

        return response()->json($this->serializeTeam($team, $workspace, includeUsers: true));
    }

    public function setUserTeams(Request $request, Workspace $workspace, User $user): JsonResponse
    {
        if (Gate::forUser($request->user())->denies(Ability::MANAGE_MEMBERS->value, $workspace)) {
            return response()->json(['error' => 'Forbidden.'], 403);
        }

        $this->features->abortIfDisabled('teams_enabled');
        abort_unless(
            $workspace->users()->where('users.id', $user->id)->exists(),
            404,
        );

        $data = $request->validate([
            'team_ids' => ['required', 'array'],
            'team_ids.*' => [
                'string',
                'distinct',
                Rule::exists('workspace_teams', 'id')->where('workspace_id', $workspace->id),
            ],
            'workspace_role' => ['sometimes', Rule::in($this->allowedWorkspaceRoles())],
        ]);

        $teamIds = array_values($data['team_ids']);

        $this->workspaceTeams->replaceUserTeamsForWorkspace(
            $workspace,
            $user,
            $teamIds,
            $data['workspace_role'] ?? null,
            $request->user(),
        );

        $user->load(['workspaces:id,name', 'teams:id,workspace_id,name']);

        return response()->json([
            'user_id' => $user->id,
            'workspace_id' => $workspace->id,
            'workspace_role' => DB::table('user_workspace')
                ->where('workspace_id', $workspace->id)
                ->where('user_id', $user->id)
                ->value('role'),
            'team_ids' => $user->teams->where('workspace_id', $workspace->id)->pluck('id')->values(),
        ]);
    }

    /**
     * @return array<string, list<mixed>>
     */
    private function rules(Workspace $workspace, ?WorkspaceTeam $team = null): array
    {
        return [
            'name' => [
                $team ? 'sometimes' : 'required',
                'string',
                'max:50',
                Rule::unique('workspace_teams', 'name')
                    ->where('workspace_id', $workspace->id)
                    ->ignore($team?->id),
            ],
        ];
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

    /**
     * @return array<string, mixed>
     */
    private function serializeTeam(WorkspaceTeam $team, Workspace $workspace, bool $includeUsers = false): array
    {
        $data = [
            'id' => $team->id,
            'workspace_id' => $workspace->id,
            'name' => $team->name,
            'users_count' => $team->users_count ?? null,
            'created_at' => $team->created_at?->toIso8601String(),
            'updated_at' => $team->updated_at?->toIso8601String(),
        ];

        if ($includeUsers) {
            $workspaceRoles = DB::table('user_workspace')
                ->where('workspace_id', $team->workspace_id)
                ->whereIn('user_id', $team->users->pluck('id'))
                ->pluck('role', 'user_id');
            $data['users'] = [];
            foreach ($team->users as $user) {
                $workspaceRole = $workspaceRoles->get($user->id);
                $data['users'][] = [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'workspace_role' => is_string($workspaceRole) ? $workspaceRole : 'member',
                    'can_create_workspace' => (bool) $user->can_create_workspace,
                ];
            }
        }

        return $data;
    }
}
