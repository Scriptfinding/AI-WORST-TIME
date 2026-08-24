<?php

namespace App\Http\Controllers\Internal;

use App\Authorization\AuthorizationContextFactory;
use App\Authorization\Visibility\SharedResourceVisibility;
use App\Enums\Integration\IntegrationCategoryEnum;
use App\Http\Controllers\Controller;
use App\Models\AiModel;
use App\Models\Flow;
use App\Models\FlowRun;
use App\Models\Integration;
use App\Models\User;
use App\Services\FeatureFlags\FeatureFlagService;
use App\Services\Integration\Ai\AiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RuntimeAiController extends Controller
{
    public function __construct(
        private readonly AiService $ai,
        private readonly AuthorizationContextFactory $authorizationContexts,
        private readonly SharedResourceVisibility $sharedVisibility,
    ) {}

    public function execute(Request $request): JsonResponse
    {
        app(FeatureFlagService::class)->abortIfDisabled('ai_enabled');
        $validated = $request->validate([
            'ai_model_id' => ['required', 'string', 'max:255', 'regex:/^[A-Za-z0-9_-]+$/'],
            'capability' => ['required', 'in:text,vision'],
            'messages' => ['required', 'array', 'max:50'],
            'messages.*.role' => ['required', 'in:user,assistant,system'],
            'messages.*.content' => ['required', 'array', 'max:20'],
            'messages.*.content.*.type' => ['required', 'in:text,image'],
            'messages.*.content.*.text' => ['nullable', 'string', 'max:100000'],
            'messages.*.content.*.data' => ['nullable', 'string', 'max:6990508'],
            'messages.*.content.*.mime_type' => ['nullable', 'in:image/jpeg,image/png,image/webp,image/gif'],
            'options' => ['nullable', 'array'],
        ]);
        $run = $request->attributes->get('runner');
        abort_unless($run instanceof FlowRun && $run->status === 'running', 409, 'The flow run is not active.');
        $flow = Flow::query()->find($run->flow_id);
        $actor = User::query()->find($run->triggered_by);
        abort_unless($flow instanceof Flow && $actor instanceof User, 403);
        $context = $this->authorizationContexts->for($actor, $flow->workspace_id);

        $modelQuery = AiModel::query()
            ->whereKey($validated['ai_model_id'])
            ->where('workspace_id', $flow->workspace_id)
            ->where('is_active', true)
            ->where('stale', false)
            ->where('capabilities->'.$validated['capability'], true)
            ->with('aiIntegration');
        $this->sharedVisibility->applyUse($modelQuery, $context);
        /** @var AiModel|null $aiModel */
        $aiModel = $modelQuery
            ->orderByRaw('CASE WHEN user_id = ? THEN 0 ELSE 1 END', [$actor->id])
            ->first();
        abort_unless($aiModel instanceof AiModel, 404, 'AI model not found or not available.');

        $integrationQuery = Integration::query()
            ->whereKey($aiModel->ai_integration_id)
            ->where('workspace_id', $flow->workspace_id)
            ->where('category', IntegrationCategoryEnum::AI)
            ->where('is_active', true)
            ->where('stale', false);
        $this->sharedVisibility->applyUse($integrationQuery, $context);
        $integration = $integrationQuery->first();
        abort_unless($integration instanceof Integration, 404, 'AI integration not found or not available.');
        $aiModel->setRelation('aiIntegration', $integration);

        $result = $this->ai->execute(
            $aiModel,
            $validated['capability'],
            $validated['messages'],
            is_array($validated['options'] ?? null) ? $validated['options'] : [],
        );

        return response()->json($result);
    }
}
