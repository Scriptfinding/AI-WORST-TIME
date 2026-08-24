<?php

/*
 * Explicit proprietary scope: the paid shared AI model scopes in this file implement paid
 * Puppetflow features and are licensed under the Puppetflow Proprietary License.
 * See LICENSE_PROPRIETARY.md.
 */

namespace App\Http\Controllers\AiModel;

use App\Authorization\AuthorizationContextFactory;
use App\Authorization\ResourceAssignmentValidator;
use App\Authorization\ScopeEvaluator;
use App\Authorization\Visibility\SharedResourceVisibility;
use App\Enums\Authorization\Ability;
use App\Enums\Integration\IntegrationCategoryEnum;
use App\Http\Controllers\Concerns\FindsAiModelUsages;
use App\Http\Controllers\Controller;
use App\Models\AiModel;
use App\Models\Integration;
use App\Models\User;
use App\Models\WorkspaceTeam;
use App\Services\FeatureFlags\FeatureFlagService;
use App\Services\Integration\Ai\AiService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AiModelController extends Controller
{
    use FindsAiModelUsages;

    public function __construct(
        private readonly AiService $ai,
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
        $filters = [
            'search' => $request->input('search', ''),
            'group' => $request->input('group'),
            'scope' => $request->input('scope'),
        ];

        if (! $this->features()->enabled('ai_enabled')) {
            return Inertia::render('AiModels/AiModels', [
                'aiModels' => [],
                'groups' => [],
                'aiIntegrations' => [],
                'teams' => [],
                'filters' => $filters,
                'isAdmin' => $isAdmin,
            ]);
        }

        $query = AiModel::query()
            ->where('stale', false)
            ->with(['user:id,name', 'aiIntegration:id,name,provider', 'team:id,name']);
        $this->sharedVisibility->applyView($query, $context);

        if ($search = $request->string('search')->toString()) {
            $query->where(function ($query) use ($search): void {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('ai_model_id', 'like', "%{$search}%")
                    ->orWhere('group', 'like', "%{$search}%");
            });
        }

        $group = $request->string('group')->toString();
        if ($group === '__ungrouped__') {
            $query->whereNull('group');
        } elseif ($group !== '') {
            $query->where('group', $group);
        }

        $this->applyOwnershipScopeFilter($query, $request->string('scope')->toString(), $workspaceId, $user->id);

        $aiModels = $query->orderByRaw("COALESCE(\"group\", '') ASC")
            ->orderBy('name')
            ->get();
        $this->injectOwnerWorkspaceRoles($aiModels, $workspaceId);

        $groupsQuery = AiModel::query()->where('stale', false);
        $this->sharedVisibility->applyView($groupsQuery, $context);
        $groups = $groupsQuery->whereNotNull('group')
            ->distinct()
            ->pluck('group')
            ->sort()
            ->values();

        $integrationsQuery = Integration::query()
            ->where('category', IntegrationCategoryEnum::AI)
            ->where('is_active', true)
            ->where('stale', false)
            ->orderBy('name');
        $this->sharedVisibility->applyUse($integrationsQuery, $context);
        $integrations = $integrationsQuery->get(['id', 'name', 'provider']);

        $teams = $this->features()->teamsEnabled()
            ? WorkspaceTeam::where('workspace_id', $workspaceId)->orderBy('name')->get(['id', 'name'])
            : collect();

        return Inertia::render('AiModels/AiModels', [
            'aiModels' => $aiModels,
            'groups' => $groups,
            'aiIntegrations' => $integrations,
            'teams' => $teams,
            'filters' => $filters,
            'isAdmin' => $isAdmin,
        ]);
    }

    public function store(Request $request): RedirectResponse|JsonResponse
    {
        $this->features()->abortIfDisabled('ai_enabled');
        Gate::authorize(Ability::CREATE->value, AiModel::class);
        $workspaceId = $this->currentWorkspaceId();

        /** @var array{name: string, ai_integration_id: string, ai_model_id: string, scope?: string, team_id?: string|null, group?: string|null, user_id?: string|null, is_active?: bool} $validated */
        $validated = $request->validate($this->rules());
        if (array_key_exists('team_id', $validated)) {
            $validated['team_id'] = $this->resolveWorkspaceTeamId($validated['team_id'], $workspaceId);
        }
        /** @var User $user */
        $user = $request->user();
        $name = $this->requiredString($validated['name']);
        $aiIntegrationId = $this->requiredString($validated['ai_integration_id']);
        $scope = array_key_exists('scope', $validated)
            ? $this->requiredString($validated['scope'])
            : 'user';
        $ownerId = $this->resolveOwnerId($validated, $workspaceId, $user->id);
        $teamId = $scope === 'team' && is_string($validated['team_id'] ?? null)
            ? $validated['team_id']
            : null;
        $this->assignments->validate($workspaceId, $ownerId, $scope, $teamId, null, null);

        $integration = $this->usableIntegration($aiIntegrationId, $workspaceId);
        $this->validateIntegrationVisibility($integration, $scope, $ownerId, $teamId, $workspaceId);
        $model = $this->authoritativeModel(
            $integration,
            $this->requiredString($validated['ai_model_id']),
        );

        $aiModel = AiModel::create([
            'workspace_id' => $workspaceId,
            'user_id' => $ownerId,
            'team_id' => $teamId,
            'ai_integration_id' => $integration->id,
            'ai_model_id' => $model['ai_model_id'],
            'capabilities' => $model['capabilities'],
            'name' => $name,
            'scope' => $scope,
            'group' => ($validated['group'] ?? null) ?: null,
            'is_active' => true,
        ]);

        if ($request->expectsJson()) {
            return response()->json([
                'ai_model' => [
                    'id' => $aiModel->id,
                    'name' => $aiModel->name,
                    'ai_integration_id' => $integration->id,
                    'ai_model_id' => $aiModel->ai_model_id,
                    'capabilities' => $aiModel->capabilities,
                ],
            ], 201);
        }

        return back()->with('success', 'AI model created.');
    }

    public function update(Request $request, AiModel $aiModel): RedirectResponse
    {
        $this->features()->abortIfDisabled('ai_enabled');
        $this->ensureWorkspace($aiModel);
        $this->features()->abortIfStale($aiModel);
        /** @var User $user */
        $user = $request->user();
        Gate::forUser($user)->authorize(Ability::UPDATE->value, $aiModel);

        /** @var array{name?: string, ai_integration_id?: string, ai_model_id?: string, scope?: string, team_id?: string|null, group?: string|null, user_id?: string|null, is_active?: bool} $validated */
        $validated = $request->validate($this->rules(true));
        $scopeWasProvided = array_key_exists('scope', $validated);
        $teamWasProvided = array_key_exists('team_id', $validated);
        $ownerWasProvided = array_key_exists('user_id', $validated);
        if (array_key_exists('team_id', $validated)) {
            $validated['team_id'] = $this->resolveWorkspaceTeamId($validated['team_id'], $aiModel->workspace_id);
        }

        $requestedScope = array_key_exists('scope', $validated)
            ? $this->requiredString($validated['scope'])
            : null;
        $requestedTeamId = array_key_exists('team_id', $validated)
            ? $validated['team_id']
            : null;
        if (array_key_exists('team_id', $validated)) {
            $validated['team_id'] = $requestedTeamId;
        }

        if (
            ($requestedScope !== null && $requestedScope !== $aiModel->scope)
            || (array_key_exists('team_id', $validated) && $requestedTeamId !== $aiModel->team_id)
        ) {
            Gate::authorize(Ability::MANAGE_SCOPE->value, $aiModel);
        }
        $ownerId = $this->resolveOwnerId($validated, $aiModel->workspace_id, $aiModel->user_id);
        $scope = $requestedScope ?? $aiModel->scope;
        $teamId = $scope === 'team'
            ? (array_key_exists('team_id', $validated) ? $requestedTeamId : $aiModel->team_id)
            : null;
        $validated['team_id'] = $teamId;
        $this->assignments->validate($aiModel->workspace_id, $ownerId, $scope, $teamId, null, null);

        $modelSelectionChanges = array_key_exists('ai_integration_id', $validated)
            || array_key_exists('ai_model_id', $validated);
        $visibilityChanges = $modelSelectionChanges
            || $scopeWasProvided
            || $teamWasProvided
            || $ownerWasProvided;
        $integration = null;
        if ($visibilityChanges) {
            $aiIntegrationKey = array_key_exists('ai_integration_id', $validated)
                ? $this->requiredString($validated['ai_integration_id'])
                : $aiModel->ai_integration_id;
            $integration = $modelSelectionChanges
                ? $this->usableIntegration($aiIntegrationKey, $aiModel->workspace_id)
                : $this->aiIntegration($aiIntegrationKey, $aiModel->workspace_id);
            $this->validateIntegrationVisibility(
                $integration,
                $scope,
                $ownerId,
                $teamId,
                $aiModel->workspace_id,
            );
        }
        if ($modelSelectionChanges) {
            abort_unless($integration instanceof Integration, 500, 'AI integration resolution failed.');
            $model = $this->authoritativeModel(
                $integration,
                array_key_exists('ai_model_id', $validated)
                    ? $this->requiredString($validated['ai_model_id'])
                    : $aiModel->ai_model_id,
            );
            $validated['ai_integration_id'] = $integration->id;
            $validated['ai_model_id'] = $model['ai_model_id'];
            $validated['capabilities'] = $model['capabilities'];
        }

        if (array_key_exists('group', $validated)) {
            $validated['group'] = $validated['group'] ?: null;
        }

        $aiModel->update($validated);

        return back()->with('success', 'AI model updated.');
    }

    public function destroy(Request $request, AiModel $aiModel): RedirectResponse
    {
        $this->ensureWorkspace($aiModel);
        /** @var User $user */
        $user = $request->user();
        Gate::forUser($user)->authorize(Ability::DELETE->value, $aiModel);
        $aiModel->delete();

        return back()->with('success', 'AI model deleted.');
    }

    public function destroyBatch(Request $request): RedirectResponse
    {
        $workspaceId = $this->currentWorkspaceId();
        /** @var array{ids: list<string>} $validated */
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => [
                'string',
                'distinct',
                Rule::exists('ai_models', 'id')->where('workspace_id', $workspaceId),
            ],
        ]);
        /** @var User $user */
        $user = $request->user();
        $models = AiModel::query()->whereIn('id', $validated['ids'])->orderBy('id')->get();
        foreach ($models as $model) {
            Gate::forUser($user)->authorize(Ability::DELETE->value, $model);
        }

        DB::transaction(fn () => $models->each->delete(), 3);
        $count = $models->count();

        return back()->with('success', $count === 1 ? 'AI model deleted.' : "{$count} AI models deleted.");
    }

    public function usages(Request $request, AiModel $aiModel): JsonResponse
    {
        $this->features()->abortIfDisabled('ai_enabled');
        $this->ensureWorkspace($aiModel);
        $this->features()->abortIfStale($aiModel);
        /** @var User $user */
        $user = $request->user();
        Gate::forUser($user)->authorize(Ability::UPDATE->value, $aiModel);

        return response()->json(
            $this->findFlowsUsingAiModel(
                $aiModel->id,
                $aiModel->workspace_id,
                $user,
            ),
        );
    }

    public function suggestions(Request $request): JsonResponse
    {
        if (! $this->features()->enabled('ai_enabled')) {
            return response()->json([]);
        }

        /** @var User $user */
        $user = $request->user();
        $workspaceId = $this->currentWorkspaceId();
        $context = $this->authorizationContexts->for($user, $workspaceId);
        $integrationQuery = Integration::query()
            ->where('workspace_id', $workspaceId)
            ->where('category', IntegrationCategoryEnum::AI)
            ->where('is_active', true)
            ->where('stale', false);
        $this->sharedVisibility->applyUse($integrationQuery, $context);

        $query = AiModel::query()
            ->where('workspace_id', $workspaceId)
            ->whereIn('ai_integration_id', $integrationQuery->select('id'))
            ->where('is_active', true)
            ->where('stale', false)
            ->whereHas('aiIntegration', fn ($query) => $query
                ->where('category', IntegrationCategoryEnum::AI)
                ->where('is_active', true)
                ->where('stale', false))
            ->with(['aiIntegration:id,name,provider', 'team:id,name']);
        $this->sharedVisibility->applyUse(
            $query,
            $context,
        );

        return response()->json(
            $query
                ->orderByRaw('CASE WHEN user_id = ? THEN 0 ELSE 1 END', [$user->id])
                ->orderBy('name')
                ->get()
                ->map(
                    function (AiModel $model): array {
                        $integration = $model->aiIntegration;
                        abort_unless($integration instanceof Integration, 500, 'AI integration relation is missing.');

                        return [
                            'id' => $model->id,
                            'name' => $model->name,
                            'ai_integration_id' => $model->ai_integration_id,
                            'ai_model_id' => $model->ai_model_id,
                            'capabilities' => $model->capabilities,
                            'scope' => $model->scope,
                            'team_name' => $model->team?->name,
                            'ai_integration' => $integration,
                        ];
                    },
                ),
        );
    }

    public function setupStatus(Request $request): JsonResponse
    {
        if (! $this->features()->enabled('ai_enabled')) {
            return response()->json([
                'has_ai_integration' => false,
                'has_ai_model' => false,
            ]);
        }

        /** @var User $user */
        $user = $request->user();
        $workspaceId = $this->currentWorkspaceId();
        $context = $this->authorizationContexts->for($user, $workspaceId);

        $integrationsQuery = Integration::query()
            ->where('category', IntegrationCategoryEnum::AI)
            ->where('is_active', true)
            ->where('stale', false);
        $this->sharedVisibility->applyUse($integrationsQuery, $context);

        $modelsQuery = AiModel::query()
            ->where('is_active', true)
            ->where('stale', false)
            ->whereIn('ai_integration_id', (clone $integrationsQuery)->select('id'))
            ->whereHas('aiIntegration', fn ($query) => $query
                ->where('category', IntegrationCategoryEnum::AI)
                ->where('is_active', true)
                ->where('stale', false));
        $this->sharedVisibility->applyUse($modelsQuery, $context);

        return response()->json([
            'has_ai_integration' => $integrationsQuery->exists(),
            'has_ai_model' => $modelsQuery->exists(),
        ]);
    }

    public function discover(Request $request): JsonResponse
    {
        $this->features()->abortIfDisabled('ai_enabled');
        $workspaceId = $this->currentWorkspaceId();
        /** @var array{ai_integration_id: string, q?: string|null, refresh?: bool|null} $validated */
        $validated = $request->validate([
            'ai_integration_id' => ['required', 'string'],
            'q' => ['nullable', 'string', 'max:255'],
            'refresh' => ['nullable', 'boolean'],
        ]);
        $integration = $this->usableIntegration($validated['ai_integration_id'], $workspaceId);
        $config = $integration->config ?? [];
        $apiKey = $config['api_key'] ?? null;
        if (! is_string($apiKey) || trim($apiKey) === '') {
            throw ValidationException::withMessages(['ai_integration_id' => 'The AI integration has no API key.']);
        }

        $models = $this->ai->listModels(
            $integration->aiProvider(),
            $apiKey,
            (bool) ($validated['refresh'] ?? false),
        );
        $query = mb_strtolower(trim($validated['q'] ?? ''));
        if ($query !== '') {
            $models = array_values(array_filter($models, function (array $model) use ($query): bool {
                $id = is_string($model['id'] ?? null) ? $model['id'] : '';
                $label = is_string($model['label'] ?? null) ? $model['label'] : '';

                return str_contains(mb_strtolower($id), $query)
                    || str_contains(mb_strtolower($label), $query);
            }));
        }

        return response()->json([
            'ai_integration' => [
                'id' => $integration->id,
                'name' => $integration->name,
                'provider' => $integration->getRawOriginal('provider'),
            ],
            'models' => $models,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function rules(bool $update = false): array
    {
        $presence = $update ? 'sometimes' : 'required';

        return [
            'name' => [$presence, 'string', 'max:255'],
            'ai_integration_id' => [$presence, 'string'],
            'ai_model_id' => [$presence, 'string', 'max:255'],
            'scope' => ['sometimes', 'in:'.implode(',', $this->features()->allowedScopes('user'))],
            'team_id' => ['nullable', 'string'],
            'group' => ['nullable', 'string', 'max:100'],
            'user_id' => ['nullable', 'string', 'exists:users,id'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    private function usableIntegration(string $integrationId, string $workspaceId): Integration
    {
        $integration = $this->aiIntegrationQuery($integrationId, $workspaceId)
            ->where('is_active', true)
            ->where('stale', false)
            ->firstOrFail();
        Gate::authorize(Ability::USE->value, $integration);

        return $integration;
    }

    private function aiIntegration(string $integrationId, string $workspaceId): Integration
    {
        return $this->aiIntegrationQuery($integrationId, $workspaceId)->firstOrFail();
    }

    /** @return Builder<Integration> */
    private function aiIntegrationQuery(string $integrationId, string $workspaceId): Builder
    {
        return Integration::query()
            ->whereKey($integrationId)
            ->where('workspace_id', $workspaceId)
            ->where('category', IntegrationCategoryEnum::AI);
    }

    private function validateIntegrationVisibility(
        Integration $integration,
        string $scope,
        string $ownerId,
        ?string $teamId,
        string $workspaceId,
    ): void {
        $isVisible = match ($scope) {
            'workspace' => $integration->scope === 'workspace',
            'team' => $integration->scope === 'workspace'
                || ($integration->scope === 'team' && $integration->team_id === $teamId),
            default => $this->integrationIsVisibleToOwner($integration->id, $ownerId, $workspaceId),
        };

        if (! $isVisible) {
            throw ValidationException::withMessages([
                'scope' => 'The AI model cannot be shared more broadly than its AI integration.',
            ]);
        }
    }

    private function integrationIsVisibleToOwner(string $integrationId, string $ownerId, string $workspaceId): bool
    {
        $owner = User::query()->find($ownerId);
        if (! $owner instanceof User) {
            return false;
        }

        $query = Integration::query()->whereKey($integrationId);
        $this->sharedVisibility->applyUse(
            $query,
            $this->authorizationContexts->for($owner, $workspaceId),
        );

        return $query->exists();
    }

    /** @return array{ai_model_id: string, capabilities: array<string, bool>} */
    private function authoritativeModel(Integration $integration, string $aiModelId): array
    {
        $config = $integration->config ?? [];
        $apiKey = $config['api_key'] ?? null;
        if (! is_string($apiKey) || trim($apiKey) === '') {
            throw ValidationException::withMessages(['ai_integration_id' => 'The AI integration has no API key.']);
        }

        $discoveredModels = collect($this->ai->listModels($integration->aiProvider(), $apiKey))
            ->filter(fn (array $model): bool => is_string($model['id'] ?? null))
            ->keyBy(fn (array $model): string => $model['id']);

        $match = $discoveredModels->get($aiModelId);
        if (! is_array($match)) {
            throw ValidationException::withMessages([
                'ai_model_id' => 'The selected model is not available from the provider.',
            ]);
        }

        $capabilities = [];
        foreach (is_array($match['capabilities'] ?? null) ? $match['capabilities'] : [] as $key => $value) {
            if (is_string($key) && is_bool($value)) {
                $capabilities[$key] = $value;
            }
        }
        if (($capabilities['text'] ?? false) !== true && ($capabilities['vision'] ?? false) !== true) {
            throw ValidationException::withMessages([
                'ai_model_id' => 'The selected model does not support text or vision requests.',
            ]);
        }

        return [
            'ai_model_id' => $aiModelId,
            'capabilities' => $capabilities,
        ];
    }

    private function requiredString(mixed $value): string
    {
        abort_unless(is_string($value), 422);

        return $value;
    }

    private function ensureWorkspace(AiModel $aiModel): void
    {
        abort_unless($aiModel->workspace_id === $this->currentWorkspaceId(), 404);
    }

    private function features(): FeatureFlagService
    {
        return app(FeatureFlagService::class);
    }

    private function currentWorkspaceId(): string
    {
        return $this->workspaceIdFromSession();
    }
}
