<?php

/*
 * Explicit proprietary scope: the paid shared notification-channel scopes in this file implement paid
 * Puppetflow features and are licensed under the Puppetflow Proprietary License.
 * See LICENSE_PROPRIETARY.md.
 */

namespace App\Http\Controllers\NotificationChannel;

use App\Authorization\AuthorizationContextFactory;
use App\Authorization\ResourceAssignmentValidator;
use App\Authorization\ScopeEvaluator;
use App\Authorization\Visibility\SharedResourceVisibility;
use App\Enums\Authorization\Ability;
use App\Enums\Integration\IntegrationCategoryEnum;
use App\Http\Controllers\Concerns\FindsChannelUsages;
use App\Http\Controllers\Controller;
use App\Models\Integration;
use App\Models\NotificationChannel;
use App\Models\User;
use App\Models\WorkspaceTeam;
use App\Services\FeatureFlags\FeatureFlagService;
use App\Services\Notification\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class NotificationChannelController extends Controller
{
    use FindsChannelUsages;

    public function __construct(
        private readonly NotificationService $notificationService,
        private readonly AuthorizationContextFactory $authorizationContexts,
        private readonly SharedResourceVisibility $sharedVisibility,
        private readonly ScopeEvaluator $scopeEvaluator,
        private readonly ResourceAssignmentValidator $assignments,
    ) {}

    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $workspaceId = $this->currentWorkspaceId();
        $context = $this->authorizationContexts->for($user, $workspaceId);
        $isAdmin = $this->scopeEvaluator->isAdministrator($context);

        if (! $this->features()->enabled('messenger_enabled')) {
            return Inertia::render('Channels/Channels', [
                'channels' => [],
                'groups' => [],
                'messengerIntegrations' => [],
                'teams' => [],
                'filters' => [
                    'search' => $request->input('search', ''),
                    'group' => $request->input('group'),
                    'scope' => $request->input('scope'),
                ],
                'isAdmin' => $isAdmin,
            ]);
        }

        $query = NotificationChannel::query()
            ->where('stale', false)
            ->with(['user:id,name', 'messengerIntegration:id,name,provider', 'team:id,name']);
        $this->sharedVisibility->applyView($query, $context);

        if ($search = $request->string('search')->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('provider', 'like', "%{$search}%")
                    ->orWhere('group', 'like', "%{$search}%");
            });
        }

        $groupFilter = $request->string('group')->toString();
        if ($groupFilter === '__ungrouped__') {
            $query->whereNull('group');
        } elseif ($groupFilter) {
            $query->where('group', $groupFilter);
        }

        $this->applyOwnershipScopeFilter($query, $request->string('scope')->toString(), $workspaceId, $user->id);

        $channels = $query->orderByRaw("COALESCE(\"group\", '') ASC")
            ->orderBy('name')
            ->get();

        $this->injectOwnerWorkspaceRoles($channels, $workspaceId);
        foreach ($channels as $channel) {
            /** @var NotificationChannel $channel */
            $canUse = $user->can(Ability::USE->value, $channel);

            $rawConfig = $channel->getAttribute('config');
            $rawConfig = is_array($rawConfig) ? $rawConfig : [];
            $channel->setAttribute('can_use', $canUse);
            $channel->setAttribute('config', $canUse ? [
                'chat_id' => $rawConfig['chat_id'] ?? null,
                'chat_name' => $rawConfig['chat_name'] ?? null,
            ] : null);
            $channel->makeVisible('config');
        }

        $baseQuery = NotificationChannel::query()
            ->where('stale', false);
        $this->sharedVisibility->applyView($baseQuery, $context);

        $groups = (clone $baseQuery)
            ->whereNotNull('group')
            ->distinct()
            ->pluck('group')
            ->sort()
            ->values();

        $messengerIntegrationsQuery = Integration::query()
            ->where('category', IntegrationCategoryEnum::MESSENGER)
            ->where('is_active', true)
            ->where('stale', false)
            ->orderBy('provider')
            ->orderBy('name');
        $this->sharedVisibility->applyUse($messengerIntegrationsQuery, $context);
        $messengerIntegrations = $messengerIntegrationsQuery->get(['id', 'name', 'provider']);

        $teams = $this->features()->teamsEnabled()
            ? WorkspaceTeam::where('workspace_id', $workspaceId)->orderBy('name')->get(['id', 'name'])
            : collect();

        return Inertia::render('Channels/Channels', [
            'channels' => $channels,
            'groups' => $groups,
            'messengerIntegrations' => $messengerIntegrations,
            'teams' => $teams,
            'filters' => [
                'search' => $request->input('search', ''),
                'group' => $request->input('group'),
                'scope' => $request->input('scope'),
            ],
            'isAdmin' => $isAdmin,
        ]);
    }

    public function store(Request $request): RedirectResponse|JsonResponse
    {
        $this->features()->abortIfDisabled('messenger_enabled');
        $workspaceId = $this->currentWorkspaceId();
        /** @var array{name: string, messenger_integration_id: string, config: array{chat_id: string, chat_name?: string|null}, scope?: string, team_id?: string|null, group?: string|null, user_id?: string|null} $validated */
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'messenger_integration_id' => 'required|string',
            'config' => 'required|array',
            'config.chat_id' => 'required|string',
            'config.chat_name' => 'nullable|string',
            'scope' => 'sometimes|in:'.implode(',', $this->features()->allowedScopes('user')),
            'team_id' => 'nullable|string',
            'group' => 'nullable|string|max:100',
            'user_id' => 'nullable|string|exists:users,id',
        ]);
        if (array_key_exists('team_id', $validated)) {
            $validated['team_id'] = $this->resolveWorkspaceTeamId($validated['team_id'], $workspaceId);
        }

        /** @var User $user */
        $user = $request->user();
        $scope = $validated['scope'] ?? 'user';
        $ownerId = $this->resolveOwnerId($validated, $workspaceId, $user->id);
        /** @var array{name: string, messenger_integration_id: string, config: array{chat_id: string, chat_name?: string|null}, scope?: string, team_id?: string|null, group?: string|null} $validated */
        $teamId = $scope === 'team' ? ($validated['team_id'] ?? null) : null;
        $this->assignments->validate($workspaceId, $ownerId, $scope, $teamId, null, null);

        $integration = Integration::where('workspace_id', $workspaceId)
            ->where('id', $validated['messenger_integration_id'])
            ->where('category', IntegrationCategoryEnum::MESSENGER)
            ->where('stale', false)
            ->firstOrFail();
        Gate::authorize(Ability::USE->value, $integration);
        unset($validated['messenger_integration_id']);

        $channel = NotificationChannel::create([
            'name' => $validated['name'],
            'provider' => $integration->getRawOriginal('provider'),
            'messenger_integration_id' => $integration->id,
            'config' => $validated['config'],
            'scope' => $scope,
            'team_id' => $teamId,
            'group' => $validated['group'] ?? null,
            'workspace_id' => $workspaceId,
            'user_id' => $ownerId,
        ]);

        if ($request->expectsJson()) {
            return response()->json([
                'channel' => [
                    'id' => $channel->id,
                    'name' => $channel->name,
                    'config' => [
                        'chat_id' => $channel->config['chat_id'] ?? null,
                        'chat_name' => $channel->config['chat_name'] ?? null,
                    ],
                    'messenger_integration_id' => $integration->id,
                ],
            ], 201);
        }

        return back()->with('success', 'Channel created.');
    }

    public function update(Request $request, NotificationChannel $channel): RedirectResponse
    {
        $this->features()->abortIfDisabled('messenger_enabled');
        $this->features()->abortIfStale($channel);
        /** @var User $user */
        $user = $request->user();
        $this->authorizeChannel($user, $channel);

        /** @var array{name?: string, messenger_integration_id?: string, config?: array<string, mixed>, is_active?: bool, scope?: string, team_id?: string|null, group?: string|null, user_id?: string|null} $validated */
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'messenger_integration_id' => 'sometimes|string',
            'config' => 'sometimes|array',
            'is_active' => 'sometimes|boolean',
            'scope' => 'sometimes|in:'.implode(',', $this->features()->allowedScopes('user')),
            'team_id' => 'nullable|string',
            'group' => 'nullable|string|max:100',
            'user_id' => 'nullable|string|exists:users,id',
        ]);
        if (array_key_exists('team_id', $validated)) {
            $validated['team_id'] = $this->resolveWorkspaceTeamId($validated['team_id'], $channel->workspace_id);
        }

        if (
            (isset($validated['scope']) && $validated['scope'] !== $channel->scope)
            || (array_key_exists('team_id', $validated) && $validated['team_id'] !== $channel->team_id)
        ) {
            Gate::authorize(Ability::MANAGE_SCOPE->value, $channel);
        }

        /** @var string $fallbackUserId */
        $fallbackUserId = $channel->user_id;
        $ownerId = $this->resolveOwnerId($validated, $channel->workspace_id, $fallbackUserId);
        /** @var array{name?: string, messenger_integration_id?: string, config?: array<string, mixed>, is_active?: bool, scope?: string, team_id?: string|null, group?: string|null} $validated */
        $targetScope = $validated['scope'] ?? $channel->scope;
        $targetTeamId = null;
        if ($targetScope === 'team') {
            $targetTeamId = $validated['team_id'] ?? $channel->team_id;
            $validated['team_id'] = $targetTeamId;
        } elseif (isset($validated['scope']) || array_key_exists('team_id', $validated)) {
            $validated['team_id'] = null;
        }

        if (isset($validated['messenger_integration_id'])) {
            $integration = Integration::where('workspace_id', $channel->workspace_id)
                ->where('id', $validated['messenger_integration_id'])
                ->where('category', IntegrationCategoryEnum::MESSENGER)
                ->where('stale', false)
                ->firstOrFail();
            Gate::authorize(Ability::USE->value, $integration);

            $validated['messenger_integration_id'] = $integration->id;
            $validated['provider'] = $integration->getRawOriginal('provider');
        }

        if (array_key_exists('group', $validated)) {
            $validated['group'] = $validated['group'] ?: null;
        }

        DB::transaction(function () use (
            $channel,
            $validated,
            $ownerId,
            $targetScope,
            $targetTeamId,
        ) {
            $this->assignments->validate(
                $channel->workspace_id,
                $ownerId,
                $targetScope,
                $targetTeamId,
                null,
                null,
            );
            $channel->update($validated);
        });

        return back()->with('success', 'Channel updated.');
    }

    public function usages(Request $request, NotificationChannel $channel): JsonResponse
    {
        $this->features()->abortIfStale($channel);
        /** @var User $user */
        $user = $request->user();
        $this->authorizeChannel($user, $channel);

        return response()->json(
            $this->findFlowsUsingChannels([$channel->id], $channel->workspace_id, $user),
        );
    }

    public function destroy(Request $request, NotificationChannel $channel): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $this->authorizeChannel($user, $channel);

        $channel->delete();

        return back()->with('success', 'Channel deleted.');
    }

    public function destroyBatch(Request $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $workspaceId = $this->currentWorkspaceId();
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => [
                'string',
                'distinct',
                \Illuminate\Validation\Rule::exists('notification_channels', 'id')
                    ->where('workspace_id', $workspaceId),
            ],
        ]);

        /** @var list<string> $ids */
        $ids = $validated['ids'];
        $channels = NotificationChannel::query()->whereIn('id', $ids)->orderBy('id')->get();

        foreach ($channels as $channel) {
            $this->authorizeChannel($user, $channel);
        }

        DB::transaction(fn () => $channels->each->delete(), 3);
        $count = $channels->count();

        return back()->with('success', $count === 1 ? 'Channel deleted.' : "{$count} channels deleted.");
    }

    public function test(Request $request, NotificationChannel $channel): RedirectResponse
    {
        $this->features()->abortIfDisabled('messenger_enabled');
        $this->features()->abortIfStale($channel);
        Gate::authorize(Ability::USE->value, $channel);

        /** @var User $user */
        $user = $request->user();
        $result = $this->notificationService->sendMessage(
            $channel,
            $user,
            'Test notification from Puppetflow'
        );

        if ($result['ok']) {
            return back()->with('success', 'Test message sent!');
        }

        return back()->with('error', 'Failed to send: '.($result['error'] ?? 'unknown error'));
    }

    public function suggestions(Request $request): JsonResponse
    {
        if (! $this->features()->enabled('messenger_enabled')) {
            return response()->json([]);
        }

        /** @var User $user */
        $user = $request->user();
        $workspaceId = $this->currentWorkspaceId();
        $context = $this->authorizationContexts->for($user, $workspaceId);

        $channelsQuery = NotificationChannel::query()
            ->where('is_active', true)
            ->where('stale', false);
        $this->sharedVisibility->applyUse($channelsQuery, $context);
        $channels = $channelsQuery
            ->with('team:id,name')
            ->orderBy('name')
            ->get(['id', 'name', 'provider', 'scope', 'team_id', 'config']);

        $suggestions = [];
        foreach ($channels as $ch) {
            $suggestions[] = [
                'id' => $ch->id,
                'name' => $ch->name,
                'provider' => $ch->provider,
                'scope' => $ch->scope,
                'team_name' => $ch->team?->name,
                'destination' => $ch->config['chat_name'] ?? $ch->config['chat_id'] ?? '',
            ];
        }

        return response()->json($suggestions);
    }

    public function setupStatus(Request $request): JsonResponse
    {
        if (! $this->features()->enabled('messenger_enabled')) {
            return response()->json(['has_messenger_integration' => false]);
        }

        /** @var User $user */
        $user = $request->user();
        $workspaceId = $this->currentWorkspaceId();
        $query = Integration::query()
            ->where('category', IntegrationCategoryEnum::MESSENGER)
            ->where('is_active', true)
            ->where('stale', false);
        $this->sharedVisibility->applyUse(
            $query,
            $this->authorizationContexts->for($user, $workspaceId),
        );

        return response()->json([
            'has_messenger_integration' => $query->exists(),
        ]);
    }

    private function authorizeChannel(User $user, NotificationChannel $channel): void
    {
        Gate::forUser($user)->authorize(Ability::UPDATE->value, $channel);
    }

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
