<?php

/*
 * Portions of this file implement paid Puppetflow features (teams,
 * workspace sharing roles and invitations) and are licensed under the
 * Puppetflow Proprietary License. See LICENSE_PROPRIETARY.md.
 */

namespace App\Http\Controllers\Workspace;

use App\Authorization\AuthorizationContextFactory;
use App\Authorization\Visibility\SharedResourceVisibility;
use App\DTO\Workspace\WorkspaceMutationData;
use App\Enums\Authorization\Ability;
use App\Http\Controllers\Controller;
use App\Http\Requests\Workspace\StoreWorkspaceRequest;
use App\Http\Requests\Workspace\UpdateWorkspaceRequest;
use App\Mail\WorkspaceInvitationMail;
use App\Models\Flow;
use App\Models\McpOauthClient;
use App\Models\McpOauthConnection;
use App\Models\PrivateLibrary;
use App\Models\RegistrationRequest;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceInvitation;
use App\Models\WorkspaceProxy;
use App\Services\Auth\RegistrationRequestApprovalService;
use App\Services\FeatureFlags\FeatureFlagService;
use App\Services\Mcp\McpToolService;
use App\Services\Storage\UploadStorage;
use App\Services\Workspace\WorkspaceInvitationManager;
use App\Services\Workspace\WorkspaceMembershipManager;
use App\Services\Workspace\WorkspaceProvisioner;
use App\Support\IdentityEmail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;

class WorkspaceController extends Controller
{
    public function __construct(
        private readonly AuthorizationContextFactory $authorizationContexts,
        private readonly SharedResourceVisibility $sharedVisibility,
        private readonly WorkspaceProvisioner $workspaceProvisioner,
        private readonly WorkspaceMembershipManager $workspaceMemberships,
        private readonly WorkspaceInvitationManager $workspaceInvitations,
        private readonly UploadStorage $uploads,
        private readonly RegistrationRequestApprovalService $registrationApprovals,
    ) {}

    public function create(Request $request): Response
    {
        $this->authorize(Ability::CREATE->value, Workspace::class);
        $this->features()->abortIfWorkspaceLimitReached();

        return Inertia::render('Workspace/WorkspaceCreate/WorkspaceCreate');
    }

    public function store(StoreWorkspaceRequest $request): RedirectResponse
    {
        $this->authorize(Ability::CREATE->value, Workspace::class);
        $this->features()->abortIfWorkspaceLimitReached();

        /** @var User $user */
        $user = $request->user();
        $workspace = $this->workspaceProvisioner->create(
            $user,
            $request->mutationData(),
            $user,
        );

        session(['current_workspace_id' => $workspace->id]);
        $user->rememberWorkspace($workspace);

        return redirect()->route('dashboard')
            ->with('success', 'Workspace created.');
    }

    public function switch(Request $request, Workspace $workspace): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $this->authorize(Ability::VIEW->value, $workspace);

        session(['current_workspace_id' => $workspace->id]);
        $user->rememberWorkspace($workspace);

        $redirect = $request->string('redirect', '/')->toString();

        $safePrefixes = [
            '/',
            '/flows',
            '/variables',
            '/ai-models',
            '/channels',
            '/mailboxes',
            '/snippets',
            '/workspace/',
            '/integrations',
            '/admin/',
            '/profile',
        ];

        $isSafe = false;
        foreach ($safePrefixes as $prefix) {
            if ($prefix === '/' ? $redirect === '/' : str_starts_with($redirect, $prefix)) {
                $isSafe = true;
                break;
            }
        }

        if (! $isSafe || $this->containsResourceIdentifier($redirect)) {
            return redirect()->route('dashboard');
        }

        return redirect($redirect);
    }

    private function containsResourceIdentifier(string $path): bool
    {
        return preg_match(
            '#(?:'
                .'(?:/|=)(?:flow|team|snip|chan|aim|intg|act|work|mbwa|var|fld|user|mbox|trig)_[A-Z0-9]{12}(?:[/?&\#]|$)'
                .'|/(?:'
                    .'\d+'
                    .'|[0-9A-HJKMNP-TV-Z]{26}'
                    .'|[0-9A-F]{8}-[0-9A-F]{4}-[1-5][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}'
                .')(?:[/?\#]|$)'
            .')#i',
            $path,
        ) === 1;
    }

    public function settings(Request $request, McpToolService $mcpTools): Response
    {
        $workspace = $this->currentWorkspace()
            ->load('owner:id,name,icon_type,icon_value,icon_color,avatar_path,updated_at');
        $this->authorize(Ability::VIEW->value, $workspace);

        /** @var User $user */
        $user = $request->user();
        $isOwner = $workspace->owner_id === $user->id;
        $isWorkspaceAdmin = Gate::forUser($user)->allows(Ability::UPDATE->value, $workspace);
        $context = $this->authorizationContexts->for($user, $workspace->id);
        $privateLibrariesEnabled = $this->features()->enabled('private_libraries_enabled');
        $mcpEnabled = $this->features()->enabled('mcp_enabled');
        $existingMcpSetting = $workspace->mcpSetting()->first();
        $mcpSetting = $mcpEnabled
            ? ($existingMcpSetting && $existingMcpSetting->stale
                ? null
                : ($existingMcpSetting ?: ($isWorkspaceAdmin
                    ? $workspace->mcpSetting()->create(['workspace_id' => $workspace->id])
                    : null)))
            : null;
        $defaultMcpToolNames = $mcpTools->defaultToolNames();
        /** @var \Illuminate\Database\Eloquent\Builder<PrivateLibrary> $privateLibraries */
        $privateLibraries = PrivateLibrary::query()
            ->where('stale', false)
            ->with(['owner:id,name', 'team:id,name'])
            ->orderBy('label');
        $this->sharedVisibility->applyView(
            $privateLibraries,
            $context,
            scopeColumn: 'visibility',
        );
        /** @var \Illuminate\Database\Eloquent\Builder<WorkspaceProxy> $proxies */
        $proxies = WorkspaceProxy::query()
            ->with(['owner:id,name', 'team:id,name'])
            ->orderBy('label');
        $this->sharedVisibility->applyView(
            $proxies,
            $context,
            scopeColumn: 'visibility',
        );
        /** @var \Illuminate\Database\Eloquent\Builder<Flow> $mcpFlows */
        $mcpFlows = Flow::query()
            ->with(['owner:id,name', 'team:id,name'])
            ->orderBy('name');
        $this->sharedVisibility->applyView(
            $mcpFlows,
            $context,
            ownerColumn: 'owner_id',
            scopeColumn: 'visibility',
        );

        return Inertia::render('Workspace/WorkspaceSettings/WorkspaceSettings', [
            'workspace' => $workspace,
            'isWorkspaceAdmin' => $isWorkspaceAdmin,
            'isOwner' => $isOwner || $user->isAdmin(),
            'proxies' => $proxies->get()
                ->map(fn (WorkspaceProxy $proxy) => [
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
                ]),
            'privateLibrariesEnabled' => $privateLibrariesEnabled,
            'mcpEnabled' => $mcpEnabled,
            'privateLibraries' => $privateLibrariesEnabled
                ? $privateLibraries->get()
                    ->map(fn (PrivateLibrary $library) => [
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
                        'items_count' => is_array($library->manifest['items'] ?? null) ? count($library->manifest['items']) : 0,
                        'owner' => $library->owner ? ['id' => $library->owner->id, 'name' => $library->owner->name] : null,
                        'team' => $library->team ? ['id' => $library->team->id, 'name' => $library->team->name] : null,
                    ])
                    ->values()
                : [],
            'teams' => $isWorkspaceAdmin
                ? $workspace->teams()->orderBy('name')->get(['id', 'name'])
                : [],
            'mcpEndpoint' => url('/api/mcp-server/http'),
            'mcpOauthEndpoint' => url("/api/workspaces/{$workspace->id}/mcp-server/http"),
            'mcpOauthAuthorizeUrl' => url('/oauth/authorize'),
            'mcpOauthTokenUrl' => url('/oauth/token'),
            'mcpSettings' => [
                'enabled' => $mcpSetting ? (bool) $mcpSetting->enabled : false,
                'include_unexposed_flow_previews' => $mcpSetting ? (bool) $mcpSetting->include_unexposed_flow_previews : false,
                'enabled_tools' => $mcpSetting ? $mcpTools->enabledToolNames($mcpSetting) : $defaultMcpToolNames,
            ],
            'mcpTools' => $mcpEnabled && $isWorkspaceAdmin ? collect($mcpTools->allTools())
                ->map(fn (array $tool) => [
                    'name' => $tool['name'],
                    'description' => $tool['description'],
                    'enabled_by_default' => in_array($tool['name'], $defaultMcpToolNames, true),
                ])
                ->values() : [],
            'mcpTokens' => $mcpEnabled && $isWorkspaceAdmin ? $workspace->mcpAccessTokens()
                ->with('user:id,name')
                ->whereNull('revoked_at')
                ->where('stale', false)
                ->latest()
                ->get()
                ->map(fn ($token) => [
                    'id' => $token->id,
                    'name' => $token->name,
                    'token_preview' => $token->token_preview,
                    'last_used_at' => $token->last_used_at?->toIso8601String(),
                    'created_at' => $token->created_at?->toIso8601String(),
                    'user' => $token->user ? ['id' => $token->user->id, 'name' => $token->user->name] : null,
                ]) : [],
            'mcpOauthClients' => $mcpEnabled && $isWorkspaceAdmin ? $workspace->mcpOauthClients()
                ->with('user:id,name')
                ->whereNull('revoked_at')
                ->where('stale', false)
                ->latest()
                ->get()
                ->map(fn (McpOauthClient $client) => [
                    'id' => $client->id,
                    'oauth_client_id' => $client->oauth_client_id,
                    'name' => $client->name,
                    'redirect_uri' => $client->redirect_uri,
                    'created_at' => $client->created_at?->toIso8601String(),
                    'user' => $client->user ? ['id' => $client->user->id, 'name' => $client->user->name] : null,
                ]) : [],
            'mcpOauthConnections' => $mcpEnabled && $isWorkspaceAdmin ? $workspace->mcpOauthConnections()
                ->with('user:id,name')
                ->whereNull('revoked_at')
                ->where('stale', false)
                ->latest('last_used_at')
                ->get()
                ->map(fn (McpOauthConnection $connection) => [
                    'id' => $connection->id,
                    'oauth_client_id' => $connection->oauth_client_id,
                    'client_name' => $connection->client_name,
                    'last_used_at' => $connection->last_used_at?->toIso8601String(),
                    'created_at' => $connection->created_at?->toIso8601String(),
                    'user' => $connection->user ? ['id' => $connection->user->id, 'name' => $connection->user->name] : null,
                ]) : [],
            'mcpFlows' => $mcpEnabled ? $mcpFlows
                ->get(['id', 'name', 'description', 'visibility', 'team_id', 'owner_id', 'is_published', 'available_in_mcp', 'updated_at'])
                ->map(fn (Flow $flow) => [
                    'id' => $flow->id,
                    'name' => $flow->name,
                    'description' => $flow->description,
                    'visibility' => $flow->visibility,
                    'team' => $flow->team ? ['id' => $flow->team->id, 'name' => $flow->team->name] : null,
                    'owner' => $flow->owner ? ['id' => $flow->owner->id, 'name' => $flow->owner->name] : null,
                    'is_published' => (bool) $flow->is_published,
                    'available_in_mcp' => (bool) $flow->available_in_mcp,
                    'updated_at' => $flow->updated_at?->toIso8601String(),
                ]) : [],
        ]);
    }

    public function members(Request $request): Response
    {
        $workspace = $this->currentWorkspace()
            ->load('users:users.id,users.id,users.name,users.email,users.role,users.can_create_workspace,users.avatar_path,users.icon_type,users.icon_value,users.icon_color,users.updated_at');
        $this->authorize(Ability::VIEW->value, $workspace);

        /** @var User $currentUser */
        $currentUser = $request->user();
        $isAdmin = Gate::forUser($currentUser)->allows(Ability::MANAGE_MEMBERS->value, $workspace);
        $authorizationContext = $this->authorizationContexts->for($currentUser, $workspace->id);
        $canViewTeamInvitations = $this->features()->sharingRolesEnabled()
            && $authorizationContext->workspaceRole === 'manager';

        $pendingInvitations = ($isAdmin || $canViewTeamInvitations)
            ? WorkspaceInvitation::query()
                ->with('team:id,name')
                ->where('workspace_id', $workspace->id)
                ->where('expires_at', '>', now())
                ->when(
                    ! $isAdmin,
                    fn ($query) => $query->whereIn('team_id', $authorizationContext->teamIds),
                )
                ->orderBy('created_at', 'desc')
                ->get([
                    'id',
                    'team_id',
                    'email',
                    'role',
                    'can_create_workspace',
                    'token',
                    'registration_name',
                    'registration_submitted_at',
                    'registration_email_verified_at',
                    'created_at',
                ])
            : [];

        $callerPivot = $workspace->users->find($currentUser->id)?->pivot;
        $callerRole = $currentUser->isAdmin()
            ? 'admin'
            : ($this->features()->sharingRolesEnabled() ? ($callerPivot?->getAttribute('role') ?? 'member') : 'member');

        $flowCountsByOwner = Flow::where('workspace_id', $workspace->id)
            ->selectRaw('owner_id, COUNT(*) as total')
            ->groupBy('owner_id')
            ->pluck('total', 'owner_id');
        foreach ($workspace->users as $member) {
            $rawCount = $flowCountsByOwner[$member->id] ?? 0;
            $member->flows_count = is_numeric($rawCount) ? (int) $rawCount : 0;
        }

        if ($this->features()->teamsEnabled()) {
            $teamsQuery = $workspace->teams()
                ->with('users:users.id,users.id,users.name,users.icon_type,users.icon_value,users.icon_color,users.avatar_path,users.updated_at')
                ->orderBy('name');
            if (! $isAdmin) {
                $teamsQuery->whereIn('workspace_teams.id', $authorizationContext->teamIds);
            }
            $teams = $teamsQuery->get();
        } else {
            $teams = collect();
        }

        $flowCountsByTeam = Flow::where('workspace_id', $workspace->id)
            ->where('visibility', 'team')
            ->whereNotNull('team_id')
            ->selectRaw('team_id, COUNT(*) as total')
            ->groupBy('team_id')
            ->pluck('total', 'team_id');
        foreach ($teams as $team) {
            $rawCount = $flowCountsByTeam[$team->id] ?? 0;
            $team->flows_count = is_numeric($rawCount) ? (int) $rawCount : 0;
            $team->can_manage_members = Gate::forUser($currentUser)
                ->allows(Ability::MANAGE_MEMBERS->value, $team);
            $team->can_update = Gate::forUser($currentUser)
                ->allows(Ability::UPDATE->value, $team);
            $team->can_delete = Gate::forUser($currentUser)
                ->allows(Ability::DELETE->value, $team);
            foreach ($team->users as $user) {
                $workspaceUser = $workspace->users->find($user->id);
                abort_unless($workspaceUser instanceof User || $workspaceUser === null, 500);
                $pivot = $workspaceUser?->pivot;
                $user->workspace_role = $pivot?->getAttribute('role') ?? 'member';
            }
        }

        if ($callerRole === 'manager') {
            $visibleUserIds = DB::table('team_user')
                ->where('workspace_id', $workspace->id)
                ->whereIn('team_id', $authorizationContext->teamIds)
                ->pluck('user_id')
                ->all();
            $workspace->setRelation(
                'users',
                $workspace->users->whereIn('id', $visibleUserIds)->values(),
            );
        }

        return Inertia::render('Workspace/WorkspaceMembers/WorkspaceMembers', [
            'workspace' => $workspace,
            'isWorkspaceAdmin' => $isAdmin,
            'callerWorkspaceRole' => $callerRole,
            'canCreateTeam' => Gate::forUser($currentUser)
                ->allows(Ability::CREATE->value, [\App\Models\WorkspaceTeam::class, $workspace]),
            'pendingInvitations' => $pendingInvitations,
            'registrationRequests' => $isAdmin
                ? RegistrationRequest::query()
                    ->latest()
                    ->get(['id', 'name', 'email', 'email_verified_at', 'origin', 'created_at'])
                : [],
            'teams' => $teams,
        ]);
    }

    public function usersSearch(Request $request): JsonResponse
    {
        $workspace = $this->currentWorkspace();
        $this->authorize(Ability::VIEW->value, $workspace);
        $query = $workspace->users()->select('users.id', 'users.name', 'users.email', 'user_workspace.role as workspace_role');
        $currentUser = $this->user($request);
        $context = $this->authorizationContexts->for($currentUser, $workspace->id);
        if (! $this->features()->sharingRolesEnabled() || $context->workspaceRole !== 'manager') {
            $context = null;
        }
        if ($context !== null && ! $context->isInstanceAdmin()) {
            $visibleUserIds = DB::table('team_user')
                ->where('workspace_id', $workspace->id)
                ->whereIn('team_id', $context->teamIds)
                ->pluck('user_id');
            $query->whereIn('users.id', $visibleUserIds);
        }

        if ($id = $request->string('id')->toString()) {
            $query->where('users.id', $id);
        } elseif ($search = $request->string('q')->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('users.name', 'like', "%{$search}%")
                    ->orWhere('users.email', 'like', "%{$search}%");
            });
        }

        return response()->json(
            $query->orderBy('users.name')->limit(50)->get()
        );
    }

    public function transferOwnership(Request $request): RedirectResponse
    {
        $workspace = $this->currentWorkspace();
        $this->authorize(Ability::TRANSFER_OWNERSHIP->value, $workspace);

        /** @var array{owner_id: string} $validated */
        $validated = $request->validate([
            'owner_id' => ['required', 'string', 'exists:users,id'],
        ]);

        $newOwner = $workspace->users()
            ->where('users.id', $validated['owner_id'])
            ->firstOrFail();

        $this->workspaceProvisioner->transferOwnership($workspace, $newOwner, $this->user($request));

        return back()->with('success', "Ownership transferred to {$newOwner->name}.");
    }

    public function update(UpdateWorkspaceRequest $request): RedirectResponse
    {
        $workspace = $this->currentWorkspace();
        $this->authorize(Ability::UPDATE->value, $workspace);
        $data = $request->mutationData()->normalized($workspace, $this->features());
        $this->workspaceProvisioner->update($workspace, $data);

        return back()->with('success', 'Workspace updated.');
    }

    public function addMember(Request $request): RedirectResponse
    {
        $workspace = $this->currentWorkspace();
        $user = $this->user($request);
        $this->authorize(Ability::MANAGE_MEMBERS->value, $workspace);
        abort_if($request->has('can_create_workspace') && ! $user->isAdmin(), 403);
        $validated = $request->validate([
            'email' => 'required|email',
            'role' => 'required|in:'.$this->allowedMemberRoles(),
            'can_create_workspace' => 'boolean',
        ]);

        if ($validated['role'] === 'admin') {
            Gate::forUser($user)->authorize(Ability::UPDATE->value, $workspace);
        }

        $email = IdentityEmail::normalize($validated['email']);
        $canCreateWorkspace = array_key_exists('can_create_workspace', $validated)
            ? (bool) $validated['can_create_workspace']
            : null;
        $result = $this->workspaceInvitations->inviteOrAttach(
            $workspace,
            $email,
            $validated['role'],
            $user,
            $canCreateWorkspace,
            $user,
        );

        if ($result instanceof User) {
            return back()->with('success', 'Member added.');
        }

        $invitation = $result;

        try {
            Mail::to($email)->send(new WorkspaceInvitationMail($invitation));
        } catch (\Throwable $e) {
            return back()->withErrors(['invite_error' => $e->getMessage()]);
        }

        return back()->with('success', 'Invitation sent to '.$email.'.');
    }

    public function resendInvitation(Request $request, int $invitationId): RedirectResponse
    {
        $workspace = $this->currentWorkspace();

        $invitation = WorkspaceInvitation::where('id', $invitationId)
            ->where('workspace_id', $workspace->id)
            ->where('expires_at', '>', now())
            ->firstOrFail();
        try {
            $invitation = $this->workspaceInvitations->renew($invitation, $this->user($request));
            Mail::to($invitation->email)->send(new WorkspaceInvitationMail($invitation));
        } catch (\Throwable $e) {
            return back()->withErrors(['invite_error' => $e->getMessage()]);
        }

        return back()->with('success', 'Invitation resent to '.$invitation->email.'.');
    }

    public function cancelInvitation(Request $request, int $invitationId): RedirectResponse
    {
        $workspace = $this->currentWorkspace();

        $invitation = WorkspaceInvitation::where('id', $invitationId)
            ->where('workspace_id', $workspace->id)
            ->firstOrFail();
        $this->workspaceInvitations->cancel($invitation, $this->user($request));

        return back()->with('success', 'Invitation cancelled.');
    }

    public function validateInvitation(Request $request, int $invitationId): RedirectResponse
    {
        $workspace = $this->currentWorkspace();
        $validated = $request->validate([
            'role' => 'required|in:'.$this->allowedMemberRoles(),
        ]);

        $invitation = WorkspaceInvitation::where('id', $invitationId)
            ->where('workspace_id', $workspace->id)
            ->whereNotNull('registration_submitted_at')
            ->firstOrFail();
        $actor = $this->user($request);
        $isWorkspaceAdmin = Gate::forUser($actor)
            ->allows(Ability::MANAGE_MEMBERS->value, $workspace);
        $role = $isWorkspaceAdmin ? $validated['role'] : 'member';

        if ($role === 'admin') {
            Gate::forUser($actor)->authorize(Ability::UPDATE->value, $workspace);
        }

        $result = $this->workspaceInvitations->provisionUser(
            $invitation,
            $actor,
            $role,
        );

        $message = $result['created']
            ? 'Account created and added to workspace for '.$invitation->email.'.'
            : 'Workspace membership updated for '.$result['user']->email.'.';

        return back()->with('success', $message);
    }

    public function approveRegistrationRequest(
        Request $request,
        int $registrationRequestId,
    ): RedirectResponse {
        $workspace = $this->currentWorkspace();
        $this->authorize(Ability::MANAGE_MEMBERS->value, $workspace);

        $pending = RegistrationRequest::query()->findOrFail($registrationRequestId);
        $this->registrationApprovals->approve(
            $pending,
            [$workspace->id => 'member'],
            $this->user($request),
        );

        return back()->with('success', 'Invitation request approved and added to this workspace.');
    }

    public function rejectRegistrationRequest(
        Request $request,
        int $registrationRequestId,
    ): RedirectResponse {
        $workspace = $this->currentWorkspace();
        $this->authorize(Ability::MANAGE_MEMBERS->value, $workspace);

        $this->registrationApprovals->reject(
            RegistrationRequest::query()->whereKey($registrationRequestId)->firstOrFail(),
        );

        return back()->with('success', 'Invitation request rejected.');
    }

    public function updateMember(Request $request, string $userId): RedirectResponse
    {
        $workspace = $this->currentWorkspace();
        $actor = $this->user($request);
        $this->authorize(Ability::MANAGE_MEMBERS->value, $workspace);
        abort_if($request->has('can_create_workspace') && ! $actor->isAdmin(), 403);
        $validated = $request->validate([
            'role' => 'required|in:'.$this->allowedMemberRoles(),
            'can_create_workspace' => 'boolean',
        ]);

        $user = User::where('id', $userId)->firstOrFail();
        $this->workspaceMemberships->changeRole(
            $workspace,
            $user,
            $validated['role'],
            $actor,
            $request->has('can_create_workspace')
                ? $request->boolean('can_create_workspace')
                : null,
        );

        return back()->with('success', 'Member updated.');
    }

    public function removeMember(Request $request, string $userId): RedirectResponse
    {
        $workspace = $this->currentWorkspace();
        $this->authorize(Ability::MANAGE_MEMBERS->value, $workspace);

        $this->workspaceMemberships->remove(
            $workspace,
            User::where('id', $userId)->firstOrFail(),
            $this->user($request),
        );

        return back()->with('success', 'Member removed.');
    }

    public function removeMembers(Request $request): RedirectResponse
    {
        $workspace = $this->currentWorkspace();
        $this->authorize(Ability::MANAGE_MEMBERS->value, $workspace);

        $validated = $request->validate([
            'user_ids' => ['required', 'array', 'min:1'],
            'user_ids.*' => [
                'string',
                'distinct',
                \Illuminate\Validation\Rule::exists('users', 'id'),
            ],
        ]);

        /** @var list<string> $userIds */
        $userIds = $validated['user_ids'];
        $members = User::query()
            ->whereIn('id', $userIds)
            ->whereHas('workspaces', fn ($query) => $query->where('workspaces.id', $workspace->id))
            ->orderBy('id')
            ->get();
        if ($members->count() !== count($userIds)) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'user_ids' => 'Every selected user must belong to this workspace.',
            ]);
        }
        $actor = $this->user($request);

        DB::transaction(function () use ($workspace, $members, $actor): void {
            foreach ($members as $member) {
                $this->workspaceMemberships->remove($workspace, $member, $actor);
            }
        }, 3);

        $count = $members->count();

        return back()->with('success', $count === 1 ? 'Member removed.' : "{$count} members removed.");
    }

    public function updateIcon(Request $request): RedirectResponse
    {
        $workspace = $this->currentWorkspace();
        $this->authorize(Ability::UPDATE->value, $workspace);
        $request->validate([
            'icon' => ['required', 'file', 'mimes:jpg,jpeg,png,gif,webp', 'max:2048'],
        ]);

        $file = $request->file('icon');
        abort_unless($file instanceof UploadedFile, 422, 'A valid icon file is required.');
        $oldPath = is_string($workspace->icon_upload_path) ? $workspace->icon_upload_path : null;
        $filename = $this->uploads->storeRasterImage($file, $workspace->iconUploadDir());

        try {
            DB::transaction(function () use ($workspace, $filename): void {
                $this->workspaceProvisioner->update(
                    $workspace,
                    WorkspaceMutationData::fromValidated([
                        'icon_type' => 'upload',
                        'icon_value' => null,
                        'icon_color' => null,
                        'icon_upload_path' => $filename,
                    ]),
                );
            });
        } catch (\Throwable $exception) {
            $persisted = true;
            try {
                $persisted = Workspace::query()
                    ->whereKey($workspace->getKey())
                    ->where('icon_upload_path', $filename)
                    ->exists();
            } catch (\Throwable $verificationException) {
                report($verificationException);
            }

            if (! $persisted) {
                try {
                    $this->uploads->delete($filename);
                } catch (\Throwable $cleanupException) {
                    report($cleanupException);
                }
            }

            throw $exception;
        }

        if ($oldPath !== null && $oldPath !== $filename) {
            try {
                $this->uploads->delete($oldPath);
            } catch (\Throwable $exception) {
                report($exception);
            }
        }

        return back()->with('success', 'Workspace icon updated.');
    }

    public function destroy(Request $request): RedirectResponse
    {
        $workspace = $this->currentWorkspace();
        $user = $this->user($request);
        $this->authorize(Ability::DELETE->value, $workspace);

        DB::transaction(fn () => $workspace->delete(), 3);

        $next = $user->workspaces()->first();
        if ($next) {
            session(['current_workspace_id' => $next->id]);
            $user->rememberWorkspace($next);
        } else {
            session()->forget('current_workspace_id');
            $user->forceFill(['last_workspace_id' => null])->saveQuietly();
        }

        return redirect()->route('dashboard')
            ->with('success', 'Workspace deleted.');
    }

    public function destroyIcon(Request $request): RedirectResponse
    {
        $workspace = $this->currentWorkspace();
        $this->authorize(Ability::UPDATE->value, $workspace);

        $oldPath = is_string($workspace->icon_upload_path)
            ? $workspace->icon_upload_path
            : null;

        $this->workspaceProvisioner->update(
            $workspace,
            WorkspaceMutationData::fromValidated([
                'icon_type' => 'emoji',
                'icon_value' => null,
                'icon_color' => null,
                'icon_upload_path' => null,
            ]),
        );

        if ($oldPath !== null) {
            try {
                $this->uploads->delete($oldPath);
            } catch (\Throwable $exception) {
                report($exception);
            }
        }

        return back()->with('success', 'Workspace icon removed.');
    }

    /**
     * Roles assignable on invitations and member updates. When sharing roles
     * are disabled, everyone is invited or updated as a plain member.
     */
    private function allowedMemberRoles(): string
    {
        return $this->features()->sharingRolesEnabled() ? 'admin,manager,member' : 'member';
    }

    private function features(): FeatureFlagService
    {
        return app(FeatureFlagService::class);
    }

    private function currentWorkspace(): Workspace
    {
        $currentWorkspaceId = $this->workspaceIdFromSession();

        return Workspace::findOrFail($currentWorkspaceId);
    }

    private function user(Request $request): User
    {
        /** @var User $user */
        $user = $request->user();

        return $user;
    }
}
