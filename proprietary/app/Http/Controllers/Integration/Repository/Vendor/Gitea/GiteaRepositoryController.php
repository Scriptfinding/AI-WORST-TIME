<?php

namespace App\Http\Controllers\Integration\Repository\Vendor\Gitea;

use App\DTO\Integration\Repository\GiteaRepositoryConfig;
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

class GiteaRepositoryController extends Controller
{
    public function redirectToProvider(Request $request, Integration $integration): RedirectResponse
    {
        app(FeatureFlagService::class)->abortIfDisabled('vcs_enabled');
        app(FeatureFlagService::class)->abortIfStale($integration);
        $this->authorizeIntegrationUpdate($integration);
        abort_unless($integration->category === IntegrationCategoryEnum::REPOSITORY, 422);
        abort_unless($integration->provider === IntegrationRepositoryProviderEnum::GITEA, 422);

        $config = $this->config($integration);
        $state = Str::random(40);

        session([
            'gitea_oauth_state' => $state,
            'gitea_oauth_integration_id' => $integration->id,
        ]);

        return redirect()->away(rtrim($config->baseUrl(), '/').'/login/oauth/authorize?'.http_build_query([
            'client_id' => $config->clientId(),
            'redirect_uri' => $this->redirectUri($config),
            'response_type' => 'code',
            'state' => $state,
        ], '', '&', PHP_QUERY_RFC3986));
    }

    public function callback(Request $request): RedirectResponse
    {
        if ($request->input('error')) {
            return redirect('/integrations')->with('error', $request->input('error_description') ?: 'Gitea authorization was cancelled.');
        }

        $expectedState = session()->pull('gitea_oauth_state');
        /** @var string|null $integrationId */
        $integrationId = session()->pull('gitea_oauth_integration_id');

        if (! $expectedState || $expectedState !== $request->input('state') || ! $integrationId) {
            return redirect('/integrations')->with('error', 'Gitea returned an invalid OAuth state.');
        }

        $integration = Integration::where('workspace_id', session('current_workspace_id'))
            ->findOrFail($integrationId);
        app(FeatureFlagService::class)->abortIfDisabled('vcs_enabled');
        app(FeatureFlagService::class)->abortIfStale($integration);
        $this->authorizeIntegrationUpdate($integration);

        $config = $this->config($integration);
        $tokenBaseUrl = rtrim($config->internalUrl() ?: $config->baseUrl(), '/');

        $response = Http::asForm()->post($tokenBaseUrl.'/login/oauth/access_token', [
            'client_id' => $config->clientId(),
            'client_secret' => $config->clientSecret(),
            'code' => $request->input('code'),
            'grant_type' => 'authorization_code',
            'redirect_uri' => $this->redirectUri($config),
        ]);

        if (! $response->successful()) {
            return redirect('/integrations')->with('error', 'Failed to connect Gitea: the server returned HTTP '.$response->status().'.');
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

        return redirect('/integrations')->with('success', 'Gitea connected successfully.');
    }

    private function authorizeIntegrationUpdate(Integration $integration): void
    {
        $currentWorkspaceId = $this->workspaceIdFromSession();
        abort_unless($integration->workspace_id === $currentWorkspaceId, 404);
        Gate::authorize(Ability::UPDATE->value, $integration);
    }

    private function redirectUri(GiteaRepositoryConfig $config): string
    {
        return $config->redirectUri() ?? route('integrations.gitea.callback');
    }

    private function config(Integration $integration): GiteaRepositoryConfig
    {
        $config = app(IntegrationConfigHydrator::class)->repository(
            IntegrationRepositoryProviderEnum::GITEA,
            $integration->config ?? [],
        );
        if (! $config instanceof GiteaRepositoryConfig) {
            throw new \LogicException('Expected Gitea repository configuration.');
        }

        return $config;
    }
}
