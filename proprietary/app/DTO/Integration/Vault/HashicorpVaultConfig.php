<?php

namespace App\DTO\Integration\Vault;

use App\DTO\Integration\Config\AbstractPersistedIntegrationConfig;

final readonly class HashicorpVaultConfig extends AbstractPersistedIntegrationConfig implements VaultConfig
{
    /** @param array<string, mixed> $values */
    public static function fromArray(array $values): self
    {
        return new self($values);
    }

    public function serverUrl(): string
    {
        return $this->string('server_url');
    }

    public function token(): string
    {
        return $this->string('token');
    }

    public function namespace(): string
    {
        return $this->string('namespace');
    }

    public function mount(): string
    {
        return $this->string('mount');
    }
}
