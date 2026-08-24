<?php

namespace App\Enums\Integration;

use App\Contracts\Integration\IntegrationProviderInterface;

enum IntegrationAiProviderEnum: string implements IntegrationProviderInterface
{
    case OPENAI = 'openai';
    case GEMINI = 'gemini';
    case ANTHROPIC = 'anthropic';
    case MISTRAL = 'mistral';

    public function category(): IntegrationCategoryEnum
    {
        return IntegrationCategoryEnum::AI;
    }

    public function label(): string
    {
        return match ($this) {
            self::OPENAI => 'OpenAI',
            self::GEMINI => 'Gemini',
            self::ANTHROPIC => 'Claude',
            self::MISTRAL => 'Mistral',
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
