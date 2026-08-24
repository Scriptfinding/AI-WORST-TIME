<?php

namespace App\Services\Flow;

use App\Enums\Authorization\Ability;
use App\Enums\Integration\IntegrationRepositoryProviderEnum;
use App\Models\Flow;
use App\Models\FlowRepositoryLink;
use App\Models\Integration;
use App\Services\FeatureFlags\FeatureFlagService;
use App\Services\Integration\Repository\RepositoryService;
use Illuminate\Support\Facades\Gate;

final class FlowRepositoryLinkService
{
    public function __construct(
        private readonly FeatureFlagService $features,
    ) {}

    /**
     * @param array{
     *   integration_id: string, repo_full_name: string, branch: string,
     *   file_path: string, sync_trigger?: string
     * } $attributes
     */
    public function save(Flow $flow, array $attributes): void
    {
        $integration = $this->availableIntegration(
            $flow->workspace_id,
            $attributes['integration_id'],
        );
        $attributes['integration_id'] = $integration->id;
        $link = FlowRepositoryLink::updateOrCreate(['flow_id' => $flow->id], $attributes);

        if ($integration->provider instanceof IntegrationRepositoryProviderEnum) {
            try {
                $code = app(RepositoryService::class)->fetchFile(
                    $integration->provider,
                    $this->config($integration),
                    $attributes['repo_full_name'],
                    $attributes['branch'],
                    $attributes['file_path'],
                );
                if ($code !== null) {
                    $flow->update(['code' => $code, 'source_type' => 'repository']);
                    $link->update(['last_synced_at' => now()]);
                } else {
                    $flow->update(['source_type' => 'repository']);
                }
            } catch (\Throwable) {
                $flow->update(['source_type' => 'repository']);
            }
        } else {
            $flow->update(['source_type' => 'repository']);
        }
    }

    public function remove(Flow $flow): void
    {
        FlowRepositoryLink::where('flow_id', $flow->id)->delete();
        $flow->update(['source_type' => 'code']);
    }

    public function availableIntegration(string $workspaceId, string $integrationId): Integration
    {
        $this->features->abortIfDisabled('vcs_enabled');
        $integration = Integration::where('workspace_id', $workspaceId)->where('id', $integrationId)
            ->where('category', 'repository')->where('is_active', true)->where('stale', false)->firstOrFail();
        Gate::authorize(Ability::USE->value, $integration);

        return $integration;
    }

    /** @return array<string, bool|float|int|string|null> */
    private function config(Integration $integration): array
    {
        $config = $integration->config ?? [];
        /** @var array<string, bool|float|int|string|null> $config */

        return $config;
    }
}
