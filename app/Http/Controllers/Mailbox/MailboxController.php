<?php

/*
 * Explicit proprietary scope: the paid shared mailbox scopes in this file implement paid
 * Puppetflow features and are licensed under the Puppetflow Proprietary License.
 * See LICENSE_PROPRIETARY.md.
 */

namespace App\Http\Controllers\Mailbox;

use App\Authorization\AuthorizationContextFactory;
use App\Authorization\ResourceAssignmentValidator;
use App\Authorization\ScopeEvaluator;
use App\Authorization\Visibility\SharedResourceVisibility;
use App\Enums\Authorization\Ability;
use App\Http\Controllers\Controller;
use App\Models\Flow;
use App\Models\Mailbox;
use App\Models\MailboxDomain;
use App\Models\MailboxWatcher;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceTeam;
use App\Services\FeatureFlags\FeatureFlagService;
use App\Services\Integration\Other\Vendor\Mailbox\ManagedMailboxIntegrationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class MailboxController extends Controller
{
    public function __construct(
        private readonly AuthorizationContextFactory $authorizationContexts,
        private readonly SharedResourceVisibility $sharedVisibility,
        private readonly ScopeEvaluator $scopeEvaluator,
        private readonly ResourceAssignmentValidator $assignments,
    ) {}

    public function index(Request $request): Response
    {
        $workspaceId = $this->currentWorkspaceId();
        /** @var User $user */
        $user = $request->user();
        $context = $this->authorizationContexts->for($user, $workspaceId);
        $isAdmin = $this->scopeEvaluator->isAdministrator($context);

        if (! $this->features()->enabled('mailbox_enabled')) {
            return Inertia::render('Mailbox/Mailboxes', [
                'mailboxes' => [],
                'mailboxGroups' => [],
                'domains' => [],
                'integrations' => [],
                'teams' => [],
                'isAdmin' => $isAdmin,
            ]);
        }

        app(ManagedMailboxIntegrationService::class)->syncForWorkspace(
            Workspace::find($workspaceId),
            $user,
        );

        $mailboxQuery = Mailbox::query()
            ->where('stale', false);
        $this->sharedVisibility->applyView($mailboxQuery, $context);

        $mailboxModels = $mailboxQuery
            ->with(['domain.integration', 'user:id,name', 'team:id,name'])
            ->withCount([
                'emails',
                'emails as unread_count' => fn ($query) => $query->where('is_read', false),
            ])
            ->orderBy('created_at', 'desc')
            ->get();

        $ownerIds = $mailboxModels->pluck('user_id')->filter()->unique()->values()->all();
        $ownerRoles = ! empty($ownerIds)
            ? DB::table('user_workspace')
                ->where('workspace_id', $workspaceId)
                ->whereIn('user_id', $ownerIds)
                ->pluck('role', 'user_id')
                ->all()
            : [];
        /** @var array<int, string> $ownerRoles */
        $mailboxes = $mailboxModels->map(function (Mailbox $m) use ($ownerRoles): array {
            $domain = $m->domain;

            return [
                'id' => $m->id,
                'slug' => $m->slug,
                'group' => $m->group,
                'description' => $m->description,
                'is_active' => $m->is_active,
                'address' => $m->slug.'@'.$domain->name,
                'domain_id' => $m->domain_id,
                'domain_name' => $domain->name,
                'integration_id' => $domain->integration?->id,
                'integration_name' => $domain->integration?->name,
                'emails_count' => $m->emails_count,
                'unread_count' => $m->unread_count,
                'scope' => $m->scope ?? 'workspace',
                'team_id' => $m->team?->id,
                'team_name' => $m->team?->name,
                'user_id' => $m->user?->id,
                'user_name' => $m->user?->name,
                'owner_workspace_role' => $ownerRoles[$m->user_id] ?? 'member',
                'created_at' => $m->created_at,
            ];
        });

        $domains = MailboxDomain::where('workspace_id', $workspaceId)
            ->where('is_verified', true)
            ->where('is_active', true)
            ->where('stale', false)
            ->orderBy('name')
            ->get(['id', 'name']);

        $integrations = $mailboxes->pluck('integration_name', 'integration_id')
            ->filter(fn ($name, $id) => $name !== null && $id !== '')
            ->unique()
            ->map(fn ($name, $id) => ['id' => $id, 'name' => $name])
            ->values();

        $teams = $this->features()->teamsEnabled()
            ? WorkspaceTeam::where('workspace_id', $workspaceId)->orderBy('name')->get(['id', 'name'])
            : collect();

        $mailboxGroups = $mailboxModels->pluck('group')->filter()->unique()->sort()->values();

        return Inertia::render('Mailbox/Mailboxes', [
            'mailboxes' => $mailboxes,
            'mailboxGroups' => $mailboxGroups,
            'domains' => $domains,
            'integrations' => $integrations,
            'teams' => $teams,
            'isAdmin' => $isAdmin,
        ]);
    }

    public function store(Request $request): RedirectResponse|JsonResponse
    {
        $this->features()->abortIfDisabled('mailbox_enabled');
        Gate::authorize(Ability::CREATE->value, Mailbox::class);
        $workspaceId = $this->currentWorkspaceId();

        /** @var array{slug: string, group?: string|null, domain_id: int, description?: string|null, scope?: string, team_id?: string|null, user_id?: string|null} $validated */
        $validated = $request->validate([
            'slug' => 'required|string|max:100|regex:/^[a-z0-9]([a-z0-9._-]*[a-z0-9])?$/',
            'group' => 'nullable|string|max:100',
            'domain_id' => [
                'required',
                Rule::exists('mailbox_domains', 'id')
                    ->where('workspace_id', $workspaceId)
                    ->where(fn ($query) => $query->where('stale', false)),
            ],
            'description' => 'nullable|string|max:255',
            'scope' => 'sometimes|in:'.implode(',', $this->features()->allowedScopes()),
            'team_id' => ['nullable', 'string'],
            'user_id' => ['nullable', 'string', 'exists:users,id'],
        ]);
        if (array_key_exists('team_id', $validated)) {
            $validated['team_id'] = $this->resolveWorkspaceTeamId($validated['team_id'], $workspaceId);
        }

        $scope = $validated['scope'] ?? ($this->features()->workspaceSharingEnabled() ? 'workspace' : 'owner');
        $teamId = $scope === 'team' ? ($validated['team_id'] ?? null) : null;

        $domain = MailboxDomain::where('id', $validated['domain_id'])
            ->where('workspace_id', $workspaceId)
            ->where('stale', false)
            ->firstOrFail();

        $slug = strtolower($validated['slug']);

        $exists = Mailbox::where('address', Mailbox::normalizeAddress($slug, $domain->name))
            ->exists();

        if ($exists) {
            throw ValidationException::withMessages(['slug' => 'This mailbox address is already reserved.']);
        }

        /** @var User $user */
        $user = $request->user();
        $ownerId = $this->resolveOwnerId($validated, $workspaceId, $user->id);
        $this->assignments->validate($workspaceId, $ownerId, $scope, $teamId, null, null);

        $mailbox = Mailbox::create([
            'workspace_id' => $workspaceId,
            'user_id' => $ownerId,
            'domain_id' => $domain->id,
            'slug' => $slug,
            'group' => $validated['group'] ?? null,
            'description' => $validated['description'] ?? null,
            'scope' => $scope,
            'team_id' => $teamId,
        ]);

        if ($request->expectsJson()) {
            return response()->json([
                'mailbox' => [
                    'id' => $mailbox->id,
                    'slug' => $mailbox->slug,
                    'domain' => [
                        'id' => $domain->id,
                        'name' => $domain->name,
                    ],
                ],
            ], 201);
        }

        return back()->with('success', 'Mailbox created.');
    }

    public function update(Request $request, Mailbox $mailbox): RedirectResponse
    {
        $this->features()->abortIfDisabled('mailbox_enabled');
        $this->features()->abortIfStale($mailbox);
        abort_unless($mailbox->workspace_id === $this->currentWorkspaceId(), 404);
        Gate::authorize(Ability::UPDATE->value, $mailbox);

        /** @var array{slug?: string, group?: string|null, description?: string|null, scope?: string, team_id?: string|null, user_id?: string|null} $validated */
        $validated = $request->validate([
            'slug' => 'sometimes|string|max:100|regex:/^[a-z0-9]([a-z0-9._-]*[a-z0-9])?$/',
            'group' => 'nullable|string|max:100',
            'description' => 'nullable|string|max:255',
            'scope' => 'sometimes|in:'.implode(',', $this->features()->allowedScopes()),
            'team_id' => ['nullable', 'string'],
            'user_id' => ['nullable', 'string', 'exists:users,id'],
        ]);
        if (array_key_exists('team_id', $validated)) {
            $validated['team_id'] = $this->resolveWorkspaceTeamId($validated['team_id'], $mailbox->workspace_id);
        }

        if (
            (isset($validated['scope']) && $validated['scope'] !== $mailbox->scope)
            || (array_key_exists('team_id', $validated) && $validated['team_id'] !== $mailbox->team_id)
        ) {
            Gate::authorize(Ability::MANAGE_SCOPE->value, $mailbox);
        }

        $targetScope = $validated['scope'] ?? $mailbox->scope;
        $targetTeamId = null;
        if ($targetScope === 'team') {
            $targetTeamId = $validated['team_id'] ?? $mailbox->team_id;
            $validated['team_id'] = $targetTeamId;
        } elseif (isset($validated['scope']) || array_key_exists('team_id', $validated)) {
            $validated['team_id'] = null;
        }

        /** @var string $fallbackUserId */
        $fallbackUserId = $mailbox->user_id;
        $ownerId = $this->resolveOwnerId($validated, $mailbox->workspace_id, $fallbackUserId);
        $this->assignments->validate(
            $mailbox->workspace_id,
            $ownerId,
            $targetScope,
            $targetTeamId,
            null,
            null,
        );
        /** @var array{slug?: string, group?: string|null, description?: string|null, scope?: string, team_id?: string|null} $validated */
        if (isset($validated['slug'])) {
            $slug = strtolower($validated['slug']);
            $exists = Mailbox::where(
                'address',
                Mailbox::normalizeAddress($slug, $mailbox->domain->name),
            )
                ->where('id', '!=', $mailbox->id)
                ->exists();

            if ($exists) {
                return back()->withErrors(['slug' => 'This mailbox address is already reserved.']);
            }

            $validated['slug'] = $slug;
        }

        $mailbox->update($validated);

        return back()->with('success', 'Mailbox updated.');
    }

    public function destroy(Request $request, Mailbox $mailbox): RedirectResponse
    {
        abort_unless($mailbox->workspace_id === $this->currentWorkspaceId(), 404);
        Gate::authorize(Ability::DELETE->value, $mailbox);

        $mailbox->delete();

        return back()->with('success', 'Mailbox deleted.');
    }

    public function destroyBatch(Request $request): RedirectResponse
    {
        $workspaceId = $this->currentWorkspaceId();
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => [
                'string',
                'distinct',
                Rule::exists('mailboxes', 'id')->where('workspace_id', $workspaceId),
            ],
        ]);

        /** @var list<string> $ids */
        $ids = $validated['ids'];
        $mailboxes = Mailbox::query()->whereIn('id', $ids)->orderBy('id')->get();

        foreach ($mailboxes as $mailbox) {
            Gate::authorize(Ability::DELETE->value, $mailbox);
        }

        DB::transaction(fn () => $mailboxes->each->delete(), 3);
        $count = $mailboxes->count();

        return back()->with('success', $count === 1 ? 'Mailbox deleted.' : "{$count} mailboxes deleted.");
    }

    public function watcherUsages(Request $request, Mailbox $mailbox): JsonResponse
    {
        $this->features()->abortIfStale($mailbox);
        abort_unless($mailbox->workspace_id === $this->currentWorkspaceId(), 404);
        Gate::authorize(Ability::UPDATE->value, $mailbox);

        $watchers = MailboxWatcher::where('mailbox_id', $mailbox->id)->with('flow')->get();

        if ($watchers->isEmpty()) {
            return response()->json(['flows' => [], 'watchers_count' => 0]);
        }

        $flows = $watchers->groupBy('flow_id')->map(function ($group): array {
            $watcher = $group->first();
            abort_unless($watcher instanceof MailboxWatcher, 500, 'Invalid mailbox watcher group.');
            $flow = $watcher->flow;
            abort_unless($flow instanceof Flow, 500, 'Mailbox watcher flow not found.');

            return [
                'flow_id' => $flow->id,
                'flow_name' => $flow->name,
                'icon_type' => $flow->icon_type,
                'icon_value' => $flow->icon_value,
                'icon_color' => $flow->icon_color,
                'icon_url' => $flow->icon_url,
                'watchers' => $group->pluck('name')->all(),
            ];
        })->values()->all();

        return response()->json([
            'flows' => $flows,
            'watchers_count' => $watchers->count(),
        ]);
    }

    // ── Helpers ──

    private function features(): FeatureFlagService
    {
        return app(FeatureFlagService::class);
    }

    private function currentWorkspaceId(): string
    {
        $currentWorkspaceId = $this->workspaceIdFromSession();

        return $currentWorkspaceId;
    }
}
