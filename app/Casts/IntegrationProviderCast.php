<?php

namespace App\Casts;

use App\Contracts\Integration\IntegrationProviderInterface;
use App\Enums\Integration\IntegrationAiProviderEnum;
use App\Enums\Integration\IntegrationMessengerProviderEnum;
use App\Enums\Integration\IntegrationOtherProviderEnum;
use App\Enums\Integration\IntegrationRepositoryProviderEnum;
use App\Enums\Integration\IntegrationVaultProviderEnum;
use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;

/**
 * @implements CastsAttributes<IntegrationProviderInterface|null, \BackedEnum|string|null>
 */
class IntegrationProviderCast implements CastsAttributes
{
    public function get(Model $model, string $key, mixed $value, array $attributes): ?IntegrationProviderInterface
    {
        if ($value === null) {
            return null;
        }

        if (! is_int($value) && ! is_string($value)) {
            throw new \TypeError('Integration provider value must be an integer, string, or null.');
        }

        return IntegrationAiProviderEnum::tryFrom($value)
            ?? IntegrationRepositoryProviderEnum::tryFrom($value)
            ?? IntegrationVaultProviderEnum::tryFrom($value)
            ?? IntegrationMessengerProviderEnum::tryFrom($value)
            ?? IntegrationOtherProviderEnum::tryFrom($value);
    }

    public function set(Model $model, string $key, mixed $value, array $attributes): int|string|null
    {
        if ($value instanceof \BackedEnum) {
            return $value->value;
        }

        return $value;
    }
}
