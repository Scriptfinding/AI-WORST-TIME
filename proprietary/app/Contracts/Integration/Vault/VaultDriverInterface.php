<?php

namespace App\Contracts\Integration\Vault;

use App\DTO\Integration\IntegrationValidationResult;
use App\DTO\Integration\Vault\VaultConfig;
use App\Enums\Integration\IntegrationVaultProviderEnum;

interface VaultDriverInterface
{
    public function supports(IntegrationVaultProviderEnum $provider): bool;

    public function validateCredentials(VaultConfig $config): IntegrationValidationResult;

    /**
     * @return array<int, array{id: string, name: string}>
     */
    public function listVaults(VaultConfig $config): array;

    /**
     * @return array<int, array{id: string, title: string, category: string}>
     */
    public function listItems(VaultConfig $config, string $vaultId): array;

    /**
     * @return array<int, array{id: string, label: string, type: string}>
     */
    public function listItemFields(VaultConfig $config, string $vaultId, string $itemId): array;

    public function getSecret(VaultConfig $config, string $vaultId, string $itemId, string $fieldLabel, bool $raw = false): ?string;
}
