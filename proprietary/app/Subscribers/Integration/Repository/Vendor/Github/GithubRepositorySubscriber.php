<?php

namespace App\Subscribers\Integration\Repository\Vendor\Github;

use App\DTO\Integration\Repository\GithubRepositoryConfig;
use App\Enums\Integration\IntegrationRepositoryProviderEnum;
use App\Events\Integration\Repository\Vendor\Github\GithubAppCallbackReceived;
use App\Events\Integration\Repository\Vendor\Github\GithubAppInstallationReceived;
use App\Models\Integration;
use App\Services\FeatureFlags\FeatureFlagService;
use App\Services\Integration\Config\IntegrationConfigHydrator;
use App\Services\Integration\Repository\Vendor\Github\GithubRepositoryService;
use Illuminate\Events\Dispatcher;

class GithubRepositorySubscriber
{
    public function __construct(
        private readonly GithubRepositoryService $githubRepositoryService,
        private readonly IntegrationConfigHydrator $configHydrator,
    ) {}

    public function handleCallback(GithubAppCallbackReceived $event): void
    {
        if (! app(FeatureFlagService::class)->enabled('vcs_enabled')) {
            $event->error = 'Repository integrations are disabled.';

            return;
        }

        try {
            $data = $this->githubRepositoryService->exchangeCode($event->code);
        } catch (\Throwable $e) {
            $event->error = $e->getMessage();

            return;
        }

        $extractedConfig = $this->githubRepositoryService->extractConfig($data);
        if ($extractedConfig->webhookSecret() === '') {
            $event->error = 'GitHub did not return a webhook secret. The app was not connected.';

            return;
        }

        $owner = $data['owner'] ?? null;
        $isOrg = is_array($owner) && ($owner['type'] ?? null) === 'Organization';
        $appName = $data['name'] ?? null;

        $integration = new Integration([
            'workspace_id' => $event->workspaceId,
            'user_id' => $event->userId,
            'provider' => 'github',
            'category' => 'repository',
            'name' => $event->pendingName ?: (is_string($appName) ? $appName : 'GitHub'),
            'config' => $extractedConfig->toArray(),
            'scope' => $isOrg ? 'workspace' : 'owner',
        ]);
        $integration->webhook_id = $event->webhookId;
        $integration->save();

        $event->integrationId = $integration->id;

        try {
            $this->githubRepositoryService->configureSetupUrl(
                $extractedConfig,
                $integration->id,
                $event->webhookId,
            );
        } catch (\Throwable) {
            // Best-effort; setup_url can be configured manually in GitHub App settings.
        }
    }

    public function handleInstallation(GithubAppInstallationReceived $event): void
    {
        $integration = $event->integrationId
            ? Integration::find($event->integrationId)
            : Integration::where('workspace_id', $event->workspaceId)
                ->where('provider', 'github')
                ->where('category', 'repository')
                ->where('stale', false)
                ->first();

        if (
            ! $integration
            || (bool) $integration->getAttribute('stale')
            || ! app(FeatureFlagService::class)->enabled('vcs_enabled')
        ) {
            $event->error = 'No GitHub App found. Create one first.';

            return;
        }

        $config = $this->configHydrator->repository(
            IntegrationRepositoryProviderEnum::GITHUB,
            $integration->config ?? [],
        );
        if (! $config instanceof GithubRepositoryConfig) {
            throw new \LogicException('Expected GitHub repository configuration.');
        }
        $integration->update([
            'config' => $config->withInstallationId($event->installationId)->toArray(),
        ]);
    }

    public function subscribe(Dispatcher $events): void
    {
        $events->listen(
            GithubAppCallbackReceived::class,
            [self::class, 'handleCallback'],
        );

        $events->listen(
            GithubAppInstallationReceived::class,
            [self::class, 'handleInstallation'],
        );
    }
}
