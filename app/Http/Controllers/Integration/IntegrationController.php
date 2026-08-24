<?php

/*
 * Explicit proprietary scope: the paid shared integration scopes and repository/vault branches in this file implement paid
 * Puppetflow features and are licensed under the Puppetflow Proprietary License.
 * See LICENSE_PROPRIETARY.md.
 */

namespace App\Http\Controllers\Integration;

use App\Authorization\AuthorizationContextFactory;
use App\Authorization\ResourceAssignmentValidator;
use App\Authorization\ScopeEvaluator;
use App\Authorization\Visibility\SharedResourceVisibility;
use App\Contracts\Integration\InitializesIntegrationConfig;
use App\Enums\Authorization\Ability;
use App\Enums\Integration\IntegrationAiProviderEnum;
use App\Enums\Integration\IntegrationCategoryEnum;
use App\Events\Integration\IntegrationDeleting;
use App\Http\Controllers\Controller;
use App\Models\AiModel;
use App\Models\Integration;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceTeam;
use App\Services\FeatureFlags\FeatureFlagService;
use App\Services\Integration\Ai\AiService;
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

class IntegrationController extends Controller
{
    public function __construct(
        private readonly AuthorizationContextFactory $authorizationContexts,
        private readonly SharedResourceVisibility $sharedVisibility,
        private readonly ScopeEvaluator $scopeEvaluator,
        private readonly ResourceAssignmentValidator $assignments,
    ) {}

    // ── Page ──

    public function index(Request $request): Response
    {
        $currentWorkspaceId = $this->workspaceIdFromSession();
        $workspaceId = $currentWorkspaceId;
        /** @var User $user */
        $user = $request->user();
        $context = $this->authorizationContexts->for($user, $workspaceId);
        $isAdmin = $this->scopeEvaluator->isAdministrator($context);
        app(ManagedMailboxIntegrationService::class)->syncForWorkspace(
            Workspace::find($workspaceId),
            $user,
        );

        $integrationQuery = Integration::query()
            ->where('stale', false)
            ->whereIn('category', $this->enabledCategories())
            ->with('user:id,name', 'team:id,name')
            ->orderBy('category')
            ->orderBy('provider')
            ->orderBy('name');
        $this->sharedVisibility->applyView($integrationQuery, $context);

        if (! $this->features()->enabled('mailbox_enabled')) {
            $integrationQuery->where('provider', '!=', 'mailbox');
        }

        $integrations = $integrationQuery->get()->each->makeHidden('config');

        $this->injectOwnerWorkspaceRoles($integrations, $workspaceId);

        $teams = $this->features()->teamsEnabled()
            ? WorkspaceTeam::where('workspace_id', $workspaceId)->orderBy('name')->get(['id', 'name'])
            : collect();

        return Inertia::render('Integrations/Integrations', [
            'integrations' => $integrations,
            'isWorkspaceAdmin' => $isAdmin,
            'teams' => $teams,
        ]);
    }

    // ── CRUD ──

    public function store(Request $request): JsonResponse|RedirectResponse
    {
        Gate::authorize(Ability::CREATE->value, Integration::class);
        $currentWorkspaceId = $this->workspaceIdFromSession();
        $workspaceId = $currentWorkspaceId;

        /** @var array{name: string, category: string, provider: string, config?: array<string, mixed>|null, scope?: string, team_id?: string|null} $validated */
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => ['required', Rule::enum(IntegrationCategoryEnum::class)],
            'provider' => 'required|string',
            'config' => 'nullable|array',
            'scope' => 'sometimes|in:'.implode(',', $this->features()->allowedScopes()),
            'team_id' => ['nullable', 'string'],
        ]);
        if (array_key_exists('team_id', $validated)) {
            $validated['team_id'] = $this->resolveWorkspaceTeamId($validated['team_id'], $workspaceId);
        }

        $validated['config'] = $validated['config'] ?? [];

        $category = IntegrationCategoryEnum::from($validated['category']);
        $this->features()->abortIfDisabled($this->features()->flagForIntegrationCategory($category));

        $request->validate([
            'provider' => Rule::in($category->providerValues()),
        ]);

        $provider = $category->resolveProvider($validated['provider']);
        if ($provider instanceof IntegrationAiProviderEnum) {
            $validated['config'] = app(AiService::class)->validateConfig($provider, $validated['config']);
        }
        if ($validated['provider'] === 'mailbox') {
            $this->features()->abortIfDisabled('mailbox_enabled');
        }

        $scope = $validated['scope'] ?? 'owner';
        $teamId = $scope === 'team' ? ($validated['team_id'] ?? null) : null;
        /** @var User $user */
        $user = $request->user();
        $ownerId = $user->id;
        $this->assignments->validate($workspaceId, $ownerId, $scope, $teamId, null, null);

        $integration = Integration::create([
            'workspace_id' => $workspaceId,
            'user_id' => $ownerId,
            'category' => $provider->category(),
            'provider' => $provider,
            'name' => $validated['name'],
            'config' => $validated['config'],
            'scope' => $scope,
            'team_id' => $teamId,
        ]);

        if ($provider instanceof InitializesIntegrationConfig) {
            $integration->update([
                'config' => $provider->initializeConfig($integration->config ?? [], $integration),
            ]);
        }

        if ($request->wantsJson()) {
            return response()->json(['integration' => $integration->makeHidden('config')], 201);
        }

        return back()->with('success', 'Integration created.');
    }

    public function update(Request $request, Integration $integration): JsonResponse|RedirectResponse
    {
        $currentWorkspaceId = $this->workspaceIdFromSession();
        abort_unless($integration->workspace_id === $currentWorkspaceId, 404);
        $this->features()->abortIfIntegrationUnavailable($integration);
        if ($integration->getRawOriginal('provider') === 'mailbox') {
            $this->features()->abortIfDisabled('mailbox_enabled');
        }
        Gate::authorize(Ability::UPDATE->value, $integration);
        $this->abortIfReadonly($integration);

        /** @var array{name?: string, config?: array<string, mixed>, is_active?: bool, scope?: string, team_id?: string|null, user_id?: string|null} $validated */
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'config' => 'sometimes|array',
            'is_active' => 'sometimes|boolean',
            'scope' => 'sometimes|in:'.implode(',', $this->features()->allowedScopes()),
            'team_id' => ['nullable', 'string'],
            'user_id' => ['nullable', 'string', 'exists:users,id'],
        ]);
        if (array_key_exists('team_id', $validated)) {
            $validated['team_id'] = $this->resolveWorkspaceTeamId($validated['team_id'], $integration->workspace_id);
        }

        if (
            (isset($validated['scope']) && $validated['scope'] !== $integration->scope)
            || (array_key_exists('team_id', $validated) && $validated['team_id'] !== $integration->team_id)
        ) {
            Gate::authorize(Ability::MANAGE_SCOPE->value, $integration);
        }

        $targetScope = $validated['scope'] ?? $integration->scope;
        $targetTeamId = null;
        if ($targetScope === 'team') {
            $targetTeamId = $validated['team_id'] ?? $integration->team_id;
            $validated['team_id'] = $targetTeamId;
        } elseif (isset($validated['scope']) || array_key_exists('team_id', $validated)) {
            $validated['team_id'] = null;
        }

        if (isset($validated['config']) && $integration->provider instanceof IntegrationAiProviderEnum) {
            $validated['config'] = app(AiService::class)->validateConfig(
                $integration->provider,
                $validated['config'],
                $integration,
            );
        } elseif (isset($validated['config'])) {
            $validated['config'] = array_merge($integration->config ?? [], $validated['config']);
        }

        $ownerId = $this->resolveOwnerId($validated, $integration->workspace_id, $integration->user_id);
        $this->validateAiModelVisibility($integration, $targetScope, $ownerId, $targetTeamId);
        $this->assignments->validate(
            $integration->workspace_id,
            $ownerId,
            $targetScope,
            $targetTeamId,
            null,
            null,
        );

        $integration->update($validated);

        if ($request->wantsJson()) {
            return response()->json(['integration' => $integration->fresh()?->makeHidden('config')]);
        }

        return back()->with('success', 'Integration updated.');
    }

    public function destroy(Request $request, Integration $integration): RedirectResponse
    {
        $currentWorkspaceId = $this->workspaceIdFromSession();
        abort_unless($integration->workspace_id === $currentWorkspaceId, 404);
        Gate::authorize(Ability::DELETE->value, $integration);
        $this->abortIfReadonly($integration);

        DB::transaction(function () use ($integration): void {
            IntegrationDeleting::dispatch($integration);
            $integration->delete();
        });

        return back()->with('success', 'Integration deleted.');
    }

    // ── Helpers ──

    private function validateAiModelVisibility(
        Integration $integration,
        string $scope,
        string $ownerId,
        ?string $teamId,
    ): void {
        if ($integration->category !== IntegrationCategoryEnum::AI || $scope === 'workspace') {
            return;
        }

        $invalidModels = AiModel::query()->where('ai_integration_id', $integration->id);
        if ($scope === 'team') {
            $invalidModels->where(function ($query) use ($integration, $teamId): void {
                $query
                    ->where('scope', 'workspace')
                    ->orWhere(fn ($teamQuery) => $teamQuery
                        ->where('scope', 'team')
                        ->where('team_id', '!=', $teamId))
                    ->orWhere(fn ($userQuery) => $userQuery
                        ->where('scope', 'user')
                        ->where(function ($ownerQuery) use ($integration, $teamId): void {
                            $ownerQuery
                                ->whereDoesntHave('user')
                                ->orWhereHas('user', fn ($userQuery) => $userQuery
                                    ->where('role', '!=', 'admin')
                                    ->whereDoesntHave('teams', fn ($teamQuery) => $teamQuery
                                        ->where('workspace_teams.id', $teamId))
                                    ->whereDoesntHave('workspaces', fn ($workspaceQuery) => $workspaceQuery
                                        ->where('workspaces.id', $integration->workspace_id)
                                        ->whereIn('user_workspace.role', ['admin', 'manager'])));
                        }));
            });
        } else {
            $invalidModels->where(function ($query) use ($ownerId): void {
                $query
                    ->where('scope', '!=', 'user')
                    ->orWhere('user_id', '!=', $ownerId);
            });
        }

        if ($invalidModels->exists()) {
            throw ValidationException::withMessages([
                'scope' => 'Update or delete AI models that are shared more broadly before restricting this AI integration.',
            ]);
        }
    }

    private function abortIfReadonly(Integration $integration): void
    {
        abort_if($integration->is_readonly, 403, 'This integration is managed by the instance and is read-only.');
    }

    private function features(): FeatureFlagService
    {
        return app(FeatureFlagService::class);
    }

    /** @return list<string> */
    private function enabledCategories(): array
    {
        return array_values(collect(IntegrationCategoryEnum::cases())
            ->filter(fn (IntegrationCategoryEnum $category) => $this->features()->enabled($this->features()->flagForIntegrationCategory($category)))
            ->map(fn (IntegrationCategoryEnum $category) => $category->value)
            ->values()
            ->all());
    }
}
