<?php

namespace App\Services\Integration\Repository\Vendor\Gitlab;

use App\Contracts\Integration\Repository\RepositoryConfig;
use App\Contracts\Integration\Repository\RepositoryDriverInterface;
use App\DTO\Integration\IntegrationValidationResult;
use App\DTO\Integration\Repository\GitlabRepositoryConfig;
use App\Enums\Integration\IntegrationRepositoryProviderEnum;
use App\Services\Integration\Http\IntegrationHttpClientFactory;

class GitlabDriver implements RepositoryDriverInterface
{
    public function __construct(
        private readonly IntegrationHttpClientFactory $httpClients,
    ) {}

    public function supports(IntegrationRepositoryProviderEnum $provider): bool
    {
        return $provider === IntegrationRepositoryProviderEnum::GITLAB;
    }

    public function validateCredentials(RepositoryConfig $config): IntegrationValidationResult
    {
        $config = $this->gitlabConfig($config);
        try {
            if ($config->accessToken() === '') {
                $versionResponse = $this->secureRequest($config)->get($this->apiUrl($config, '/version'));

                if ($versionResponse->successful()) {
                    $version = $versionResponse->json('version');

                    return IntegrationValidationResult::success(
                        username: 'GitLab '.(is_scalar($version) ? (string) $version : 'server'),
                    );
                }

                $rootResponse = $this->secureRequest($config)->get($this->apiBaseUrl($config));

                if ($rootResponse->successful()) {
                    return IntegrationValidationResult::success(username: 'GitLab server');
                }

                return IntegrationValidationResult::failure('Could not reach this GitLab server.');
            }

            $response = $this->request($config)->get($this->apiUrl($config, '/user'));

            if ($response->successful()) {
                $username = $response->json('username');
                $name = $response->json('name');

                return IntegrationValidationResult::success(
                    username: is_string($username)
                        ? $username
                        : (is_string($name) ? $name : 'GitLab user'),
                );
            }

            return IntegrationValidationResult::failure('Could not authenticate with GitLab.');
        } catch (\Throwable $e) {
            return IntegrationValidationResult::failure($e->getMessage());
        }
    }

    public function listRepositories(RepositoryConfig $config, ?string $search = null, int $page = 1, int $perPage = 30): array
    {
        $config = $this->gitlabConfig($config);
        $groups = $this->groupNames($config);
        $projects = $this->fetchProjects($config, $search, $perPage);

        if ($groups !== []) {
            $projects = array_filter($projects, fn (array $project) => $this->matchesConfiguredGroup($project, $groups));
        }

        return array_values(array_map(fn (array $project) => [
            'id' => (string) $project['id'],
            'name' => $project['name'],
            'full_name' => $project['path_with_namespace'],
            'default_branch' => $project['default_branch'] ?? 'main',
            'url' => $project['web_url'],
            'private' => ($project['visibility'] ?? 'private') !== 'public',
        ], $projects));
    }

    public function listBranches(RepositoryConfig $config, string $repoFullName): array
    {
        $config = $this->gitlabConfig($config);
        $response = $this->request($config)->get(
            $this->apiUrl($config, '/projects/'.rawurlencode($repoFullName).'/repository/branches'),
            ['per_page' => 100],
        );

        if (! $response->successful()) {
            return [];
        }

        /** @var list<array{name: string}> $branches */
        $branches = $response->json() ?? [];

        return array_map(fn (array $branch) => $branch['name'], $branches);
    }

    public function fetchFile(RepositoryConfig $config, string $repoFullName, string $branch, string $path): ?string
    {
        $config = $this->gitlabConfig($config);
        $response = $this->request($config)->get(
            $this->apiUrl($config, '/projects/'.rawurlencode($repoFullName).'/repository/files/'.rawurlencode($path).'/raw'),
            ['ref' => $branch],
        );

        return $response->successful() ? $response->body() : null;
    }

    /**
     * @return list<array{id: int|string, name: string, path_with_namespace: string, namespace?: array{full_path?: string}, default_branch?: string, web_url: string, visibility?: string}>
     */
    private function fetchProjects(GitlabRepositoryConfig $config, ?string $search, int $perPage): array
    {
        $projects = [];
        $page = 1;

        do {
            $response = $this->request($config)->get($this->apiUrl($config, '/projects'), array_filter([
                'membership' => true,
                'order_by' => 'last_activity_at',
                'sort' => 'desc',
                'search' => $search,
                'page' => $page,
                'per_page' => min(max($perPage, 1), 100),
            ], fn ($value) => $value !== null && $value !== ''));

            if (! $response->successful()) {
                return [];
            }

            /** @var list<array{id: int|string, name: string, path_with_namespace: string, namespace?: array{full_path?: string}, default_branch?: string, web_url: string, visibility?: string}> $items */
            $items = $response->json();
            $projects = array_merge($projects, $items);
            $total = (int) $response->header('X-Total');
            $page++;
        } while (! empty($items) && ($total === 0 || count($projects) < $total));

        return $projects;
    }

    /**
     * @param  array{path_with_namespace: string, namespace?: array{full_path?: string}}  $project
     * @param  list<string>  $groups
     */
    private function matchesConfiguredGroup(array $project, array $groups): bool
    {
        $namespacePath = strtolower($project['namespace']['full_path'] ?? '');
        $projectPath = strtolower($project['path_with_namespace']);

        foreach ($groups as $group) {
            $group = strtolower(trim($group));
            if ($group === '') {
                continue;
            }

            if ($namespacePath === $group || str_starts_with($namespacePath, "{$group}/")) {
                return true;
            }

            if ($projectPath === $group || str_starts_with($projectPath, "{$group}/")) {
                return true;
            }
        }

        return false;
    }

    private function request(GitlabRepositoryConfig $config): \Illuminate\Http\Client\PendingRequest
    {
        $token = $config->accessToken();
        if (! $token) {
            throw new \RuntimeException('GitLab account is not connected yet.');
        }

        return $this->secureRequest($config)->withToken($token);
    }

    private function secureRequest(GitlabRepositoryConfig $config): \Illuminate\Http\Client\PendingRequest
    {
        return $this->httpClients->for($this->apiBaseUrl($config));
    }

    private function apiUrl(GitlabRepositoryConfig $config, string $path): string
    {
        return rtrim($this->apiBaseUrl($config), '/').'/api/v4'.$path;
    }

    private function apiBaseUrl(GitlabRepositoryConfig $config): string
    {
        return rtrim($config->internalUrl() ?: $config->baseUrl(), '/');
    }

    /**
     * @return list<string>
     */
    private function groupNames(GitlabRepositoryConfig $config): array
    {
        return array_values(array_filter(array_map(
            fn (string $group) => trim($group),
            explode(',', $config->groupNames()),
        )));
    }

    private function gitlabConfig(RepositoryConfig $config): GitlabRepositoryConfig
    {
        if (! $config instanceof GitlabRepositoryConfig) {
            throw new \InvalidArgumentException('GitLab driver requires GitLab repository configuration.');
        }

        return $config;
    }
}
