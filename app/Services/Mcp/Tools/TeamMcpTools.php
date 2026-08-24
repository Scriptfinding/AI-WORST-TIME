<?php

namespace App\Services\Mcp\Tools;

use App\Enums\Authorization\Ability;
use App\Models\Folder;
use App\Models\User;
use App\Models\WorkspaceTeam;
use App\Services\FeatureFlags\FeatureFlagService;
use App\Services\Workspace\WorkspaceTeamMembershipManager;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/** @phpstan-type Arguments array<string, mixed> */
final class TeamMcpTools implements McpToolHandler
{
    public function __construct(
        private readonly FeatureFlagService $features,
        private readonly WorkspaceTeamMembershipManager $memberships,
    ) {}

    public function definitions(): array
    {
        $teamId = ['type' => 'string', 'pattern' => '^team_[A-Za-z0-9]{12}$'];
        $userIds = ['type' => 'array', 'items' => ['type' => 'string', 'pattern' => '^user_[A-Za-z0-9]{12}$']];
        $role = ['type' => 'string', 'enum' => ['admin', 'manager', 'member']];

        return [
            ['name' => 'list_workspace_members', 'description' => 'List members of the connected workspace.', 'inputSchema' => ['type' => 'object', 'properties' => ['search' => ['type' => 'string']]]],
            ['name' => 'list_teams', 'description' => 'List teams in the connected workspace.', 'inputSchema' => ['type' => 'object', 'properties' => new \stdClass]],
            ['name' => 'get_team', 'description' => 'Get a team and its members.', 'inputSchema' => ['type' => 'object', 'required' => ['team_id'], 'properties' => ['team_id' => $teamId]]],
            ['name' => 'create_team', 'description' => 'Create a team in the connected workspace.', 'inputSchema' => ['type' => 'object', 'required' => ['name'], 'properties' => ['name' => ['type' => 'string', 'maxLength' => 50]]]],
            ['name' => 'update_team', 'description' => 'Rename a team in the connected workspace.', 'inputSchema' => ['type' => 'object', 'required' => ['team_id', 'name'], 'properties' => ['team_id' => $teamId, 'name' => ['type' => 'string', 'maxLength' => 50]]]],
            ['name' => 'add_team_members', 'description' => 'Add workspace users to a team.', 'inputSchema' => ['type' => 'object', 'required' => ['team_id', 'user_ids'], 'properties' => ['team_id' => $teamId, 'user_ids' => $userIds, 'workspace_role' => $role]]],
            ['name' => 'replace_team_members', 'description' => 'Replace the complete member list of a team.', 'inputSchema' => ['type' => 'object', 'required' => ['team_id', 'user_ids'], 'properties' => ['team_id' => $teamId, 'user_ids' => $userIds, 'workspace_role' => $role]]],
            ['name' => 'set_member_teams', 'description' => 'Replace the team assignments of one workspace member.', 'inputSchema' => ['type' => 'object', 'required' => ['user_id', 'team_ids'], 'properties' => [
                'user_id' => ['type' => 'string', 'pattern' => '^user_[A-Za-z0-9]{12}$'], 'team_ids' => ['type' => 'array', 'items' => $teamId], 'workspace_role' => $role,
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
            'list_workspace_members' => $this->listMembers($arguments, $context),
            'list_teams' => $this->listTeams($context),
            'get_team' => ['team' => $this->serialize($this->team($arguments, $context, Ability::VIEW), $context->workspace->id, true)],
            'create_team' => $this->create($arguments, $context),
            'update_team' => $this->update($arguments, $context),
            'add_team_members' => $this->changeMembers($arguments, $context, false),
            'replace_team_members' => $this->changeMembers($arguments, $context, true),
            'set_member_teams' => $this->setMemberTeams($arguments, $context),
            default => throw ValidationException::withMessages(['name' => 'Unknown team tool.']),
        };
    }

    /** @param Arguments $arguments
     * @return array<string, mixed>
     */
    private function listMembers(array $arguments, McpToolContext $context): array
    {
        Gate::forUser($context->user)->authorize(Ability::VIEW->value, $context->workspace);
        $query = $context->workspace->users()->select(['users.id', 'users.name', 'users.email']);
        $workspaceRole = DB::table('user_workspace')
            ->where('workspace_id', $context->workspace->id)
            ->where('user_id', $context->user->id)
            ->value('role');
        if (
            $workspaceRole === 'manager'
            && ! $context->user->isAdmin()
            && $this->features->sharingRolesEnabled()
            && $this->features->teamsEnabled()
        ) {
            $managerTeamIds = DB::table('team_user')
                ->where('workspace_id', $context->workspace->id)
                ->where('user_id', $context->user->id)
                ->pluck('team_id');
            $visibleUserIds = DB::table('team_user')
                ->where('workspace_id', $context->workspace->id)
                ->whereIn('team_id', $managerTeamIds)
                ->pluck('user_id');
            $query->whereIn('users.id', $visibleUserIds);
        }
        if (($search = trim(McpToolArguments::string($arguments, 'search'))) !== '') {
            $query->where(fn ($q) => $q->where('users.name', 'like', "%{$search}%")->orWhere('users.email', 'like', "%{$search}%"));
        }

        $users = $query->orderBy('users.name')->get();
        $roles = DB::table('user_workspace')->where('workspace_id', $context->workspace->id)->whereIn('user_id', $users->pluck('id'))->pluck('role', 'user_id');

        return ['members' => $users->map(fn (User $user) => [
            'id' => $user->id, 'name' => $user->name, 'email' => $user->email, 'workspace_role' => $roles->get($user->id, 'member'),
        ])->values()];
    }

    /** @return array<string, mixed> */
    private function listTeams(McpToolContext $context): array
    {
        $this->features->abortIfDisabled('teams_enabled');
        Gate::forUser($context->user)->authorize(Ability::VIEW_ANY->value, [WorkspaceTeam::class, $context->workspace]);

        $teams = $context->workspace->teams()
            ->withCount('users')
            ->orderBy('name')
            ->get()
            ->filter(fn (WorkspaceTeam $team): bool => Gate::forUser($context->user)
                ->allows(Ability::VIEW->value, $team));

        return ['teams' => $teams->map(fn (WorkspaceTeam $team) => $this->serialize($team, $context->workspace->id))->values()];
    }

    /** @param Arguments $arguments
     * @return array<string, mixed>
     */
    private function create(array $arguments, McpToolContext $context): array
    {
        $this->features->abortIfDisabled('teams_enabled');
        Gate::forUser($context->user)->authorize(Ability::CREATE->value, [WorkspaceTeam::class, $context->workspace]);
        $data = validator($arguments, ['name' => ['required', 'string', 'max:50', Rule::unique('workspace_teams', 'name')->where('workspace_id', $context->workspace->id)]])->validate();
        $team = DB::transaction(function () use ($data, $context) {
            $team = WorkspaceTeam::create(['workspace_id' => $context->workspace->id, 'name' => $data['name']]);
            Folder::create(['name' => $team->name, 'workspace_id' => $context->workspace->id, 'is_shared' => true, 'team_id' => $team->id, 'parent_id' => null, 'sort_order' => 0]);

            return $team;
        });
        $team->loadCount('users');

        return ['team' => $this->serialize($team, $context->workspace->id)];
    }

    /** @param Arguments $arguments
     * @return array<string, mixed>
     */
    private function update(array $arguments, McpToolContext $context): array
    {
        $team = $this->team($arguments, $context, Ability::UPDATE);
        $data = validator($arguments, ['name' => ['required', 'string', 'max:50', Rule::unique('workspace_teams', 'name')->where('workspace_id', $context->workspace->id)->ignore($team->id)]])->validate();
        $team->update(['name' => $data['name']]);
        Folder::where('team_id', $team->id)->whereNull('parent_id')->update(['name' => $data['name']]);
        $team->refresh()->loadCount('users');

        return ['team' => $this->serialize($team, $context->workspace->id)];
    }

    /** @param Arguments $arguments
     * @return array<string, mixed>
     */
    private function changeMembers(array $arguments, McpToolContext $context, bool $replace): array
    {
        $team = $this->team($arguments, $context, Ability::MANAGE_MEMBERS);
        $data = validator($arguments, [
            'user_ids' => ['required', 'array'], 'user_ids.*' => ['string', 'distinct', Rule::exists('users', 'id')],
            'workspace_role' => ['sometimes', Rule::in($this->roles())],
        ])->validate();
        $userIds = array_values($data['user_ids']);
        if ($replace) {
            $this->memberships->replaceMembers($team, $userIds, $data['workspace_role'] ?? null, $context->user);
        } else {
            $this->memberships->addMembers($team, $userIds, $data['workspace_role'] ?? null, $context->user);
        }
        $team->load(['users:id,name,email,role,can_create_workspace'])->loadCount('users');

        return ['team' => $this->serialize($team, $context->workspace->id, true)];
    }

    /** @param Arguments $arguments
     * @return array<string, mixed>
     */
    private function setMemberTeams(array $arguments, McpToolContext $context): array
    {
        Gate::forUser($context->user)->authorize(Ability::MANAGE_MEMBERS->value, $context->workspace);
        $data = validator($arguments, [
            'user_id' => ['required', 'string', Rule::exists('users', 'id')],
            'team_ids' => ['required', 'array'],
            'team_ids.*' => ['string', 'distinct', Rule::exists('workspace_teams', 'id')->where('workspace_id', $context->workspace->id)],
            'workspace_role' => ['sometimes', Rule::in($this->roles())],
        ])->validate();
        $user = $context->workspace->users()->where('users.id', $data['user_id'])->firstOrFail();
        $teamIds = array_values($data['team_ids']);
        $this->memberships->replaceUserTeamsForWorkspace($context->workspace, $user, $teamIds, $data['workspace_role'] ?? null, $context->user);

        return ['user_id' => $user->id, 'workspace_id' => $context->workspace->id, 'team_ids' => array_values($data['team_ids'])];
    }

    /** @param Arguments $arguments */
    private function team(array $arguments, McpToolContext $context, Ability $ability): WorkspaceTeam
    {
        $this->features->abortIfDisabled('teams_enabled');
        $team = WorkspaceTeam::where('workspace_id', $context->workspace->id)
            ->where('id', McpToolArguments::string($arguments, 'team_id'))
            ->first();
        if (! $team || Gate::forUser($context->user)->denies($ability->value, $team)) {
            throw ValidationException::withMessages(['team_id' => 'Team not found or forbidden.']);
        }

        return $team;
    }

    /** @return list<string> */
    private function roles(): array
    {
        return $this->features->sharingRolesEnabled() ? ['admin', 'manager', 'member'] : ['member'];
    }

    /** @return array<string, mixed> */
    private function serialize(WorkspaceTeam $team, string $workspaceId, bool $includeUsers = false): array
    {
        if ($includeUsers) {
            $team->loadMissing('users:id,name,email,role,can_create_workspace');
        }
        $data = [
            'id' => $team->id, 'workspace_id' => $workspaceId, 'name' => $team->name,
            'users_count' => $team->users_count ?? $team->users()->count(),
            'created_at' => $team->created_at?->toIso8601String(), 'updated_at' => $team->updated_at?->toIso8601String(),
        ];
        if ($includeUsers) {
            $roles = DB::table('user_workspace')->where('workspace_id', $team->workspace_id)->whereIn('user_id', $team->users->pluck('id'))->pluck('role', 'user_id');
            $data['users'] = $team->users->map(fn (User $user) => [
                'id' => $user->id, 'name' => $user->name, 'email' => $user->email,
                'workspace_role' => $roles->get($user->id, 'member'),
            ])->values();
        }

        return $data;
    }
}
