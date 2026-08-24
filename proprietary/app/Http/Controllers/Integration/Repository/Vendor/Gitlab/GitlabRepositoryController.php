<?php

namespace App\Http\Controllers\Integration\Repository\Vendor\Gitlab;

use App\DTO\Integration\Repository\GitlabRepositoryConfig;
use App\Enums\Authorization\Ability;
use App\Enums\Integration\IntegrationCategoryEnum;
use App\Enums\Integration\IntegrationRepositoryProviderEnum;
use App\Http\Controllers\Controller;
use App\Models\Integration;
use App\Services\FeatureFlags\FeatureFlagService;
use App\Services\Integration\Config\IntegrationConfigHydrator;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class GitlabRepositoryController extends Controller
{
    public function redirectToProvider(Request $request, Integration $integration): RedirectResponse
    {
        app(FeatureFlagService::class)->abortIfDisabled('vcs_enabled');
        app(FeatureFlagService::class)->abortIfStale($integration);
        $this->authorizeIntegrationUpdate($integration);
        abort_unless($integration->category === IntegrationCategoryEnum::REPOSITORY, 422);
        abort_unless($integration->provider === IntegrationRepositoryProviderEnum::GITLAB, 422);

        $config = $this->config($integration);
        $state = Str::random(40);

        session([
            'gitlab_oauth_state' => $state,
            'gitlab_oauth_integration_id' => $integration->id,
        ]);

        return redirect()->away(rtrim($config->baseUrl(), '/').'/oauth/authorize?'.http_build_query([
            'client_id' => $config->applicationId(),
            'redirect_uri' => $this->redirectUri($config),
            'response_type' => 'code',
            'scope' => 'read_api read_user read_repository',
            'state' => $state,
        ], '', '&', PHP_QUERY_RFC3986));
    }

    public function callback(Request $request): RedirectResponse
    {
        if ($request->input('error')) {
            return redirect('/integrations')->with('error', $request->input('error_description') ?: 'GitLab authorization was cancelled.');
        }

        $expectedState = session()->pull('gitlab_oauth_state');
        /** @var string|null $integrationId */
        $integrationId = session()->pull('gitlab_oauth_integration_id');

        if (! $expectedState || $expectedState !== $request->input('state') || ! $integrationId) {
            return redirect('/integrations')->with('error', 'GitLab returned an invalid OAuth state.');
        }

        $integration = Integration::where('workspace_id', session('current_workspace_id'))
            ->findOrFail($integrationId);
        app(FeatureFlagService::class)->abortIfDisabled('vcs_enabled');
        app(FeatureFlagService::class)->abortIfStale($integration);
        $this->authorizeIntegrationUpdate($integration);

        $config = $this->config($integration);
        $tokenBaseUrl = rtrim($config->internalUrl() ?: $config->baseUrl(), '/');

        $response = Http::asForm()->post($tokenBaseUrl.'/oauth/token', [
            'client_id' => $config->applicationId(),
            'client_secret' => $config->applicationSecret(),
            'code' => $request->input('code'),
            'grant_type' => 'authorization_code',
            'redirect_uri' => $this->redirectUri($config),
        ]);

        if (! $response->successful()) {
            return redirect('/integrations')->with('error', 'Failed to connect GitLab: the server returned HTTP '.$response->status().'.');
        }

        $data = $response->json();
        /** @var array{access_token?: mixed, refresh_token?: mixed, token_type?: mixed, expires_in?: int|string} $data */
        $integration->update([
            'config' => $config->withOAuthTokens([
                'access_token' => $data['access_token'] ?? null,
                'refresh_token' => $data['refresh_token'] ?? null,
                'token_type' => $data['token_type'] ?? 'Bearer',
                'expires_at' => isset($data['expires_in']) ? now()->addSeconds((int) $data['expires_in'])->toIso8601String() : null,
            ])->toArray(),
        ]);

        return redirect('/integrations')->with('success', 'GitLab connected successfully.');
    }

    private function authorizeIntegrationUpdate(Integration $integration): void
    {
        $currentWorkspaceId = $this->workspaceIdFromSession();
        abort_unless($integration->workspace_id === $currentWorkspaceId, 404);
        Gate::authorize(Ability::UPDATE->value, $integration);
    }

    private function redirectUri(GitlabRepositoryConfig $config): string
    {
        return $config->redirectUri() ?? route('integrations.gitlab.callback');
    }

    private function config(Integration $integration): GitlabRepositoryConfig
    {
        $config = app(IntegrationConfigHydrator::class)->repository(
            IntegrationRepositoryProviderEnum::GITLAB,
            $integration->config ?? [],
        );
        if (! $config instanceof GitlabRepositoryConfig) {
            throw new \LogicException('Expected GitLab repository configuration.');
        }

        return $config;
    }
}
