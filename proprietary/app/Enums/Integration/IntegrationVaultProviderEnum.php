<?php

namespace App\Enums\Integration;

use App\Contracts\Integration\IntegrationProviderInterface;

enum IntegrationVaultProviderEnum: string implements IntegrationProviderInterface
{
    case ONEPASSWORD = 'onepassword';
    case HASHICORP_VAULT = 'hashicorp_vault';
    case AWS_SECRETS_MANAGER = 'aws_secrets_manager';
    case AZURE_KEY_VAULT = 'azure_key_vault';

    public function category(): IntegrationCategoryEnum
    {
        return IntegrationCategoryEnum::VAULT;
    }

    public function label(): string
    {
        return match ($this) {
            self::ONEPASSWORD => '1Password',
            self::HASHICORP_VAULT => 'HashiCorp Vault',
            self::AWS_SECRETS_MANAGER => 'AWS Secrets Manager',
            self::AZURE_KEY_VAULT => 'Azure Key Vault',
        };
    }

    /**
     * @param  array<string, mixed>  $config
     */
    public function resolveStatus(array $config): ?string
    {
        return null;
    }

    /**
     * @param  array<string, mixed>  $config
     */
    public function resolveExternalUrl(array $config): ?string
    {
        return null;
    }
}
