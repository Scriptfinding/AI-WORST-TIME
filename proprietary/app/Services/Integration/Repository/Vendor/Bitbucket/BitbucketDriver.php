<?php

namespace App\Services\Integration\Repository\Vendor\Bitbucket;

use App\Contracts\Integration\Repository\RepositoryConfig;
use App\Contracts\Integration\Repository\RepositoryDriverInterface;
use App\DTO\Integration\IntegrationValidationResult;
use App\DTO\Integration\Repository\BitbucketRepositoryConfig;
use App\Enums\Integration\IntegrationRepositoryProviderEnum;
use Illuminate\Support\Facades\Http;

class BitbucketDriver implements RepositoryDriverInterface
{
    private const API_BASE = 'https://api.bitbucket.org/2.0';

    public function supports(IntegrationRepositoryProviderEnum $provider): bool
    {
        return $provider === IntegrationRepositoryProviderEnum::BITBUCKET;
    }

    public function validateCredentials(RepositoryConfig $config): IntegrationValidationResult
    {
        $config = $this->bitbucketConfig($config);
        try {
            $workspace = $this->workspaceName($config);
            $response = $this->request($config)->get(
                $workspace === null
                    ? self::API_BASE.'/repositories'
                    : self::API_BASE.'/repositories/'.rawurlencode($workspace),
                [
                    'role' => 'member',
                    'pagelen' => 1,
                ],
            );

            if ($response->successful()) {
                return IntegrationValidationResult::success(
                    username: $config->username() ?: ($config->email() ?: 'Bitbucket user'),
                );
            }

            return IntegrationValidationResult::failure('Could not access Bitbucket repositories with this token. Check the email, token scopes, and workspace slug.');
        } catch (\Throwable $e) {
            return IntegrationValidationResult::failure($e->getMessage());
        }
    }

    public function listRepositories(RepositoryConfig $config, ?string $search = null, int $page = 1, int $perPage = 30): array
    {
        $config = $this->bitbucketConfig($config);
        $workspace = $this->workspaceName($config);
        /** @var list<array{name: string, uuid?: string, full_name: string, mainbranch?: array{name?: string}, links?: array{html?: array{href?: string}}, is_private?: bool}> $repositories */
        $repositories = $this->fetchPaginated(
            $config,
            $workspace === null
                ? self::API_BASE.'/repositories'
                : self::API_BASE.'/repositories/'.rawurlencode($workspace),
            [
                'role' => 'member',
                'sort' => '-updated_on',
            ],
        );

        if ($search) {
            $query = strtolower($search);
            $repositories = array_filter($repositories, fn (array $repo) => str_contains(strtolower($repo['name']), $query) ||
                str_contains(strtolower($repo['full_name']), $query)
            );
        }

        return array_values(array_map(fn (array $repo) => [
            'id' => (string) ($repo['uuid'] ?? $repo['full_name']),
            'name' => $repo['name'],
            'full_name' => $repo['full_name'],
            'default_branch' => $repo['mainbranch']['name'] ?? 'main',
            'url' => $repo['links']['html']['href'] ?? 'https://bitbucket.org/'.$repo['full_name'],
            'private' => $repo['is_private'] ?? true,
        ], $repositories));
    }

    public function listBranches(RepositoryConfig $config, string $repoFullName): array
    {
        $config = $this->bitbucketConfig($config);
        /** @var list<array{name: string}> $branches */
        $branches = $this->fetchPaginated($config, self::API_BASE.'/repositories/'.$repoFullName.'/refs/branches');

        return array_map(
            fn (array $branch) => $branch['name'],
            $branches,
        );
    }

    public function fetchFile(RepositoryConfig $config, string $repoFullName, string $branch, string $path): ?string
    {
        $config = $this->bitbucketConfig($config);
        $response = $this->request($config)->get(self::API_BASE.'/repositories/'.$repoFullName.'/src/'.rawurlencode($branch).'/'.$this->encodePath($path));

        return $response->successful() ? $response->body() : null;
    }

    private function request(BitbucketRepositoryConfig $config): \Illuminate\Http\Client\PendingRequest
    {
        $username = $config->email() ?: $config->username();
        $token = $config->apiToken();

        if (! $username || ! $token) {
            throw new \RuntimeException('Bitbucket email or username and API token are required.');
        }

        return Http::withBasicAuth($username, $token);
    }

    private function encodePath(string $path): string
    {
        return collect(explode('/', ltrim($path, '/')))
            ->map(fn (string $segment) => rawurlencode($segment))
            ->implode('/');
    }

    /**
     * @param  array<string, scalar|null>  $query
     * @return list<array<string, mixed>>
     */
    private function fetchPaginated(BitbucketRepositoryConfig $config, string $url, array $query = []): array
    {
        $items = [];
        $nextUrl = $url;
        $nextQuery = array_merge(['pagelen' => 100], $query);

        while ($nextUrl) {
            $response = $this->request($config)->get($nextUrl, $nextQuery);

            if (! $response->successful()) {
                return [];
            }

            /** @var list<array<string, mixed>> $values */
            $values = $response->json('values', []);
            $items = array_merge($items, $values);
            $next = $response->json('next');
            $nextUrl = is_string($next) && $next !== '' ? $next : null;
            $nextQuery = [];
        }

        return $items;
    }

    private function workspaceName(BitbucketRepositoryConfig $config): ?string
    {
        $workspace = trim($config->workspaceName());

        return $workspace !== '' ? $workspace : null;
    }

    private function bitbucketConfig(RepositoryConfig $config): BitbucketRepositoryConfig
    {
        if (! $config instanceof BitbucketRepositoryConfig) {
            throw new \InvalidArgumentException('Bitbucket driver requires Bitbucket repository configuration.');
        }

        return $config;
    }
}
