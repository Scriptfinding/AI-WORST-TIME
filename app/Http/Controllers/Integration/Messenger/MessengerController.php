<?php

namespace App\Http\Controllers\Integration\Messenger;

use App\DTO\Integration\IntegrationValidationResult;
use App\Enums\Authorization\Ability;
use App\Enums\Integration\IntegrationCategoryEnum;
use App\Enums\Integration\IntegrationMessengerProviderEnum;
use App\Events\Integration\Messenger\MessengerValidationRequested;
use App\Http\Controllers\Concerns\FindsChannelUsages;
use App\Http\Controllers\Controller;
use App\Models\Integration;
use App\Models\NotificationChannel;
use App\Models\User;
use App\Services\FeatureFlags\FeatureFlagService;
use App\Services\Integration\Config\IntegrationConfigHydrator;
use App\Services\Integration\Messenger\MessengerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class MessengerController extends Controller
{
    use FindsChannelUsages;

    public function __construct(
        private MessengerService $messengerService,
        private IntegrationConfigHydrator $configHydrator,
    ) {}

    public function validate(Request $request): JsonResponse
    {
        $this->features()->abortIfDisabled('messenger_enabled');
        $currentWorkspaceId = $this->workspaceIdFromSession();

        /** @var array{
         *     integration_id?: string,
         *     provider?: string,
         *     config?: array<string, bool|float|int|string|null>
         * } $validated
         */
        $validated = $request->validate([
            'integration_id' => [
                'sometimes',
                'string',
                Rule::exists('integrations', 'id')->where('workspace_id', $currentWorkspaceId),
            ],
            'provider' => ['required_without:integration_id', Rule::in(array_column(IntegrationMessengerProviderEnum::cases(), 'value'))],
            'config' => 'required_without:integration_id|array',
        ]);

        if (! empty($validated['integration_id'])) {
            $integration = Integration::where('workspace_id', $currentWorkspaceId)
                ->where('id', $validated['integration_id'])
                ->firstOrFail();
            $this->features()->abortIfIntegrationUnavailable($integration);
            Gate::authorize(Ability::USE->value, $integration);
            $this->ensureCategory($integration, IntegrationCategoryEnum::MESSENGER);

            if (! empty($validated['config'])) {
                $integration->config = array_merge(
                    $integration->config ?? [],
                    $validated['config'],
                );
            }
        } else {
            $providerValue = $validated['provider'] ?? null;
            $configValue = $validated['config'] ?? null;
            abort_unless(is_string($providerValue), 422, 'A messenger provider is required.');
            abort_unless(is_array($configValue), 422, 'Messenger configuration is required.');
            $provider = IntegrationMessengerProviderEnum::from($providerValue);

            $integration = new Integration([
                'category' => IntegrationCategoryEnum::MESSENGER,
                'provider' => $provider,
                'config' => $configValue,
                'is_active' => true,
            ]);
        }

        $event = new MessengerValidationRequested($integration);
        event($event);

        return response()->json(
            ($event->result ?? IntegrationValidationResult::failure('No handler matched.'))->toArray(),
        );
    }

    public function detectChats(Request $request, Integration $integration): JsonResponse
    {
        $this->features()->abortIfIntegrationUnavailable($integration);
        $this->authorizeIntegration($integration, Ability::USE);
        $this->ensureCategory($integration, IntegrationCategoryEnum::MESSENGER);

        $provider = $integration->messengerProvider();
        $config = $this->configHydrator->messenger($provider, $integration->config ?? []);
        $result = $this->messengerService->detectChats(
            $provider,
            $config,
        );

        return response()->json($result);
    }

    public function test(Request $request, Integration $integration): JsonResponse
    {
        $this->features()->abortIfIntegrationUnavailable($integration);
        $this->authorizeIntegration($integration, Ability::USE);
        $this->ensureCategory($integration, IntegrationCategoryEnum::MESSENGER);

        /** @var array{chat_id: string, message?: string} $validated */
        $validated = $request->validate([
            'chat_id' => 'required|string',
            'message' => 'sometimes|string|max:1000',
        ]);

        $provider = $integration->messengerProvider();
        $config = $this->configHydrator->messenger($provider, $integration->config ?? []);
        $result = $this->messengerService->sendTestMessage(
            $provider,
            $config,
            $validated['chat_id'],
            $validated['message'] ?? 'Test message from Puppetflow',
        );

        return response()->json($result);
    }

    public function usages(Request $request, Integration $integration): JsonResponse
    {
        $this->features()->abortIfStale($integration);
        $this->authorizeIntegration($integration, Ability::UPDATE);
        $this->ensureCategory($integration, IntegrationCategoryEnum::MESSENGER);

        $channels = NotificationChannel::where('messenger_integration_id', $integration->id)
            ->where('stale', false)
            ->get(['id', 'name', 'provider', 'scope']);

        /** @var User $user */
        $user = $request->user();
        /** @var list<string> $channelIds */
        $channelIds = array_values($channels->pluck('id')->all());
        $flows = $channels->isNotEmpty()
            ? $this->findFlowsUsingChannels($channelIds, $integration->workspace_id, $user)
            : [];

        return response()->json([
            'channels' => $channels->map(fn ($c) => ['id' => $c->id, 'name' => $c->name, 'provider' => $c->provider, 'scope' => $c->scope]),
            'flows' => $flows,
        ]);
    }

    private function authorizeIntegration(Integration $integration, Ability $ability): void
    {
        $currentWorkspaceId = $this->workspaceIdFromSession();
        abort_unless($integration->workspace_id === $currentWorkspaceId, 404);
        Gate::authorize($ability->value, $integration);
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
