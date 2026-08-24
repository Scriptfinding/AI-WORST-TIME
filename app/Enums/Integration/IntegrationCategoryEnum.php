<?php

namespace App\Enums\Integration;

use App\Contracts\Integration\IntegrationProviderInterface;

enum IntegrationCategoryEnum: string
{
    case AI = 'ai';
    case REPOSITORY = 'repository';
    case VAULT = 'vault';
    case MESSENGER = 'messenger';
    case OTHER = 'other';

    public function resolveProvider(string $value): IntegrationProviderInterface
    {
        return match ($this) {
            self::AI => IntegrationAiProviderEnum::from($value),
            self::REPOSITORY => IntegrationRepositoryProviderEnum::from($value),
            self::VAULT => IntegrationVaultProviderEnum::from($value),
            self::MESSENGER => IntegrationMessengerProviderEnum::from($value),
            self::OTHER => IntegrationOtherProviderEnum::from($value),
        };
    }

    /** @return list<string> */
    public function providerValues(): array
    {
        return match ($this) {
            self::AI => array_column(IntegrationAiProviderEnum::cases(), 'value'),
            self::REPOSITORY => array_column(IntegrationRepositoryProviderEnum::cases(), 'value'),
            self::VAULT => array_column(IntegrationVaultProviderEnum::cases(), 'value'),
            self::MESSENGER => array_column(IntegrationMessengerProviderEnum::cases(), 'value'),
            self::OTHER => array_column(IntegrationOtherProviderEnum::cases(), 'value'),
        };
    }
}
