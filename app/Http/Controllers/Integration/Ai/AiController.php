<?php

namespace App\Http\Controllers\Integration\Ai;

use App\Enums\Authorization\Ability;
use App\Enums\Integration\IntegrationAiProviderEnum;
use App\Enums\Integration\IntegrationCategoryEnum;
use App\Http\Controllers\Concerns\FindsAiModelUsages;
use App\Http\Controllers\Controller;
use App\Models\AiModel;
use App\Models\Integration;
use App\Models\User;
use App\Services\FeatureFlags\FeatureFlagService;
use App\Services\Integration\Ai\AiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class AiController extends Controller
{
    use FindsAiModelUsages;

    public function __construct(
        private readonly AiService $ai,
    ) {}

    public function validate(Request $request): JsonResponse
    {
        $features = app(FeatureFlagService::class);
        $features->abortIfDisabled('ai_enabled');
        $workspaceId = $this->workspaceIdFromSession();
        $validated = $request->validate([
            'integration_id' => [
                'sometimes',
                'string',
                Rule::exists('integrations', 'id')->where('workspace_id', $workspaceId),
            ],
            'provider' => ['required_without:integration_id', Rule::enum(IntegrationAiProviderEnum::class)],
            'config' => ['required_without:integration_id', 'array'],
        ]);
        $existing = null;
        if (isset($validated['integration_id'])) {
            $integrationId = $validated['integration_id'];
            abort_unless(is_string($integrationId), 422);
            $existing = Integration::query()
                ->where('workspace_id', $workspaceId)
                ->where('id', $integrationId)
                ->firstOrFail();
            $this->ensureWorkspace($existing);
            $features->abortIfIntegrationUnavailable($existing);
            Gate::authorize(Ability::USE->value, $existing);
            abort_unless($existing->category === IntegrationCategoryEnum::AI, 422);
        }
        $providerValue = $validated['provider'] ?? $existing?->getRawOriginal('provider');
        $config = $validated['config'] ?? [];
        abort_unless(is_string($providerValue) && is_array($config), 422);
        /** @var array<string, mixed> $config */
        $provider = IntegrationAiProviderEnum::from($providerValue);
        $this->ai->validateConfig($provider, $config, $existing);

        return response()->json(['valid' => true]);
    }

    public function usages(Request $request, Integration $integration): JsonResponse
    {
        app(FeatureFlagService::class)->abortIfDisabled('ai_enabled');
        $this->ensureWorkspace($integration);
        app(FeatureFlagService::class)->abortIfIntegrationUnavailable($integration);
        Gate::authorize(Ability::UPDATE->value, $integration);
        abort_unless($integration->category === IntegrationCategoryEnum::AI, 422);

        $models = AiModel::query()
            ->where('ai_integration_id', $integration->id)
            ->where('stale', false)
            ->orderBy('name')
            ->get(['id', 'name', 'workspace_id']);

        /** @var User $user */
        $user = $request->user();
        $flows = $models
            ->flatMap(
                fn (AiModel $model): array => $this->findFlowsUsingAiModel(
                    $model->id,
                    $integration->workspace_id,
                    $user,
                ),
            )
            ->unique('flow_id')
            ->values();

        return response()->json([
            'models' => $models,
            'flows' => $flows,
        ]);
    }

    private function ensureWorkspace(Integration $integration): void
    {
        $workspaceId = $this->workspaceIdFromSession();
        abort_unless($integration->workspace_id === $workspaceId, 404);
    }
}
