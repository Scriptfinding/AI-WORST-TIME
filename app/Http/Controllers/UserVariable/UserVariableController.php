<?php

/*
 * Explicit proprietary scope: the vault-backed variables and paid shared variable scopes in this file implement paid
 * Puppetflow features and are licensed under the Puppetflow Proprietary License.
 * See LICENSE_PROPRIETARY.md.
 */

namespace App\Http\Controllers\UserVariable;

use App\Authorization\AuthorizationContextFactory;
use App\Authorization\ResourceAssignmentValidator;
use App\Authorization\ScopeEvaluator;
use App\Authorization\Visibility\SharedResourceVisibility;
use App\DTO\UserVariable\ImportVariablesData;
use App\DTO\UserVariable\VaultReferenceInput;
use App\Enums\Authorization\Ability;
use App\Enums\Integration\IntegrationCategoryEnum;
use App\Http\Controllers\Controller;
use App\Models\Flow;
use App\Models\FlowTrigger;
use App\Models\FlowUserInput;
use App\Models\Integration;
use App\Models\User;
use App\Models\UserVariable;
use App\Models\WorkspaceTeam;
use App\Services\FeatureFlags\FeatureFlagService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class UserVariableController extends Controller
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
        $userId = $user->id;
        $context = $this->authorizationContexts->for($user, $workspaceId);
        $isAdmin = $this->scopeEvaluator->isAdministrator($context);

        $query = UserVariable::query()
            ->where('stale', false)
            ->with(['user:id,name', 'vaultIntegration:id,name,provider', 'team:id,name']);

        if (! $this->features()->enabled('variables_enabled')) {
            $query->whereRaw('1 = 0');
        }

        $this->sharedVisibility->applyView($query, $context);

        if ($search = $request->string('search')->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('key', 'like', "%{$search}%")
                    ->orWhere('group', 'like', "%{$search}%");
            });
        }

        $groupFilter = $request->string('group')->toString();
        if ($groupFilter === '__ungrouped__') {
            $query->whereNull('group');
        } elseif ($groupFilter) {
            $query->where('group', $groupFilter);
        }

        $this->applyOwnershipScopeFilter($query, $request->string('scope')->toString(), $workspaceId, $userId);

        $variables = $query->orderByRaw("COALESCE(\"group\", '') ASC")
            ->orderBy('key')
            ->orderBy('id')
            ->paginate(25)
            ->withQueryString();

        $this->injectOwnerWorkspaceRoles($variables->items(), $workspaceId);
        foreach ($variables->items() as $variable) {
            $variable->setAttribute('can_manage', $user->can(Ability::UPDATE->value, $variable));
            $variable->setAttribute('can_use', $user->can(Ability::USE->value, $variable));

            if (in_array($variable->type, ['secret', 'vault', 'otp'], true)) {
                $variable->setAttribute('value', '');
            }
        }

        $editingVariable = null;
        $editingVariableId = $request->string('edit')->toString();
        if ($editingVariableId && $this->features()->enabled('variables_enabled')) {
            $editingVariableQuery = UserVariable::query()
                ->where('stale', false)
                ->whereKey($editingVariableId)
                ->with(['user:id,name', 'vaultIntegration:id,name,provider', 'team:id,name']);
            $this->sharedVisibility->applyView($editingVariableQuery, $context);
            $candidate = $editingVariableQuery->first();
            if ($candidate && $user->can(Ability::UPDATE->value, $candidate)) {
                $this->injectOwnerWorkspaceRoles([$candidate], $workspaceId);
                $candidate->setAttribute('can_manage', true);
                $candidate->setAttribute('can_use', $user->can(Ability::USE->value, $candidate));
                if (in_array($candidate->type, ['secret', 'vault', 'otp'], true)) {
                    $candidate->setAttribute('value', '');
                }
                $editingVariable = $candidate;
            }
        }

        $baseQuery = UserVariable::query()
            ->where('stale', false);
        if (! $this->features()->enabled('variables_enabled')) {
            $baseQuery->whereRaw('1 = 0');
        }
        $this->sharedVisibility->applyView($baseQuery, $context);

        $groups = (clone $baseQuery)
            ->whereNotNull('group')
            ->distinct()
            ->pluck('group')
            ->sort()
            ->values();

        $vaultIntegrationsQuery = Integration::query()
            ->where('category', IntegrationCategoryEnum::VAULT)
            ->where('is_active', true)
            ->where('stale', false);
        $this->sharedVisibility->applyUse($vaultIntegrationsQuery, $context);
        $vaultIntegrations = $this->features()->enabled('vaults_enabled')
            ? $vaultIntegrationsQuery->get(['id', 'provider', 'name'])
            : collect();

        $teams = $this->features()->teamsEnabled()
            ? WorkspaceTeam::where('workspace_id', $workspaceId)->orderBy('name')->get(['id', 'name'])
            : collect();

        return Inertia::render('Variables/Variables', [
            'variables' => $variables,
            'editingVariable' => $editingVariable,
            'groups' => $groups,
            'teams' => $teams,
            'filters' => [
                'search' => $request->input('search', ''),
                'group' => $request->input('group'),
                'scope' => $request->input('scope'),
            ],
            'isWorkspaceAdmin' => $isAdmin,
            'vaultIntegrations' => $vaultIntegrations,
        ]);
    }

    public function store(Request $request): RedirectResponse|JsonResponse
    {
        $this->features()->abortIfDisabled('variables_enabled');

        /** @var array{key: string, value?: string|null, type: string, group?: string|null, scope?: string, team_id?: string|null, user_id?: string|null, vault_provider?: string|null, vault_integration_id?: string|null, vault_vault_id?: string|null, vault_vault_name?: string|null, vault_item_id?: string|null, vault_item_name?: string|null, vault_field_label?: string|null, vault_field_type?: string|null} $validated */
        $validated = $request->validate([
            'key' => 'required|string|max:255',
            'value' => 'nullable|string',
            'type' => 'required|in:text,secret,object,array,json,vault,otp',
            'group' => 'nullable|string|max:100',
            'scope' => 'sometimes|in:'.implode(',', $this->features()->allowedScopes('user')),
            'team_id' => 'nullable|string',
            'vault_provider' => 'required_if:type,vault|nullable|string',
            'vault_integration_id' => 'required_if:type,vault|nullable|string',
            'vault_vault_id' => 'required_if:type,vault|nullable|string',
            'vault_vault_name' => 'nullable|string|max:255',
            'vault_item_id' => 'required_if:type,vault|nullable|string',
            'vault_item_name' => 'nullable|string|max:255',
            'vault_field_label' => 'required_if:type,vault|nullable|string',
            'vault_field_type' => 'nullable|string',
            'user_id' => 'nullable|string|exists:users,id',
        ]);

        $scope = $validated['scope'] ?? 'user';
        $workspaceId = $this->currentWorkspaceId();
        if (array_key_exists('team_id', $validated)) {
            $validated['team_id'] = $this->resolveWorkspaceTeamId($validated['team_id'], $workspaceId);
        }
        $teamId = $validated['team_id'] ?? null;
        $key = $validated['key'];

        if ($scope === 'team') {
            abort_unless($teamId !== null, 422, 'A team must be selected.');
            WorkspaceTeam::where('id', $teamId)->where('workspace_id', $workspaceId)->firstOrFail();
        }

        if (
            in_array($validated['type'], ['object', 'array', 'json'], true)
            && ! $this->isValidStructuredValue($validated['type'], $validated['value'] ?? '')
        ) {
            throw ValidationException::withMessages([
                'value' => "Value must be a valid {$validated['type']}.",
            ]);
        }

        if ($validated['type'] === 'vault') {
            $validated['vault_integration_id'] = $this->resolveVaultIntegrationId(
                $workspaceId,
                (string) ($validated['vault_integration_id'] ?? ''),
            );
            $vaultReference = VaultReferenceInput::fromValidated($validated);
            $validated['value'] = $vaultReference->toReference();
        }

        /** @var User $user */
        $user = $request->user();
        $ownerId = $this->resolveOwnerId($validated, $workspaceId, $user->id);

        if (! $this->assignments->ownerSatisfiesScope($workspaceId, $ownerId, $scope, $teamId)) {
            throw ValidationException::withMessages(['user_id' => $this->ownerScopeError($scope)]);
        }

        $variable = UserVariable::create([
            'key' => $key,
            'value' => $validated['value'] ?? '',
            'type' => $validated['type'],
            'scope' => $scope,
            'team_id' => $scope === 'team' ? $teamId : null,
            'group' => $validated['group'] ?: null,
            'vault_provider' => $validated['vault_provider'] ?? null,
            'vault_integration_id' => $validated['vault_integration_id'] ?? null,
            'vault_vault_id' => $validated['vault_vault_id'] ?? null,
            'vault_vault_name' => $validated['vault_vault_name'] ?? null,
            'vault_item_id' => $validated['vault_item_id'] ?? null,
            'vault_item_name' => $validated['vault_item_name'] ?? null,
            'vault_field_label' => $validated['vault_field_label'] ?? null,
            'vault_field_type' => $validated['vault_field_type'] ?? null,
            'user_id' => $ownerId,
            'workspace_id' => $workspaceId,
        ]);

        if ($request->expectsJson()) {
            return response()->json([
                'variable' => [
                    'id' => $variable->id,
                    'key' => $variable->key,
                    'type' => $variable->type,
                    'scope' => $variable->scope,
                ],
            ], 201);
        }

        return back()->with('success', 'Variable created.');
    }

    public function import(Request $request): JsonResponse
    {
        $this->features()->abortIfDisabled('variables_enabled');

        /** @var array{variables: array<int, array{key: string, value?: string|null, type: string}>, group?: string|null, scope?: string, team_id?: string|null, user_id?: string|null} $validated */
        $validated = $request->validate([
            'variables' => 'required|array|min:1|max:500',
            'variables.*.key' => 'required|string|max:255|distinct',
            'variables.*.value' => 'nullable|string',
            'variables.*.type' => 'required|in:text,secret,object,array,json',
            'group' => 'nullable|string|max:100',
            'scope' => 'sometimes|in:'.implode(',', $this->features()->allowedScopes('user')),
            'team_id' => 'nullable|string',
            'user_id' => 'nullable|string|exists:users,id',
        ]);

        $workspaceId = $this->currentWorkspaceId();
        if (array_key_exists('team_id', $validated)) {
            $validated['team_id'] = $this->resolveWorkspaceTeamId($validated['team_id'], $workspaceId);
        }
        $import = ImportVariablesData::fromValidated($validated);
        $scope = $import->scope;
        $teamId = $scope === 'team' ? $import->teamId : null;

        if ($scope === 'team') {
            abort_unless($teamId !== null, 422, 'A team must be selected.');
            WorkspaceTeam::where('id', $teamId)->where('workspace_id', $workspaceId)->firstOrFail();
        }

        /** @var User $user */
        $user = $request->user();
        $ownerData = $import->ownerData();
        $ownerId = $this->resolveOwnerId($ownerData, $workspaceId, $user->id);
        if (! $this->assignments->ownerSatisfiesScope($workspaceId, $ownerId, $scope, $teamId)) {
            return response()->json([
                'message' => 'Some variables could not be imported.',
                'errors' => ['user_id' => $this->ownerScopeError($scope)],
            ], 422);
        }

        $errors = [];

        $variables = $import->variables;
        foreach ($variables as $index => $variable) {
            $key = $variable->key;

            if (in_array($variable->type, ['object', 'array', 'json'], true)) {
                $value = $variable->value ?? '';
                if (! $this->isValidStructuredValue($variable->type, $value)) {
                    $errors["variables.$index.value"] = "The value for {$key} must be a valid {$variable->type}.";
                }
            }
        }

        if ($errors) {
            return response()->json([
                'message' => 'Some variables could not be imported.',
                'errors' => $errors,
            ], 422);
        }

        DB::transaction(function () use ($import, $workspaceId, $ownerId, $scope, $teamId) {
            foreach ($import->variables as $variable) {
                UserVariable::create([
                    'key' => $variable->key,
                    'value' => $variable->value ?? '',
                    'type' => $variable->type,
                    'scope' => $scope,
                    'team_id' => $teamId,
                    'group' => $import->group ?: null,
                    'user_id' => $ownerId,
                    'workspace_id' => $workspaceId,
                ]);
            }
        });

        return response()->json([
            'message' => count($variables).' variable(s) imported.',
            'count' => count($variables),
        ]);
    }

    public function usages(Request $request, UserVariable $variable): JsonResponse
    {
        $this->features()->abortIfStale($variable);
        $this->authorizeVariableManagement($request, $variable);

        $usages = $this->findVariableUsages(
            $variable->id,
            $variable->user_id,
            $variable->workspace_id,
            $variable->id,
            $variable->scope,
            $this->user($request),
        );

        return response()->json($usages);
    }

    public function update(Request $request, UserVariable $variable): RedirectResponse
    {
        $this->features()->abortIfDisabled('variables_enabled');
        $this->features()->abortIfStale($variable);
        $this->authorizeVariableManagement($request, $variable);

        /** @var array{key?: string, value?: string|null, type?: string, group?: string|null, scope?: string, team_id?: string|null, user_id?: string|null, vault_provider?: string|null, vault_integration_id?: string|null, vault_vault_id?: string|null, vault_vault_name?: string|null, vault_item_id?: string|null, vault_item_name?: string|null, vault_field_label?: string|null, vault_field_type?: string|null} $validated */
        $validated = $request->validate([
            'key' => 'sometimes|string|max:255',
            'value' => 'sometimes|nullable|string',
            'type' => 'sometimes|in:text,secret,object,array,json,vault,otp',
            'group' => 'nullable|string|max:100',
            'scope' => 'sometimes|in:'.implode(',', $this->features()->allowedScopes('user')),
            'team_id' => 'nullable|string',
            'vault_provider' => 'nullable|string',
            'vault_integration_id' => 'nullable|string',
            'vault_vault_id' => 'nullable|string',
            'vault_vault_name' => 'nullable|string|max:255',
            'vault_item_id' => 'nullable|string',
            'vault_item_name' => 'nullable|string|max:255',
            'vault_field_label' => 'nullable|string',
            'vault_field_type' => 'nullable|string',
            'user_id' => 'nullable|string|exists:users,id',
        ]);
        if (array_key_exists('team_id', $validated)) {
            $validated['team_id'] = $this->resolveWorkspaceTeamId($validated['team_id'], $variable->workspace_id);
        }

        if (
            (isset($validated['scope']) && $validated['scope'] !== $variable->scope)
            || (array_key_exists('team_id', $validated) && $validated['team_id'] !== $variable->team_id)
        ) {
            Gate::authorize(Ability::MANAGE_SCOPE->value, $variable);
        }

        if (isset($validated['scope']) && $validated['scope'] === 'team') {
            abort_unless(! empty($validated['team_id']), 422, 'A team must be selected.');
            WorkspaceTeam::where('id', $validated['team_id'])->where('workspace_id', $variable->workspace_id)->firstOrFail();
        } elseif (isset($validated['scope'])) {
            $validated['team_id'] = null;
        }

        $ownerId = $this->resolveOwnerId($validated, $variable->workspace_id, $variable->user_id);
        /** @var array{key?: string, value?: string|null, type?: string, group?: string|null, scope?: string, team_id?: string|null, user_id?: string|null, vault_provider?: string|null, vault_integration_id?: string|null, vault_integration_id?: string|null, vault_vault_id?: string|null, vault_vault_name?: string|null, vault_item_id?: string|null, vault_item_name?: string|null, vault_field_label?: string|null, vault_field_type?: string|null} $validated */
        $structuredType = $validated['type'] ?? $variable->type;
        if (
            isset($validated['value'])
            && in_array($structuredType, ['object', 'array', 'json'], true)
            && ! $this->isValidStructuredValue($structuredType, $validated['value'])
        ) {
            return back()->withErrors(['value' => "Value must be a valid {$structuredType}."]);
        }

        $type = $validated['type'] ?? $variable->type;
        if (
            in_array($type, ['secret', 'otp'], true)
            && array_key_exists('value', $validated)
            && $validated['value'] === ''
        ) {
            if ($type !== $variable->type) {
                return back()->withErrors(['value' => 'A value is required when changing to a protected variable type.']);
            }

            unset($validated['value']);
        }

        if ($type === 'vault' && ! empty($validated['vault_provider'])) {
            if (! empty($validated['vault_integration_id'])) {
                $validated['vault_integration_id'] = $this->resolveVaultIntegrationId(
                    $variable->workspace_id,
                    (string) $validated['vault_integration_id'],
                );
            }
            $fallbackIntegrationId = is_string($variable->vault_integration_id)
                ? $variable->vault_integration_id
                : null;
            $vaultReference = VaultReferenceInput::fromValidated($validated, $fallbackIntegrationId);
            if (! isset($validated['vault_integration_id'])) {
                // The integration id fell back to the variable's stored value,
                // which has not gone through resolveVaultIntegrationId.
                $this->ensureVaultIntegrationAvailable($variable->workspace_id, $vaultReference->integrationId);
            }
            $validated['value'] = $vaultReference->toReference();
        } elseif ($type !== 'vault') {
            $validated['vault_provider'] = null;
            $validated['vault_integration_id'] = null;
            $validated['vault_vault_id'] = null;
            $validated['vault_vault_name'] = null;
            $validated['vault_item_id'] = null;
            $validated['vault_item_name'] = null;
            $validated['vault_field_label'] = null;
            $validated['vault_field_type'] = null;
        }

        $targetScope = $validated['scope'] ?? $variable->scope;
        $scopeChanged = $targetScope !== $variable->scope;
        $ownerChanged = $ownerId !== $variable->user_id;
        $targetTeamId = $targetScope === 'team' ? ($validated['team_id'] ?? $variable->team_id) : null;

        if (
            ($scopeChanged || $ownerChanged || ($targetScope === 'team' && $targetTeamId !== $variable->team_id))
            && ! $this->assignments->ownerSatisfiesScope($variable->workspace_id, $ownerId, $targetScope, $targetTeamId)
        ) {
            return back()->withErrors(['user_id' => $this->ownerScopeError($targetScope)]);
        }

        if (array_key_exists('group', $validated)) {
            $validated['group'] = $validated['group'] ?: null;
        }

        if (array_key_exists('value', $validated) && $validated['value'] === null) {
            unset($validated['value']);
        }

        $variable->update($validated);

        return back()->with('success', 'Variable updated.');
    }

    private function authorizeVariableManagement(Request $request, UserVariable $variable): void
    {
        Gate::authorize(Ability::UPDATE->value, $variable);
    }

    private function ownerScopeError(string $scope): string
    {
        return $scope === 'team'
            ? 'The owner must be a member of the selected team.'
            : 'The owner must be a member of this workspace.';
    }

    /** @return list<array<string, mixed>> */
    private function findVariableUsages(
        string $id,
        string $userId,
        string $workspaceId,
        string $excludeVarId,
        string $scope,
        User $actor,
    ): array {
        $pattern = '${vars.'.$id;
        $codePatterns = [
            '~'.preg_quote('$vars', '~').'\s*\(\s*(["\'])'.preg_quote($id, '~').'(?=\1|\.)~',
        ];

        $flowMap = [];
        $varUsages = [];

        $iconCols = ['icon_type', 'icon_value', 'icon_color', 'icon_upload_path', 'updated_at'];

        $flows = Flow::where('workspace_id', $workspaceId)
            ->where(function ($q) {
                $q->whereNotNull('default_inputs')->orWhereNotNull('code')->orWhereNotNull('nodal_graph');
            })
            ->get(array_merge([
                'id', 'name', 'default_inputs', 'code', 'nodal_graph',
                'workspace_id', 'owner_id', 'visibility', 'team_id',
            ], $iconCols));

        foreach ($flows as $flow) {
            if (! $actor->can(Ability::VIEW->value, $flow)) {
                continue;
            }

            $json = (string) json_encode($flow->default_inputs ?? []);
            $code = $flow->code ?? '';

            $types = [];
            if (str_contains($json, $pattern)) {
                $types[] = 'default_input';
            }
            foreach ($codePatterns as $cp) {
                if (preg_match($cp, $code) === 1) {
                    $types[] = 'code';
                    break;
                }
            }
            $nodalGraph = is_array($flow->nodal_graph) ? json_encode($flow->nodal_graph) : '';
            $nodalGraph = is_string($nodalGraph) ? $nodalGraph : '';
            if ($nodalGraph && (str_contains($nodalGraph, $pattern) || collect($codePatterns)->contains(fn ($cp) => preg_match($cp, $nodalGraph) === 1))) {
                $types[] = 'visual';
            }

            if ($types) {
                $flowMap[$flow->id] = [
                    'flow_id' => $flow->id, 'flow_name' => $flow->name,
                    'icon_type' => $flow->icon_type, 'icon_value' => $flow->icon_value,
                    'icon_color' => $flow->icon_color, 'icon_url' => $flow->icon_url,
                    'types' => $types,
                ];
            }
        }

        $triggerQuery = FlowTrigger::whereHas('flow', fn ($q) => $q->where('workspace_id', $workspaceId))
            ->with('flow:id,name,workspace_id,owner_id,visibility,team_id,'.implode(',', $iconCols));
        if ($scope === 'user') {
            $triggerQuery->where('user_id', $userId);
        }
        $triggers = $triggerQuery->get(['id', 'label', 'input_template', 'flow_id']);

        foreach ($triggers as $trigger) {
            $json = (string) json_encode($trigger->input_template ?? []);
            if (
                str_contains($json, $pattern)
                && $trigger->flow?->id
                && $actor->can(Ability::VIEW->value, $trigger->flow)
            ) {
                $flowId = $trigger->flow->id;
                if (! isset($flowMap[$flowId])) {
                    $flowMap[$flowId] = [
                        'flow_id' => $flowId, 'flow_name' => $trigger->flow->name,
                        'icon_type' => $trigger->flow->icon_type, 'icon_value' => $trigger->flow->icon_value,
                        'icon_color' => $trigger->flow->icon_color, 'icon_url' => $trigger->flow->icon_url,
                        'types' => [],
                    ];
                }
                if (! in_array('trigger', $flowMap[$flowId]['types'])) {
                    $flowMap[$flowId]['types'][] = 'trigger';
                }
            }
        }

        $inputQuery = FlowUserInput::whereHas('flow', fn ($q) => $q->where('workspace_id', $workspaceId))
            ->with('flow:id,name,workspace_id,owner_id,visibility,team_id,'.implode(',', $iconCols));
        if ($scope === 'user') {
            $inputQuery->where('user_id', $userId);
        }
        $inputs = $inputQuery->get(['id', 'input', 'flow_id']);

        foreach ($inputs as $input) {
            $json = is_array($input->input) ? json_encode($input->input) : ($input->input ?? '');
            $json = is_string($json) ? $json : '';
            if (
                str_contains($json, $pattern)
                && $input->flow?->id
                && $actor->can(Ability::VIEW->value, $input->flow)
            ) {
                $flowId = $input->flow->id;
                if (! isset($flowMap[$flowId])) {
                    $flowMap[$flowId] = [
                        'flow_id' => $flowId, 'flow_name' => $input->flow->name,
                        'icon_type' => $input->flow->icon_type, 'icon_value' => $input->flow->icon_value,
                        'icon_color' => $input->flow->icon_color, 'icon_url' => $input->flow->icon_url,
                        'types' => [],
                    ];
                }
                if (! in_array('input', $flowMap[$flowId]['types'])) {
                    $flowMap[$flowId]['types'][] = 'input';
                }
            }
        }

        $varQuery = UserVariable::where('workspace_id', $workspaceId)
            ->where('stale', false)
            ->where('id', '!=', $excludeVarId);
        if ($scope === 'user') {
            $varQuery->where('user_id', $userId);
        }
        $otherVars = $varQuery->get(['id', 'key', 'value', 'workspace_id', 'user_id', 'scope', 'team_id']);

        foreach ($otherVars as $var) {
            if (
                $actor->can(Ability::VIEW->value, $var)
                && str_contains($var->value ?? '', $pattern)
            ) {
                $varUsages[] = ['type' => 'variable', 'id' => $var->id, 'label' => $var->key];
            }
        }

        $usages = array_values($flowMap);
        foreach ($varUsages as $v) {
            $usages[] = $v;
        }

        return $usages;
    }

    public function destroy(Request $request, UserVariable $variable): RedirectResponse
    {
        $this->authorizeVariableManagement($request, $variable);

        $variable->delete();

        return back()->with('success', 'Variable deleted.');
    }

    public function destroyBatch(Request $request): RedirectResponse
    {
        $workspaceId = $this->currentWorkspaceId();
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => [
                'string',
                'distinct',
                \Illuminate\Validation\Rule::exists('user_variables', 'id')
                    ->where('workspace_id', $workspaceId),
            ],
        ]);

        /** @var list<string> $ids */
        $ids = $validated['ids'];
        $variables = UserVariable::query()->whereIn('id', $ids)->orderBy('id')->get();

        foreach ($variables as $variable) {
            $this->authorizeVariableManagement($request, $variable);
        }

        DB::transaction(fn () => $variables->each->delete(), 3);
        $count = $variables->count();

        return back()->with('success', $count === 1 ? 'Variable deleted.' : "{$count} variables deleted.");
    }

    public function suggestions(Request $request): JsonResponse
    {
        if (! $this->features()->enabled('variables_enabled')) {
            return response()->json([]);
        }

        $workspaceId = $this->currentWorkspaceId();
        $context = $this->authorizationContexts->for($this->user($request), $workspaceId);

        $variablesQuery = UserVariable::query()->where('stale', false);
        $this->sharedVisibility->applyUse($variablesQuery, $context);
        $variables = $variablesQuery
            ->with('team:id,name')
            ->orderByRaw("CASE WHEN scope = 'workspace' THEN 0 WHEN scope = 'team' THEN 1 ELSE 2 END")
            ->orderBy('key')
            ->get(['id', 'key', 'type', 'value', 'scope', 'team_id', 'vault_provider']);

        $suggestions = [];
        foreach ($variables as $var) {
            $suggestion = [
                'id' => $var->id,
                'key' => $var->key,
                'type' => $var->type,
                'scope' => $var->scope,
                'team_name' => $var->team?->name,
                'provider' => $var->vault_provider,
            ];
            if (in_array($var->type, ['text', 'object', 'array', 'json'], true)) {
                $suggestion['preview_value'] = in_array($var->type, ['object', 'array', 'json'], true)
                    ? json_decode($var->value, true)
                    : $var->value;
            }
            $suggestions[] = $suggestion;

            if (in_array($var->type, ['object', 'array', 'json'], true)) {
                $decoded = json_decode($var->value, true);
                if (is_array($decoded)) {
                    $this->flattenJsonKeys(
                        $decoded,
                        $var->id,
                        $var->key,
                        $var->scope,
                        $var->team?->name,
                        $var->vault_provider,
                        $suggestions,
                    );
                }
            }
        }

        return response()->json($suggestions);
    }

    private function ensureVaultIntegrationAvailable(string $workspaceId, string $integrationId): void
    {
        $this->features()->abortIfDisabled('vaults_enabled');

        $integration = Integration::where('workspace_id', $workspaceId)
            ->where('id', $integrationId)
            ->where('category', IntegrationCategoryEnum::VAULT)
            ->where('is_active', true)
            ->where('stale', false)
            ->firstOrFail();

        Gate::authorize(Ability::USE->value, $integration);
    }

    private function resolveVaultIntegrationId(string $workspaceId, string $id): string
    {
        $this->features()->abortIfDisabled('vaults_enabled');
        $integration = Integration::where('workspace_id', $workspaceId)
            ->where('id', $id)
            ->where('category', IntegrationCategoryEnum::VAULT)
            ->where('is_active', true)
            ->where('stale', false)
            ->first();
        if (! $integration) {
            throw ValidationException::withMessages([
                'vault_integration_id' => 'The selected vault integration is unavailable.',
            ]);
        }
        Gate::authorize(Ability::USE->value, $integration);

        return $integration->id;
    }

    private function features(): FeatureFlagService
    {
        return app(FeatureFlagService::class);
    }

    private function isValidStructuredValue(string $type, string $value): bool
    {
        try {
            $decoded = json_decode($value, false, flags: JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            return false;
        }

        return match ($type) {
            'object' => is_object($decoded),
            'array' => is_array($decoded),
            'json' => is_object($decoded) || is_array($decoded),
            default => false,
        };
    }

    /**
     * @param  array<array-key, mixed>  $data
     * @param  list<array<string, mixed>>  $suggestions
     */
    private function flattenJsonKeys(
        array $data,
        string $idPrefix,
        string $labelPrefix,
        string $scope,
        ?string $teamName,
        ?string $provider,
        array &$suggestions,
        int $depth = 0,
    ): void
    {
        if ($depth > 5) {
            return;
        }

        foreach ($data as $k => $v) {
            $fullId = "{$idPrefix}.{$k}";
            $fullLabel = "{$labelPrefix}.{$k}";
            $suggestions[] = [
                'id' => $fullId,
                'key' => $fullLabel,
                'type' => 'json_path',
                'scope' => $scope,
                'team_name' => $teamName,
                'provider' => $provider,
                'preview_value' => $v,
            ];

            if (is_array($v) && ! array_is_list($v)) {
                $this->flattenJsonKeys(
                    $v,
                    $fullId,
                    $fullLabel,
                    $scope,
                    $teamName,
                    $provider,
                    $suggestions,
                    $depth + 1,
                );
            }
        }
    }

    private function currentWorkspaceId(): string
    {
        $currentWorkspaceId = $this->workspaceIdFromSession();

        return $currentWorkspaceId;
    }

    private function user(Request $request): User
    {
        /** @var User $user */
        $user = $request->user();

        return $user;
    }
}
