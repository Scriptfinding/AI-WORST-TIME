<?php

namespace App\Services\Integration\Repository\Vendor\Github;

use App\DTO\Integration\Repository\GithubRepositoryConfig;
use Firebase\JWT\JWT;
use Illuminate\Support\Facades\Http;

class GithubRepositoryService
{
    /**
     * @return array{name: string, url: string, hook_attributes: array{url: string}, redirect_url: string, callback_urls: list<string>, public: false, default_permissions: array{contents: string}, default_events: list<string>}
     */
    public function buildManifest(string $webhookId): array
    {
        $configuredUrl = config('app.url');
        $appUrl = rtrim(is_string($configuredUrl) ? $configuredUrl : '', '/');
        $configuredName = config('app.name', 'Puppetflow');

        return [
            'name' => (is_string($configuredName) ? $configuredName : 'Puppetflow').'-'.bin2hex(random_bytes(3)),
            'url' => $appUrl,
            'hook_attributes' => [
                'url' => $this->webhookUrl($webhookId),
            ],
            'redirect_url' => $appUrl.'/integrations/github/callback',
            'callback_urls' => [
                $appUrl.'/integrations/github/callback',
            ],
            'public' => false,
            'default_permissions' => [
                'contents' => 'read',
            ],
            'default_events' => ['push'],
        ];
    }

    /**
     * Exchange the temporary manifest code for GitHub App credentials.
     *
     * @throws \RuntimeException
     */
    /** @return array<string, mixed> */
    public function exchangeCode(string $code): array
    {
        $response = Http::withHeaders([
            'Accept' => 'application/vnd.github+json',
        ])->withBody('', 'application/json')
            ->post("https://api.github.com/app-manifests/{$code}/conversions");

        if (! $response->successful()) {
            throw new \RuntimeException('Failed to create GitHub App: '.$response->body());
        }

        $data = $response->json();
        if (! is_array($data)) {
            throw new \RuntimeException('GitHub returned an invalid app manifest response.');
        }

        /** @var array<string, mixed> $data */
        return $data;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function extractConfig(array $data): GithubRepositoryConfig
    {
        $appId = $data['id'] ?? null;
        $pem = $data['pem'] ?? null;
        if ((! is_int($appId) && ! is_string($appId)) || ! is_string($pem)) {
            throw new \RuntimeException('GitHub returned invalid app credentials.');
        }

        return GithubRepositoryConfig::fromArray([
            'app_id' => $appId,
            'slug' => is_string($data['slug'] ?? null)
                ? $data['slug']
                : (is_string($data['name'] ?? null) ? $data['name'] : ''),
            'pem' => $pem,
            'client_id' => is_string($data['client_id'] ?? null) ? $data['client_id'] : '',
            'client_secret' => is_string($data['client_secret'] ?? null) ? $data['client_secret'] : '',
            'webhook_secret' => is_string($data['webhook_secret'] ?? null) ? $data['webhook_secret'] : '',
        ]);
    }

    public function configureSetupUrl(
        GithubRepositoryConfig $config,
        string $integrationId,
        string $webhookId,
    ): void {
        $configuredUrl = config('app.url');
        $appUrl = rtrim(is_string($configuredUrl) ? $configuredUrl : '', '/');
        $jwt = $this->generateAppJwt($config->appId() ?? '', $config->pem());

        Http::withHeaders([
            'Authorization' => "Bearer {$jwt}",
            'Accept' => 'application/vnd.github+json',
        ])->patch('https://api.github.com/app/hook/config', [
            'url' => $this->webhookUrl($webhookId),
            'content_type' => 'json',
        ]);

        Http::withHeaders([
            'Authorization' => "Bearer {$jwt}",
            'Accept' => 'application/vnd.github+json',
        ])->patch('https://api.github.com/app', [
            'setup_url' => $appUrl.'/integrations/github/setup?integration_id='.$integrationId,
            'setup_on_update' => true,
        ]);
    }

    private function generateAppJwt(string|int $appId, string $pem): string
    {
        $now = time();

        return JWT::encode([
            'iat' => $now - 60,
            'exp' => $now + (10 * 60),
            'iss' => (string) $appId,
        ], $pem, 'RS256');
    }

    public function installUrl(string $slug): string
    {
        return "https://github.com/apps/{$slug}/installations/new";
    }

    private function webhookUrl(string $webhookId): string
    {
        $configuredUrl = config('app.url');
        $appUrl = rtrim(is_string($configuredUrl) ? $configuredUrl : '', '/');

        return "{$appUrl}/api/webhooks/github/{$webhookId}";
    }
}
