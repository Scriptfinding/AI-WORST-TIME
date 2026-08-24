<?php

namespace App\Enums\Integration;

use App\Contracts\Integration\IntegrationProviderInterface;

enum IntegrationMessengerProviderEnum: string implements IntegrationProviderInterface
{
    case TELEGRAM = 'telegram';
    case DISCORD = 'discord';
    case SLACK = 'slack';

    public function category(): IntegrationCategoryEnum
    {
        return IntegrationCategoryEnum::MESSENGER;
    }

    public function label(): string
    {
        return match ($this) {
            self::TELEGRAM => 'Telegram',
            self::DISCORD => 'Discord',
            self::SLACK => 'Slack',
        };
    }

    /** @param array<string, mixed> $config */
    public function resolveStatus(array $config): ?string
    {
        return null;
    }

    /** @param array<string, mixed> $config */
    public function resolveExternalUrl(array $config): ?string
    {
        return null;
    }
}
