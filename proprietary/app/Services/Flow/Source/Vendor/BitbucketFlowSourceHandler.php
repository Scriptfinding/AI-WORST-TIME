<?php

namespace App\Services\Flow\Source\Vendor;

use App\Contracts\Flow\Source\FlowSourceHandlerInterface;
use App\Enums\Authorization\Ability;
use App\Enums\Integration\IntegrationRepositoryProviderEnum;
use App\Models\Flow;
use App\Models\FlowRepositoryLink;
use App\Models\Integration;
use App\Services\FeatureFlags\FeatureFlagService;
use App\Services\Integration\Repository\RepositoryService;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;

class BitbucketFlowSourceHandler implements FlowSourceHandlerInterface
{
    public function __construct(
        private RepositoryService $repositoryService,
    ) {}

    public function supports(IntegrationRepositoryProviderEnum $provider): bool
    {
        return $provider === IntegrationRepositoryProviderEnum::BITBUCKET;
    }

    public function resolveCode(FlowRepositoryLink $link, Integration $integration): ?string
    {
        if ((bool) $integration->getAttribute('stale') || ! app(FeatureFlagService::class)->enabled('vcs_enabled')) {
            return null;
        }

        $rawConfig = $integration->getAttribute('config');
        /** @var array<string, scalar|null> $config */
        $config = is_array($rawConfig) ? $rawConfig : [];

        return $this->repositoryService->fetchFile(
            IntegrationRepositoryProviderEnum::BITBUCKET,
            $config,
            $link->repo_full_name,
            $link->branch,
            $link->file_path,
        );
    }

    public function syncLink(FlowRepositoryLink $link, Integration $integration): bool
    {
        $link->loadMissing('flow');
        $flow = $link->flow;
        $workspaceId = $integration->getAttribute('workspace_id');
        if (
            ! $flow instanceof Flow
            || ! is_scalar($workspaceId)
            || $flow->workspace_id !== $workspaceId
        ) {
            return false;
        }

        $code = $this->resolveCode($link, $integration);

        if ($code === null) {
            return false;
        }

        $flow->update(['code' => $code]);
        $link->update(['last_synced_at' => now()]);

        Log::info('FlowSource[bitbucket]: synced flow code', [
            'flow_id' => $link->flow_id,
        ]);

        return true;
    }

    public function verifyWebhook(Integration $integration, string $rawBody, Request $request): bool
    {
        $config = $integration->getAttribute('config');
        $config = is_array($config) ? $config : [];
        $secret = $config['webhook_secret'] ?? null;
        $signature = $request->header('X-Hub-Signature');

        if (! is_string($secret) || $secret === '' || ! is_string($signature) || $signature === '') {
            return false;
        }

        return hash_equals(
            'sha256='.hash_hmac('sha256', $rawBody, $secret),
            $signature,
        );
    }

    /**
     * @param  array<string, mixed>  $payload
     * @param  Collection<int, Integration>  $integrations
     */
    public function processWebhook(array $payload, Collection $integrations, Request $request): int
    {
        if (
            ! app(FeatureFlagService::class)->enabled('vcs_enabled')
            || $request->header('X-Event-Key') !== 'repo:push'
        ) {
            return 0;
        }

        $repoFullName = data_get($payload, 'repository.full_name', '');
        $changes = data_get($payload, 'push.changes', []);
        $branches = collect(is_array($changes) ? $changes : [])
            ->map(function (mixed $change): mixed {
                if (! is_array($change)) {
                    return null;
                }

                $new = $change['new'] ?? null;

                return is_array($new) ? ($new['name'] ?? null) : null;
            })
            ->filter(fn ($branch) => is_string($branch) && $branch !== '')
            ->unique()
            ->values()
            ->all();

        if (! is_string($repoFullName) || $repoFullName === '' || $branches === []) {
            return 0;
        }

        $synced = 0;

        foreach ($integrations as $integration) {
            if (! $integration->user) {
                continue;
            }

            $workspaceIdValue = $integration->getAttribute('workspace_id');
            $workspaceId = is_string($workspaceIdValue) ? $workspaceIdValue : '';
            $links = FlowRepositoryLink::where('integration_id', $integration->id)
                ->where('repo_full_name', $repoFullName)
                ->whereIn('branch', $branches)
                ->whereHas('flow', fn ($query) => $query->where('workspace_id', $workspaceId))
                ->with('flow')
                ->get();

            foreach ($links as $link) {
                $flow = $link->flow;
                if (
                    ! $flow instanceof Flow
                    || $flow->workspace_id !== $workspaceId
                    || ! Gate::forUser($integration->user)->allows(Ability::UPDATE->value, $flow)
                ) {
                    continue;
                }

                try {
                    if ($this->syncLink($link, $integration)) {
                        $synced++;
                    }
                } catch (\Throwable) {
                    Log::warning('FlowSource[bitbucket]: webhook sync failed.', [
                        'flow_id' => $link->flow_id,
                    ]);
                }
            }
        }

        return $synced;
    }
}
