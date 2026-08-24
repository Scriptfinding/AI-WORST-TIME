<?php

namespace App\Services\Integration\Repository\Vendor\Gitea;

use App\Contracts\Integration\Repository\RepositoryConfig;
use App\Contracts\Integration\Repository\RepositoryDriverInterface;
use App\DTO\Integration\IntegrationValidationResult;
use App\DTO\Integration\Repository\GiteaRepositoryConfig;
use App\Enums\Integration\IntegrationRepositoryProviderEnum;
use App\Services\Integration\Http\IntegrationHttpClientFactory;

class GiteaDriver implements RepositoryDriverInterface
{
    public function __construct(
        private readonly IntegrationHttpClientFactory $httpClients,
    ) {}

    public function supports(IntegrationRepositoryProviderEnum $provider): bool
    {
        return $provider === IntegrationRepositoryProviderEnum::GITEA;
    }

    public function validateCredentials(RepositoryConfig $config): IntegrationValidationResult
    {
        $config = $this->giteaConfig($config);
        try {
            if ($config->accessToken() === '') {
                $response = $this->secureRequest($config)->get($this->apiUrl($config, '/version'));

                if ($response->successful()) {
                    $version = $response->json('version');

                    return IntegrationValidationResult::success(
                        username: 'Gitea '.(is_scalar($version) ? (string) $version : 'server'),
                    );
                }

                return IntegrationValidationResult::failure('Could not reach this Gitea server.');
            }

            $response = $this->request($config)->get($this->apiUrl($config, '/user'));

            if ($response->successful()) {
                $login = $response->json('login');
                $username = $response->json('username');

                return IntegrationValidationResult::success(
                    username: is_string($login)
                        ? $login
                        : (is_string($username) ? $username : 'Gitea user'),
                );
            }

            return IntegrationValidationResult::failure('Could not authenticate with Gitea.');
        } catch (\Throwable $e) {
            return IntegrationValidationResult::failure($e->getMessage());
        }
    }

    public function listRepositories(RepositoryConfig $config, ?string $search = null, int $page = 1, int $perPage = 30): array
    {
        $config = $this->giteaConfig($config);
        $repositories = $this->fetchPaginated($config, '/user/repos', [
            'page' => 1,
            'limit' => min(max($perPage, 1), 50),
        ]);

        if ($search) {
            $query = strtolower($search);
            $repositories = array_filter($repositories, fn (array $repo) => str_contains(strtolower($repo['name']), $query) ||
                str_contains(strtolower($repo['full_name']), $query)
            );
        }

        return array_values(array_map(fn (array $repo) => [
            'id' => (string) $repo['id'],
            'name' => $repo['name'],
            'full_name' => $repo['full_name'],
            'default_branch' => $repo['default_branch'] ?? 'main',
            'url' => $repo['html_url'],
            'private' => $repo['private'] ?? true,
        ], $repositories));
    }

    public function listBranches(RepositoryConfig $config, string $repoFullName): array
    {
        $config = $this->giteaConfig($config);
        $response = $this->request($config)->get($this->apiUrl($config, '/repos/'.$repoFullName.'/branches'), [
            'limit' => 100,
        ]);

        if (! $response->successful()) {
            return [];
        }

        /** @var list<array{name: string}> $branches */
        $branches = $response->json() ?? [];

        return array_map(fn (array $branch) => $branch['name'], $branches);
    }

    public function fetchFile(RepositoryConfig $config, string $repoFullName, string $branch, string $path): ?string
    {
        $config = $this->giteaConfig($config);
        $response = $this->request($config)->get(
            $this->apiUrl($config, '/repos/'.$repoFullName.'/raw/'.$this->encodePath($path)),
            ['ref' => $branch],
        );

        return $response->successful() ? $response->body() : null;
    }

    private function request(GiteaRepositoryConfig $config): \Illuminate\Http\Client\PendingRequest
    {
        $token = $config->accessToken();
        if (! $token) {
            throw new \RuntimeException('Gitea account is not connected yet.');
        }

        return $this->secureRequest($config)->withToken($token);
    }

    private function secureRequest(GiteaRepositoryConfig $config): \Illuminate\Http\Client\PendingRequest
    {
        return $this->httpClients->for($this->apiBaseUrl($config));
    }

    private function apiUrl(GiteaRepositoryConfig $config, string $path): string
    {
        return rtrim($this->apiBaseUrl($config), '/').'/api/v1'.$path;
    }

    private function apiBaseUrl(GiteaRepositoryConfig $config): string
    {
        return rtrim($config->internalUrl() ?: $config->baseUrl(), '/');
    }

    /**
     * @param  array{page?: int, limit?: int}  $query
     * @return list<array{id: int|string, name: string, full_name: string, default_branch?: string, html_url: string, private?: bool}>
     */
    private function fetchPaginated(GiteaRepositoryConfig $config, string $path, array $query): array
    {
        $items = [];
        $page = (int) ($query['page'] ?? 1);
        $limit = (int) ($query['limit'] ?? 50);

        do {
            $response = $this->request($config)->get($this->apiUrl($config, $path), array_merge($query, [
                'page' => $page,
                'limit' => $limit,
            ]));

            if (! $response->successful()) {
                return [];
            }

            /** @var list<array{id: int|string, name: string, full_name: string, default_branch?: string, html_url: string, private?: bool}> $pageItems */
            $pageItems = $response->json() ?? [];
            $items = array_merge($items, $pageItems);
            $page++;
        } while (count($pageItems) === $limit);

        return $items;
    }

    private function encodePath(string $path): string
    {
        return collect(explode('/', ltrim($path, '/')))
            ->map(fn (string $segment) => rawurlencode($segment))
            ->implode('/');
    }

    private function giteaConfig(RepositoryConfig $config): GiteaRepositoryConfig
    {
        if (! $config instanceof GiteaRepositoryConfig) {
            throw new \InvalidArgumentException('Gitea driver requires Gitea repository configuration.');
        }

        return $config;
    }
}
