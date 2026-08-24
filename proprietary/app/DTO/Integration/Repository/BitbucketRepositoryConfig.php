<?php

namespace App\DTO\Integration\Repository;

use App\Contracts\Integration\Repository\RepositoryConfig;
use App\DTO\Integration\Config\AbstractPersistedIntegrationConfig;

final readonly class BitbucketRepositoryConfig extends AbstractPersistedIntegrationConfig implements RepositoryConfig
{
    /** @param array<string, mixed> $values */
    public static function fromArray(array $values): self
    {
        return new self($values);
    }

    public function email(): string
    {
        return $this->string('email');
    }

    public function username(): string
    {
        return $this->string('username');
    }

    public function apiToken(): string
    {
        return $this->string('api_token');
    }

    public function workspaceName(): string
    {
        return $this->string('workspace_name');
    }
}
