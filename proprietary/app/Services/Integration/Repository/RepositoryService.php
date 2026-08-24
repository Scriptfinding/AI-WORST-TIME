<?php

namespace App\Services\Integration\Repository;

use App\Contracts\Integration\Repository\RepositoryConfig;
use App\Contracts\Integration\Repository\RepositoryDriverInterface;
use App\DTO\Integration\IntegrationValidationResult;
use App\Enums\Integration\IntegrationRepositoryProviderEnum;
use App\Services\Integration\Config\IntegrationConfigHydrator;

class RepositoryService
{
    /** @var RepositoryDriverInterface[] */
    private array $drivers;

    public function __construct(
        private readonly IntegrationConfigHydrator $configHydrator,
        RepositoryDriverInterface ...$drivers,
    ) {
        $this->drivers = $drivers;
    }

    public function driver(IntegrationRepositoryProviderEnum $provider): RepositoryDriverInterface
    {
        foreach ($this->drivers as $driver) {
            if ($driver->supports($provider)) {
                return $driver;
            }
        }

        throw new \InvalidArgumentException("No repository driver supports provider: {$provider->value}");
    }

    /** @param RepositoryConfig|array<string, mixed> $config */
    public function validateCredentials(IntegrationRepositoryProviderEnum $provider, RepositoryConfig|array $config): IntegrationValidationResult
    {
        return $this->driver($provider)->validateCredentials($this->config($provider, $config));
    }

    /**
     * @param  RepositoryConfig|array<string, mixed>  $config
     * @return array<int, array{id: string, name: string, full_name: string, default_branch: string, url: string, private: bool}>
     */
    public function listRepositories(IntegrationRepositoryProviderEnum $provider, RepositoryConfig|array $config, ?string $search = null, int $page = 1): array
    {
        return $this->driver($provider)->listRepositories($this->config($provider, $config), $search, $page);
    }

    /**
     * @param  RepositoryConfig|array<string, mixed>  $config
     * @return array<int, string>
     */
    public function listBranches(IntegrationRepositoryProviderEnum $provider, RepositoryConfig|array $config, string $repoFullName): array
    {
        return $this->driver($provider)->listBranches($this->config($provider, $config), $repoFullName);
    }

    /** @param RepositoryConfig|array<string, mixed> $config */
    public function fetchFile(IntegrationRepositoryProviderEnum $provider, RepositoryConfig|array $config, string $repoFullName, string $branch, string $path): ?string
    {
        return $this->driver($provider)->fetchFile($this->config($provider, $config), $repoFullName, $branch, $path);
    }

    /** @param RepositoryConfig|array<string, mixed> $config */
    private function config(IntegrationRepositoryProviderEnum $provider, RepositoryConfig|array $config): RepositoryConfig
    {
        return $config instanceof RepositoryConfig
            ? $config
            : $this->configHydrator->repository($provider, $config);
    }
}
