<?php

namespace App\Services\Integration\Vault;

use App\DTO\Integration\Vault\AwsSecretsManagerConfig;
use App\DTO\Integration\Vault\AzureKeyVaultConfig;
use App\DTO\Integration\Vault\HashicorpVaultConfig;
use App\DTO\Integration\Vault\OnePasswordVaultConfig;
use App\DTO\Integration\Vault\VaultConfig;
use App\Enums\Integration\IntegrationVaultProviderEnum;

final class VaultConfigHydrator
{
    /** @param array<string, mixed> $config */
    public function hydrate(IntegrationVaultProviderEnum $provider, array $config): VaultConfig
    {
        return match ($provider) {
            IntegrationVaultProviderEnum::ONEPASSWORD => OnePasswordVaultConfig::fromArray($config),
            IntegrationVaultProviderEnum::HASHICORP_VAULT => HashicorpVaultConfig::fromArray($config),
            IntegrationVaultProviderEnum::AWS_SECRETS_MANAGER => AwsSecretsManagerConfig::fromArray($config),
            IntegrationVaultProviderEnum::AZURE_KEY_VAULT => AzureKeyVaultConfig::fromArray($config),
        };
    }
}
