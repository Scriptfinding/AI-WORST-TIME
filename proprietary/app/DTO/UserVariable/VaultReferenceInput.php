<?php

namespace App\DTO\UserVariable;

use Illuminate\Validation\ValidationException;

final readonly class VaultReferenceInput
{
    private function __construct(
        public string $integrationId,
        public string $provider,
        public string $vaultId,
        public string $itemId,
        public string $fieldLabel,
    ) {}

    /**
     * @param  array<string, mixed>  $validated
     */
    public static function fromValidated(array $validated, ?string $fallbackIntegrationId = null): self
    {
        return new self(
            integrationId: self::requiredString(
                $validated['vault_integration_id'] ?? $fallbackIntegrationId,
                'vault_integration_id',
                'A vault integration must be selected.',
            ),
            provider: self::requiredString(
                $validated['vault_provider'] ?? null,
                'vault_provider',
                'A vault provider is required.',
            ),
            vaultId: self::requiredString(
                $validated['vault_vault_id'] ?? null,
                'vault_vault_id',
                'A vault must be selected.',
            ),
            itemId: self::requiredString(
                $validated['vault_item_id'] ?? null,
                'vault_item_id',
                'A vault item must be selected.',
            ),
            fieldLabel: self::requiredString(
                $validated['vault_field_label'] ?? null,
                'vault_field_label',
                'A vault field must be selected.',
            ),
        );
    }

    public function toReference(): string
    {
        return sprintf(
            '%s://%s/%s/%s',
            $this->provider,
            rawurlencode($this->vaultId),
            rawurlencode($this->itemId),
            rawurlencode($this->fieldLabel),
        );
    }

    private static function requiredString(mixed $value, string $field, string $message): string
    {
        if (! is_string($value) || $value === '') {
            throw ValidationException::withMessages([$field => $message]);
        }

        return $value;
    }
}
