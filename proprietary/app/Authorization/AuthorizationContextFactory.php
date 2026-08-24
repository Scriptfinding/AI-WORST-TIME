<?php

namespace App\Authorization;

use App\Models\User;
use App\Services\FeatureFlags\FeatureFlagService;
use Illuminate\Support\Facades\DB;

final class AuthorizationContextFactory
{
    /** @var array<string, AuthorizationContext> */
    private array $contexts = [];

    public function __construct(
        private readonly FeatureFlagService $features,
    ) {}

    public function for(User $user, string $workspaceId): AuthorizationContext
    {
        $cacheKey = $user->id.':'.$workspaceId;

        return $this->contexts[$cacheKey] ??= $this->build($user, $workspaceId);
    }

    public function cachedFor(User $user, string $workspaceId): ?AuthorizationContext
    {
        return $this->contexts[$user->id.':'.$workspaceId] ?? null;
    }

    public function forCurrentOr(User $user, string $workspaceId): AuthorizationContext
    {
        $sessionWorkspaceId = session('current_workspace_id');
        $currentWorkspaceId = session()->has('current_workspace_id') && is_string($sessionWorkspaceId) && $sessionWorkspaceId !== ''
            ? $sessionWorkspaceId
            : $workspaceId;

        return $this->for($user, $currentWorkspaceId);
    }

    public function forget(): void
    {
        $this->contexts = [];
    }

    private function build(User $user, string $workspaceId): AuthorizationContext
    {
        $membership = DB::table('user_workspace')
            ->where('user_id', $user->id)
            ->where('workspace_id', $workspaceId)
            ->first(['role']);

        $teamIds = DB::table('team_user')
            ->join('workspace_teams', 'workspace_teams.id', '=', 'team_user.team_id')
            ->where('team_user.user_id', $user->id)
            ->where('workspace_teams.workspace_id', $workspaceId)
            ->pluck('team_user.team_id')
            ->filter(fn (mixed $teamId): bool => is_string($teamId) && $teamId !== '')
            ->values()
            ->all();

        return new AuthorizationContext(
            user: $user,
            workspaceId: $workspaceId,
            isWorkspaceMember: $membership !== null,
            workspaceRole: $membership?->role,
            teamIds: array_values($teamIds),
            workspaceSharingEnabled: $this->features->workspaceSharingEnabled(),
            teamsEnabled: $this->features->teamsEnabled(),
        );
    }
}
