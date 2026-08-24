<?php

namespace App\DTO\Integration\Vault;

use App\DTO\Integration\Config\AbstractPersistedIntegrationConfig;

final readonly class AwsSecretsManagerConfig extends AbstractPersistedIntegrationConfig implements VaultConfig
{
    /** @param array<string, mixed> $values */
    public static function fromArray(array $values): self
    {
        return new self($values);
    }

    public function region(): string
    {
        return $this->string('region');
    }

    public function accessKeyId(): string
    {
        return $this->string('access_key_id');
    }

    public function secretAccessKey(): string
    {
        return $this->string('secret_access_key');
    }

    public function sessionToken(): string
    {
        return $this->string('session_token');
    }
}
