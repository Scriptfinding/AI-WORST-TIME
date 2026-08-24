<?php

namespace App\DTO\Integration\Repository;

use App\Contracts\Integration\Repository\RepositoryConfig;
use App\DTO\Integration\Config\AbstractPersistedIntegrationConfig;

final readonly class GithubRepositoryConfig extends AbstractPersistedIntegrationConfig implements RepositoryConfig
{
    /** @param array<string, mixed> $values */
    public static function fromArray(array $values): self
    {
        return new self($values);
    }

    public function appId(): int|string|null
    {
        return $this->intOrString('app_id');
    }

    public function slug(): string
    {
        return $this->string('slug');
    }

    public function pem(): string
    {
        return $this->string('pem');
    }

    public function installationId(): int|string|null
    {
        return $this->intOrString('installation_id');
    }

    public function webhookSecret(): string
    {
        return $this->string('webhook_secret');
    }

    public function withInstallationId(int|string $installationId): self
    {
        return new self($this->replacing('installation_id', $installationId));
    }
}
