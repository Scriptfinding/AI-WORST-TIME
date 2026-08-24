<?php

namespace App\Services\Integration\Repository\Vendor\Github;

use App\Contracts\Integration\Repository\RepositoryConfig;
use App\Contracts\Integration\Repository\RepositoryDriverInterface;
use App\DTO\Integration\IntegrationValidationResult;
use App\DTO\Integration\Repository\GithubRepositoryConfig;
use App\Enums\Integration\IntegrationRepositoryProviderEnum;
use Firebase\JWT\JWT;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class GithubDriver implements RepositoryDriverInterface
{
    public function supports(IntegrationRepositoryProviderEnum $provider): bool
    {
        return $provider === IntegrationRepositoryProviderEnum::GITHUB;
    }

    public function validateCredentials(RepositoryConfig $config): IntegrationValidationResult
    {
        $config = $this->githubConfig($config);
        try {
            $token = $this->getInstallationToken($config);

            $response = Http::withToken($token)
                ->get('https://api.github.com/installation/repositories', ['per_page' => 1]);

            if ($response->successful()) {
                return IntegrationValidationResult::success(username: 'GitHub App #'.($config->appId() ?? '?'));
            }

            return IntegrationValidationResult::failure('Could not authenticate with GitHub.');
        } catch (\Throwable $e) {
            return IntegrationValidationResult::failure($e->getMessage());
        }
    }

    public function listRepositories(RepositoryConfig $config, ?string $search = null, int $page = 1, int $perPage = 30): array
    {
        $config = $this->githubConfig($config);
        $token = $this->getInstallationToken($config);

        $items = [];
        $currentPage = 1;

        do {
            $response = Http::withToken($token)
                ->get('https://api.github.com/installation/repositories', [
                    'per_page' => 100,
                    'page' => $currentPage,
                ]);

            /** @var list<array{id: int|string, name: string, full_name: string, pushed_at?: string, default_branch?: string, html_url: string, private?: bool}> $repos */
            $repos = $response->json('repositories', []);
            $items = array_merge($items, $repos);
            $rawTotalCount = $response->json('total_count', 0);
            $totalCount = is_int($rawTotalCount) ? $rawTotalCount : 0;
            $currentPage++;
        } while (count($items) < $totalCount && ! empty($repos));

        usort($items, fn (array $a, array $b) => strcmp($b['pushed_at'] ?? '', $a['pushed_at'] ?? ''));

        if ($search) {
            $q = strtolower($search);
            $items = array_filter($items, fn (array $repo) => str_contains(strtolower($repo['name']), $q) ||
                str_contains(strtolower($repo['full_name']), $q)
            );
        }

        return array_values(array_map(fn (array $repo) => [
            'id' => (string) $repo['id'],
            'name' => $repo['name'],
            'full_name' => $repo['full_name'],
            'default_branch' => $repo['default_branch'] ?? 'main',
            'url' => $repo['html_url'],
            'private' => $repo['private'] ?? false,
        ], $items));
    }

    public function listBranches(RepositoryConfig $config, string $repoFullName): array
    {
        $config = $this->githubConfig($config);
        $token = $this->getInstallationToken($config);

        $response = Http::withToken($token)
            ->get("https://api.github.com/repos/{$repoFullName}/branches", [
                'per_page' => 100,
            ]);

        /** @var list<array{name: string}> $branches */
        $branches = $response->json() ?? [];

        return array_map(fn (array $branch) => $branch['name'], $branches);
    }

    public function fetchFile(RepositoryConfig $config, string $repoFullName, string $branch, string $path): ?string
    {
        $config = $this->githubConfig($config);
        $token = $this->getInstallationToken($config);

        $response = Http::withToken($token)
            ->withHeaders(['Accept' => 'application/vnd.github.v3.raw'])
            ->get("https://api.github.com/repos/{$repoFullName}/contents/{$path}", [
                'ref' => $branch,
            ]);

        return $response->successful() ? $response->body() : null;
    }

    public function fetchInstallationId(GithubRepositoryConfig $config): ?string
    {
        $jwt = $this->generateJwt($config);

        $response = Http::withHeaders([
            'Authorization' => "Bearer {$jwt}",
            'Accept' => 'application/vnd.github+json',
        ])->get('https://api.github.com/app/installations');

        if (! $response->successful() || empty($response->json())) {
            return null;
        }

        /** @var non-empty-list<array{id: int|string}> $installations */
        $installations = $response->json();

        return (string) $installations[0]['id'];
    }

    private function getInstallationToken(GithubRepositoryConfig $config): string
    {
        $installationId = $config->installationId();

        if (! $installationId) {
            throw new \RuntimeException('GitHub App installation ID is missing. The app may not be installed yet.');
        }

        $cacheKey = "github_inst_token_{$installationId}";

        return Cache::remember($cacheKey, 3000, function () use ($config, $installationId) {
            $jwt = $this->generateJwt($config);

            $response = Http::withHeaders([
                'Authorization' => "Bearer {$jwt}",
                'Accept' => 'application/vnd.github+json',
            ])->post("https://api.github.com/app/installations/{$installationId}/access_tokens");

            if (! $response->successful()) {
                throw new \RuntimeException('Failed to get installation token: '.$response->body());
            }

            $token = $response->json('token');
            if (! is_string($token) || $token === '') {
                throw new \RuntimeException('GitHub returned an invalid installation token.');
            }

            return $token;
        });
    }

    private function generateJwt(GithubRepositoryConfig $config): string
    {
        $now = time();

        return JWT::encode([
            'iat' => $now - 60,
            'exp' => $now + (10 * 60),
            'iss' => $config->appId() ?? '',
        ], $config->pem(), 'RS256');
    }

    private function githubConfig(RepositoryConfig $config): GithubRepositoryConfig
    {
        if (! $config instanceof GithubRepositoryConfig) {
            throw new \InvalidArgumentException('GitHub driver requires GitHub repository configuration.');
        }

        return $config;
    }
}
