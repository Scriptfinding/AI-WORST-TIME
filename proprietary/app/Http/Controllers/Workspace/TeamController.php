<?php

namespace App\Http\Controllers\Workspace;

use App\Authorization\AuthorizationContextFactory;
use App\Enums\Authorization\Ability;
use App\Http\Controllers\Controller;
use App\Mail\WorkspaceInvitationMail;
use App\Models\Flow;
use App\Models\Folder;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceProxy;
use App\Models\WorkspaceTeam;
use App\Services\FeatureFlags\FeatureFlagService;
use App\Services\Workspace\WorkspaceInvitationManager;
use App\Services\Workspace\WorkspaceTeamMembershipManager;
use App\Support\IdentityEmail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

class TeamController extends Controller
{
    public function __construct(
        private readonly WorkspaceTeamMembershipManager $workspaceTeams,
        private readonly WorkspaceInvitationManager $workspaceInvitations,
        private readonly AuthorizationContextFactory $authorizationContexts,
    ) {}

    public function search(Request $request): JsonResponse
    {
        $this->features()->abortIfDisabled('teams_enabled');
        $workspace = $this->currentWorkspace();
        $this->authorize(Ability::VIEW->value, $workspace);
        $actor = $request->user();
        abort_unless($actor instanceof User, 401);

        $context = $this->authorizationContexts->for($actor, $workspace->id);
        $canManageWorkspace = $actor->can(Ability::MANAGE_MEMBERS->value, $workspace);
        $query = $workspace->teams()->orderBy('name');

        if (! $canManageWorkspace) {
            $query->whereIn('workspace_teams.id', $context->teamIds);
        }

        return response()->json($query->get(['workspace_teams.id', 'workspace_teams.name']));
    }

    public function store(Request $request): RedirectResponse
    {
        $this->features()->abortIfDisabled('teams_enabled');
        $workspace = $this->currentWorkspace();
        $this->authorize(Ability::CREATE->value, [WorkspaceTeam::class, $workspace]);
        $workspaceId = $workspace->id;

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:50', function ($attribute, $value, $fail) use ($workspaceId) {
                if (WorkspaceTeam::where('workspace_id', $workspaceId)->whereRaw('LOWER(name) = ?', [mb_strtolower($value)])->exists()) {
                    $fail('A team with this name already exists.');
                }
            }],
        ]);

        $team = WorkspaceTeam::create([
            'workspace_id' => $workspaceId,
            'name' => $validated['name'],
        ]);

        Folder::create([
            'name' => $team->name,
            'workspace_id' => $workspaceId,
            'is_shared' => true,
            'team_id' => $team->id,
            'owner_id' => null,
            'parent_id' => null,
            'sort_order' => 0,
        ]);

        return back()->with('success', "Team \"{$team->name}\" created.");
    }

    public function update(Request $request, string $teamId): RedirectResponse
    {
        $this->features()->abortIfDisabled('teams_enabled');
        $team = $this->currentTeam($teamId);
        $this->authorize(Ability::UPDATE->value, $team);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:50', function ($attribute, $value, $fail) use ($team) {
                if (WorkspaceTeam::where('workspace_id', $team->workspace_id)->whereRaw('LOWER(name) = ?', [mb_strtolower($value)])->where('id', '!=', $team->id)->exists()) {
                    $fail('A team with this name already exists.');
                }
            }],
        ]);

        $team->update($validated);

        if (isset($validated['name'])) {
            Folder::where('team_id', $team->id)->whereNull('parent_id')->update(['name' => $validated['name']]);
        }

        return back()->with('success', 'Team updated.');
    }

    public function destroy(Request $request, string $teamId): RedirectResponse
    {
        $this->features()->abortIfDisabled('teams_enabled');
        $team = $this->currentTeam($teamId);
        $this->authorize(Ability::DELETE->value, $team);

        DB::transaction(fn () => $this->deleteTeam($team), 3);

        return back()->with('success', 'Team deleted.');
    }

    public function destroyBatch(Request $request): RedirectResponse
    {
        $this->features()->abortIfDisabled('teams_enabled');
        $workspace = $this->currentWorkspace();

        $validated = $request->validate([
            'team_ids' => ['required', 'array', 'min:1'],
            'team_ids.*' => [
                'string',
                'distinct',
                \Illuminate\Validation\Rule::exists('workspace_teams', 'id')
                    ->where('workspace_id', $workspace->id),
            ],
        ]);

        /** @var list<string> $teamIds */
        $teamIds = $validated['team_ids'];
        $teams = WorkspaceTeam::query()->whereIn('id', $teamIds)->orderBy('id')->get();

        foreach ($teams as $team) {
            $this->authorize(Ability::DELETE->value, $team);
        }

        DB::transaction(function () use ($teams): void {
            foreach ($teams as $team) {
                $this->deleteTeam($team);
            }
        }, 3);

        $count = $teams->count();

        return back()->with('success', $count === 1 ? 'Team deleted.' : "{$count} teams deleted.");
    }

    public function addMember(Request $request, string $teamId): RedirectResponse
    {
        $this->features()->abortIfDisabled('teams_enabled');
        $team = $this->currentTeam($teamId);
        $this->authorize(Ability::MANAGE_MEMBERS->value, $team);

        $validated = $request->validate([
            'user_id' => [
                'required',
                'string',
                \Illuminate\Validation\Rule::exists('users', 'id'),
            ],
        ]);
        $user = User::where('id', $validated['user_id'])
            ->whereHas('workspaces', fn ($query) => $query->where('workspaces.id', $team->workspace_id))
            ->firstOrFail();
        $this->assertCanManageTeamsOf($request, $user->id);

        $this->workspaceTeams->addMembers(
            $team,
            [$user->id],
            actor: $request->user(),
        );

        return back()->with('success', 'Member added to team.');
    }

    public function inviteMember(Request $request, string $teamId): RedirectResponse
    {
        $this->features()->abortIfDisabled('teams_enabled');
        $team = $this->currentTeam($teamId);
        $this->authorize(Ability::MANAGE_MEMBERS->value, $team);
        $validated = $request->validate([
            'email' => ['required', 'email'],
        ]);
        $email = IdentityEmail::normalize($validated['email']);
        $actor = $request->user();
        abort_unless($actor instanceof User, 401);
        $result = $this->workspaceInvitations->inviteOrAttach(
            $this->currentWorkspace(),
            $email,
            'member',
            $actor,
            false,
            $actor,
            $team,
        );

        if ($result instanceof User) {
            return back()->with('success', 'Member added to team.');
        }

        try {
            Mail::to($email)->send(new WorkspaceInvitationMail($result));
        } catch (\Throwable $e) {
            return back()->withErrors(['invite_error' => $e->getMessage()]);
        }

        return back()->with('success', 'Invitation sent to '.$email.'.');
    }

    public function removeMember(Request $request, string $teamId, string $userId): RedirectResponse
    {
        $this->features()->abortIfDisabled('teams_enabled');
        $team = $this->currentTeam($teamId);
        $this->authorize(Ability::MANAGE_MEMBERS->value, $team);
        $user = User::where('id', $userId)->firstOrFail();
        abort_unless($team->users()->where('users.id', $user->id)->exists(), 404);
        $this->assertCanManageTeamsOf($request, $user->id);

        $remainingUserIds = $team->users()
            ->where('users.id', '!=', $user->id)
            ->pluck('users.id')
            ->all();
        $remainingUserIds = array_values(array_filter(
            $remainingUserIds,
            static fn (mixed $id): bool => is_string($id),
        ));
        $this->workspaceTeams->replaceMembers(
            $team,
            $remainingUserIds,
            actor: $request->user(),
        );

        return back()->with('success', 'Member removed from team.');
    }

    /**
     * Instance administrators can only be managed by other instance
     * administrators; a workspace admin must not alter their teams.
     */
    private function assertCanManageTeamsOf(Request $request, string $userId): void
    {
        $actor = $request->user();
        if ($actor?->isAdmin()) {
            return;
        }

        $target = User::query()->findOrFail($userId);
        abort_if($target->isAdmin(), 403, 'Only an instance administrator can manage this member.');
    }

    private function currentWorkspace(): Workspace
    {
        return Workspace::query()->findOrFail($this->currentWorkspaceId());
    }

    private function currentTeam(string $teamId): WorkspaceTeam
    {
        return WorkspaceTeam::where('workspace_id', $this->currentWorkspaceId())
            ->where('id', $teamId)
            ->firstOrFail();
    }

    private function currentWorkspaceId(): string
    {
        $workspaceId = $this->workspaceIdFromSession();

        return $workspaceId;
    }

    private function features(): FeatureFlagService
    {
        return app(FeatureFlagService::class);
    }

    private function deleteTeam(WorkspaceTeam $team): void
    {
        if (WorkspaceProxy::query()->where('team_id', $team->id)->exists()) {
            throw ValidationException::withMessages([
                'team' => 'This team owns one or more proxies. Reassign or delete those proxies before deleting the team.',
            ]);
        }

        Flow::where('team_id', $team->id)
            ->update(['team_id' => null, 'visibility' => 'owner', 'workspace_folder_id' => null]);

        Folder::where('team_id', $team->id)->each(function (Folder $folder) {
            $folder->delete();
        });

        $team->delete();
    }
}
