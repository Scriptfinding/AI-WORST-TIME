<?php

namespace App\DTO\Integration\Config;

use App\Contracts\Integration\Config\PersistedIntegrationConfig;

abstract readonly class AbstractPersistedIntegrationConfig implements PersistedIntegrationConfig
{
    /** @param array<string, mixed> $values */
    final protected function __construct(
        private array $values,
    ) {}

    /** @return array<string, mixed> */
    final public function toArray(): array
    {
        return $this->values;
    }

    final protected function string(string $key, string $default = ''): string
    {
        $value = $this->values[$key] ?? null;

        return is_scalar($value) ? (string) $value : $default;
    }

    final protected function nullableString(string $key): ?string
    {
        $value = $this->values[$key] ?? null;

        return is_scalar($value) ? (string) $value : null;
    }

    final protected function intOrString(string $key): int|string|null
    {
        $value = $this->values[$key] ?? null;

        return is_int($value) || is_string($value) ? $value : null;
    }

    /** @return array<string, mixed> */
    final protected function replacing(string $key, mixed $value): array
    {
        return array_replace($this->values, [$key => $value]);
    }

    /** @param array<string, mixed> $values
     * @return array<string, mixed>
     */
    final protected function merging(array $values): array
    {
        return array_replace($this->values, $values);
    }
}
