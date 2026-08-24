<?php

namespace App\Contracts\Integration\Repository;

use App\DTO\Integration\IntegrationValidationResult;
use App\Enums\Integration\IntegrationRepositoryProviderEnum;

interface RepositoryDriverInterface
{
    public function supports(IntegrationRepositoryProviderEnum $provider): bool;

    public function validateCredentials(RepositoryConfig $config): IntegrationValidationResult;

    /**
     * @return array<int, array{id: string, name: string, full_name: string, default_branch: string, url: string, private: bool}>
     */
    public function listRepositories(RepositoryConfig $config, ?string $search = null, int $page = 1, int $perPage = 30): array;

    /** @return array<int, string> */
    public function listBranches(RepositoryConfig $config, string $repoFullName): array;

    public function fetchFile(RepositoryConfig $config, string $repoFullName, string $branch, string $path): ?string;
}
