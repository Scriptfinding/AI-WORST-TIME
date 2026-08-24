<?php

namespace App\Http\Controllers\Integration\Vault;

use App\DTO\Integration\IntegrationValidationResult;
use App\Enums\Authorization\Ability;
use App\Enums\Integration\IntegrationCategoryEnum;
use App\Enums\Integration\IntegrationVaultProviderEnum;
use App\Events\Integration\Vault\VaultValidationRequested;
use App\Http\Controllers\Controller;
use App\Models\Flow;
use App\Models\FlowTrigger;
use App\Models\FlowUserInput;
use App\Models\Integration;
use App\Models\UserVariable;
use App\Services\FeatureFlags\FeatureFlagService;
use App\Services\Integration\Vault\VaultService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class VaultController extends Controller
{
    public function __construct(
        private VaultService $vaultService,
    ) {}

    public function validate(Request $request): JsonResponse
    {
        $this->features()->abortIfDisabled('vaults_enabled');

        $validated = $request->validate([
            'integration_id' => [
                'sometimes',
                'string',
                Rule::exists('integrations', 'id')->where('workspace_id', $this->currentWorkspaceId()),
            ],
            'provider' => ['required_without:integration_id', Rule::in(array_column(IntegrationVaultProviderEnum::cases(), 'value'))],
            'config' => 'required_without:integration_id|array',
        ]);

        if (! empty($validated['integration_id'])) {
            $integration = Integration::query()
                ->where('workspace_id', $this->currentWorkspaceId())
                ->where('id', $validated['integration_id'])
                ->firstOrFail();
            $this->features()->abortIfIntegrationUnavailable($integration);
            Gate::authorize(Ability::USE->value, $integration);
            $this->ensureCategory($integration, IntegrationCategoryEnum::VAULT);

            if (! empty($validated['config'])) {
                $integration->config = array_merge(
                    $integration->config ?? [],
                    $validated['config'],
                );
            }
        } else {
            $providerValue = $validated['provider'] ?? null;
            abort_unless(is_string($providerValue), 422);
            $provider = IntegrationVaultProviderEnum::from($providerValue);
            $config = $validated['config'] ?? [];
            abort_unless(is_array($config), 422);

            $integration = new Integration([
                'category' => IntegrationCategoryEnum::VAULT,
                'provider' => $provider,
                'config' => $config,
                'is_active' => true,
            ]);
        }

        $event = new VaultValidationRequested($integration);
        event($event);

        return response()->json(
            ($event->result ?? IntegrationValidationResult::failure('No handler matched.'))->toArray(),
        );
    }

    public function listVaults(Request $request, Integration $integration): JsonResponse
    {
        $this->features()->abortIfIntegrationUnavailable($integration);
        $this->authorizeIntegration($integration, Ability::USE);
        $this->ensureCategory($integration, IntegrationCategoryEnum::VAULT);

        $vaults = $this->vaultService->listVaults(
            $integration->vaultProvider(),
            $integration->config ?? [],
        );

        return response()->json($vaults);
    }

    public function listVaultItems(Request $request, Integration $integration, string $vaultId): JsonResponse
    {
        $this->features()->abortIfIntegrationUnavailable($integration);
        $this->authorizeIntegration($integration, Ability::USE);
        $this->ensureCategory($integration, IntegrationCategoryEnum::VAULT);

        $items = $this->vaultService->listItems(
            $integration->vaultProvider(),
            $integration->config ?? [],
            $vaultId,
        );

        return response()->json($items);
    }

    public function listVaultItemFields(Request $request, Integration $integration, string $vaultId, string $itemId): JsonResponse
    {
        $this->features()->abortIfIntegrationUnavailable($integration);
        $this->authorizeIntegration($integration, Ability::USE);
        $this->ensureCategory($integration, IntegrationCategoryEnum::VAULT);

        $fields = $this->vaultService->listItemFields(
            $integration->vaultProvider(),
            $integration->config ?? [],
            $vaultId,
            $itemId,
        );

        return response()->json($fields);
    }

    public function usages(Request $request, Integration $integration): JsonResponse
    {
        $this->features()->abortIfStale($integration);
        $this->authorizeIntegration($integration, Ability::UPDATE);
        $this->ensureCategory($integration, IntegrationCategoryEnum::VAULT);

        $variables = UserVariable::where('vault_integration_id', $integration->id)->get(['id', 'key', 'user_id', 'workspace_id', 'scope']);

        if ($variables->isEmpty()) {
            return response()->json(['variables' => [], 'flows' => []]);
        }

        $iconCols = ['icon_type', 'icon_value', 'icon_color', 'icon_upload_path', 'updated_at'];
        $flowMap = [];

        foreach ($variables as $variable) {
            $pattern = '${vars.'.$variable->id;
            $codePatterns = [
                '~'.preg_quote('$vars', '~').'\s*\(\s*(["\'])'.preg_quote($variable->id, '~').'(?=\1|\.)~',
            ];

            $flows = Flow::where('workspace_id', $variable->workspace_id)
                ->where(function ($query): void {
                    $query->whereNotNull('default_inputs')
                        ->orWhereNotNull('code')
                        ->orWhereNotNull('nodal_graph');
                })
                ->get(array_merge(['id', 'name', 'default_inputs', 'code', 'nodal_graph'], $iconCols));

            foreach ($flows as $flow) {
                $defaultInputs = (string) json_encode($flow->default_inputs ?? []);
                $nodalGraph = (string) json_encode($flow->nodal_graph ?? []);
                $code = is_string($flow->code) ? $flow->code : '';
                $isUsed = str_contains($defaultInputs, $pattern)
                    || str_contains($nodalGraph, $pattern)
                    || collect($codePatterns)->contains(
                        fn (string $codePattern): bool => preg_match($codePattern, $code) === 1
                            || preg_match($codePattern, $nodalGraph) === 1,
                    );
                if ($isUsed && ! isset($flowMap[$flow->id])) {
                    $flowMap[$flow->id] = ['flow_id' => $flow->id, 'flow_name' => $flow->name, 'icon_type' => $flow->icon_type, 'icon_value' => $flow->icon_value, 'icon_color' => $flow->icon_color, 'icon_url' => $flow->icon_url];
                }
            }

            $triggers = FlowTrigger::whereHas('flow', fn ($q) => $q->where('workspace_id', $variable->workspace_id))
                ->with('flow:id,name,'.implode(',', $iconCols))
                ->get(['id', 'input_template', 'flow_id']);

            foreach ($triggers as $trigger) {
                $json = (string) json_encode($trigger->input_template ?? []);
                if (str_contains($json, $pattern) && $trigger->flow && ! isset($flowMap[$trigger->flow->id])) {
                    $flowMap[$trigger->flow->id] = ['flow_id' => $trigger->flow->id, 'flow_name' => $trigger->flow->name, 'icon_type' => $trigger->flow->icon_type, 'icon_value' => $trigger->flow->icon_value, 'icon_color' => $trigger->flow->icon_color, 'icon_url' => $trigger->flow->icon_url];
                }
            }

            $inputs = FlowUserInput::whereHas('flow', fn ($q) => $q->where('workspace_id', $variable->workspace_id))
                ->with('flow:id,name,'.implode(',', $iconCols))
                ->get(['id', 'input', 'flow_id']);

            foreach ($inputs as $input) {
                $json = is_array($input->input) ? json_encode($input->input) : ($input->input ?? '');
                $json = is_string($json) ? $json : '';
                if (str_contains($json, $pattern) && $input->flow && ! isset($flowMap[$input->flow->id])) {
                    $flowMap[$input->flow->id] = ['flow_id' => $input->flow->id, 'flow_name' => $input->flow->name, 'icon_type' => $input->flow->icon_type, 'icon_value' => $input->flow->icon_value, 'icon_color' => $input->flow->icon_color, 'icon_url' => $input->flow->icon_url];
                }
            }
        }

        return response()->json([
            'variables' => $variables->map(fn ($v) => ['id' => $v->id, 'key' => $v->key]),
            'flows' => array_values($flowMap),
        ]);
    }

    private function authorizeIntegration(Integration $integration, Ability $ability): void
    {
        abort_unless($integration->workspace_id === $this->currentWorkspaceId(), 404);
        Gate::authorize($ability->value, $integration);
    }

    private function currentWorkspaceId(): string
    {
        $workspaceId = $this->workspaceIdFromSession();

        return $workspaceId;
    }

    private function ensureCategory(Integration $integration, IntegrationCategoryEnum $category): void
    {
        abort_unless($integration->category === $category, 422);
    }

    private function features(): FeatureFlagService
    {
        return app(FeatureFlagService::class);
    }
}
