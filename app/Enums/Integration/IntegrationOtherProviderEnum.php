<?php

namespace App\Enums\Integration;

use App\Contracts\Integration\IntegrationProviderInterface;

enum IntegrationOtherProviderEnum: string implements IntegrationProviderInterface
{
    case MAILBOX = 'mailbox';

    public function category(): IntegrationCategoryEnum
    {
        return IntegrationCategoryEnum::OTHER;
    }

    public function label(): string
    {
        return match ($this) {
            self::MAILBOX => 'Mailbox',
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
