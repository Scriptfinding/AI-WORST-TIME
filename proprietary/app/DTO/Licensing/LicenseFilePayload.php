<?php

namespace App\DTO\Licensing;

use App\Support\Licensing\LicenseFeatureFlags;

final readonly class LicenseFilePayload
{
    /**
     * @param  array<string, bool|int|string>  $featureFlags
     */
    private function __construct(
        public string $type,
        public int $version,
        public ?string $issuedAt,
        public ?string $licenseId,
        public ?string $customerId,
        public ?string $plan,
        public ?string $reference,
        public ?int $gracePeriodHours,
        public bool $staticFileChecksumEnabled,
        public array $featureFlags,
    ) {}

    /**
     * @param  array<string, mixed>  $payload
     */
    public static function fromArray(array $payload): self
    {
        $featureFlags = $payload['feature_flags'] ?? [];
        $gracePeriodHours = $payload['grace_period_hours'] ?? null;

        return new self(
            type: is_string($payload['type'] ?? null) ? $payload['type'] : '',
            version: is_int($payload['version'] ?? null)
                ? $payload['version']
                : (is_numeric($payload['version'] ?? null) ? (int) $payload['version'] : 0),
            issuedAt: self::stringOrNull($payload['issued_at'] ?? null),
            licenseId: self::stringOrNull($payload['license_id'] ?? null),
            customerId: self::stringOrNull($payload['customer_id'] ?? null),
            plan: self::stringOrNull($payload['plan'] ?? null),
            reference: self::stringOrNull($payload['reference'] ?? null),
            gracePeriodHours: is_int($gracePeriodHours)
                ? $gracePeriodHours
                : (is_numeric($gracePeriodHours) ? (int) $gracePeriodHours : null),
            staticFileChecksumEnabled: ($payload['sfc_enabled'] ?? false) === true,
            featureFlags: LicenseFeatureFlags::normalize(is_array($featureFlags) ? $featureFlags : []),
        );
    }

    /**
     * @return array{
     *     type: string,
     *     version: int,
     *     issued_at: string|null,
     *     license_id: string|null,
     *     customer_id: string|null,
     *     plan: string|null,
     *     reference: string|null,
     *     grace_period_hours: int|null,
     *     sfc_enabled: bool,
     *     feature_flags: array<string, bool|int|string>
     * }
     */
    public function toArray(): array
    {
        return [
            'type' => $this->type,
            'version' => $this->version,
            'issued_at' => $this->issuedAt,
            'license_id' => $this->licenseId,
            'customer_id' => $this->customerId,
            'plan' => $this->plan,
            'reference' => $this->reference,
            'grace_period_hours' => $this->gracePeriodHours,
            'sfc_enabled' => $this->staticFileChecksumEnabled,
            'feature_flags' => $this->featureFlags,
        ];
    }

    private static function stringOrNull(mixed $value): ?string
    {
        return is_string($value) ? $value : null;
    }
}
