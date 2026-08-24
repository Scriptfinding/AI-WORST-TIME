<?php

namespace App\DTO\Integration\Vault;

use App\DTO\Integration\Config\AbstractPersistedIntegrationConfig;

final readonly class AzureKeyVaultConfig extends AbstractPersistedIntegrationConfig implements VaultConfig
{
    /** @param array<string, mixed> $values */
    public static function fromArray(array $values): self
    {
        return new self($values);
    }

    public function vaultUrl(): string
    {
        return $this->string('vault_url');
    }

    public function tenantId(): string
    {
        return $this->string('tenant_id');
    }

    public function clientId(): string
    {
        return $this->string('client_id');
    }

    public function clientSecret(): string
    {
        return $this->string('client_secret');
    }
}
