<?php

namespace App\Http\Controllers\Integration\Repository;

use App\Contracts\Integration\Repository\RepositoryConfig;
use App\DTO\Integration\Repository\GithubRepositoryConfig;
use App\Enums\Authorization\Ability;
use App\Enums\Integration\IntegrationCategoryEnum;
use App\Enums\Integration\IntegrationRepositoryProviderEnum;
use App\Http\Controllers\Controller;
use App\Models\Integration;
use App\Services\FeatureFlags\FeatureFlagService;
use App\Services\Integration\Config\IntegrationConfigHydrator;
use App\Services\Integration\Repository\RepositoryService;
use App\Services\Integration\Repository\Vendor\Github\GithubDriver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class RepositoryController extends Controller
{
    public function __construct(
        private RepositoryService $repositoryService,
        private IntegrationConfigHydrator $configHydrator,
    ) {}

    public function validate(Request $request): JsonResponse
    {
        $this->features()->abortIfDisabled('vcs_enabled');
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
            'provider' => ['required_without:integration_id', Rule::in(array_column(IntegrationRepositoryProviderEnum::cases(), 'value'))],
            'config' => 'required_without:integration_id|array',
        ]);

        if (! empty($validated['integration_id'])) {
            $integration = Integration::where('workspace_id', $currentWorkspaceId)
                ->where('id', $validated['integration_id'])
                ->firstOrFail();
            $this->features()->abortIfIntegrationUnavailable($integration);
            Gate::authorize(Ability::USE->value, $integration);
            $this->ensureCategory($integration, IntegrationCategoryEnum::REPOSITORY);

            if (! empty($validated['config'])) {
                $integration->config = array_merge(
                    $integration->config ?? [],
                    $validated['config'],
                );
            }
        } else {
            $providerValue = $validated['provider'] ?? null;
            $configValue = $validated['config'] ?? null;
            abort_unless(is_string($providerValue), 422, 'A repository provider is required.');
            abort_unless(is_array($configValue), 422, 'Repository configuration is required.');
            $provider = IntegrationRepositoryProviderEnum::from($providerValue);

            $integration = new Integration([
                'category' => IntegrationCategoryEnum::REPOSITORY,
                'provider' => $provider,
                'config' => $configValue,
                'is_active' => true,
            ]);
        }

        $provider = $integration->repositoryProvider();
        $config = $this->configHydrator->repository($provider, $integration->config ?? []);

        return response()->json($this->repositoryService->validateCredentials($provider, $config)->toArray());
    }

    public function listRemoteRepositories(Request $request, Integration $integration): JsonResponse
    {
        $this->features()->abortIfIntegrationUnavailable($integration);
        $this->authorizeIntegrationUse($integration);
        $this->ensureCategory($integration, IntegrationCategoryEnum::REPOSITORY);

        $this->autoResolveGithubInstallation($integration);

        $search = $request->string('search')->toString() ?: null;
        $page = $request->integer('page', 1);

        $repos = $this->repositoryService->listRepositories(
            $integration->repositoryProvider(),
            $this->config($integration),
            $search,
            $page,
        );

        return response()->json($repos);
    }

    public function listBranches(Request $request, Integration $integration): JsonResponse
    {
        $this->features()->abortIfIntegrationUnavailable($integration);
        $this->authorizeIntegrationUse($integration);
        $this->ensureCategory($integration, IntegrationCategoryEnum::REPOSITORY);

        $this->autoResolveGithubInstallation($integration);

        $repoFullName = $request->string('repo')->toString();
        abort_unless($repoFullName !== '', 422, 'repo query parameter is required.');

        $branches = $this->repositoryService->listBranches(
            $integration->repositoryProvider(),
            $this->config($integration),
            $repoFullName,
        );

        return response()->json($branches);
    }

    private function authorizeIntegrationUse(Integration $integration): void
    {
        $currentWorkspaceId = $this->workspaceIdFromSession();
        abort_unless($integration->workspace_id === $currentWorkspaceId, 404);
        Gate::authorize(Ability::USE->value, $integration);
    }

    private function ensureCategory(Integration $integration, IntegrationCategoryEnum $category): void
    {
        abort_unless($integration->category === $category, 422);
    }

    private function autoResolveGithubInstallation(Integration $integration): void
    {
        if ($integration->provider !== IntegrationRepositoryProviderEnum::GITHUB) {
            return;
        }

        $config = $this->configHydrator->repository(
            IntegrationRepositoryProviderEnum::GITHUB,
            $integration->config ?? [],
        );
        if (! $config instanceof GithubRepositoryConfig) {
            throw new \LogicException('Expected GitHub repository configuration.');
        }

        if ($config->installationId() !== null) {
            return;
        }

        $installationId = app(GithubDriver::class)->fetchInstallationId($config);

        if ($installationId) {
            $integration->update(['config' => $config->withInstallationId($installationId)->toArray()]);
        }
    }

    private function features(): FeatureFlagService
    {
        return app(FeatureFlagService::class);
    }

    private function config(Integration $integration): RepositoryConfig
    {
        return $this->configHydrator->repository(
            $integration->repositoryProvider(),
            $integration->config ?? [],
        );
    }
}
