<?php

namespace App\DTO\Licensing;

use App\Support\Licensing\LicenseFeatureFlags;

final readonly class LicenseTokenPayload
{
    /**
     * @param  array<string, bool|int|string>  $featureFlags
     */
    private function __construct(
        public ?string $status,
        public ?string $plan,
        public ?string $instanceId,
        public ?string $expiresAt,
        public ?string $graceExpiresAt,
        public ?string $nextCheckAt,
        public ?int $gracePeriodHours,
        public ?string $nonce,
        public ?string $staticFileChecksum,
        public ?string $staticFileChecksumVersion,
        public bool $staticFileChecksumEnabled,
        public array $featureFlags,
    ) {}

    /**
     * @param  array<string, mixed>  $payload
     */
    public static function fromArray(array $payload): self
    {
        $featureFlags = $payload['feature_flags'] ?? [];

        return new self(
            status: self::stringOrNull($payload['status'] ?? null),
            plan: self::stringOrNull($payload['plan'] ?? null),
            instanceId: self::stringOrNull($payload['instance_id'] ?? null),
            expiresAt: self::stringOrNull($payload['expires_at'] ?? null),
            graceExpiresAt: self::stringOrNull($payload['grace_expires_at'] ?? null),
            nextCheckAt: self::stringOrNull($payload['next_check_at'] ?? null),
            gracePeriodHours: self::intOrNull($payload['grace_period_hours'] ?? null),
            nonce: self::stringOrNull($payload['nonce'] ?? null),
            staticFileChecksum: self::stringOrNull($payload['sfc'] ?? null),
            staticFileChecksumVersion: self::stringOrNull($payload['sfc_version'] ?? null),
            staticFileChecksumEnabled: ($payload['sfc_enabled'] ?? false) === true,
            featureFlags: LicenseFeatureFlags::normalize(is_array($featureFlags) ? $featureFlags : []),
        );
    }

    /**
     * @return array{
     *     status: string|null,
     *     plan: string|null,
     *     instance_id: string|null,
     *     expires_at: string|null,
     *     grace_expires_at: string|null,
     *     next_check_at: string|null,
     *     grace_period_hours: int|null,
     *     nonce: string|null,
     *     sfc: string|null,
     *     sfc_version: string|null,
     *     sfc_enabled: bool,
     *     feature_flags: array<string, bool|int|string>
     * }
     */
    public function toArray(): array
    {
        return [
            'status' => $this->status,
            'plan' => $this->plan,
            'instance_id' => $this->instanceId,
            'expires_at' => $this->expiresAt,
            'grace_expires_at' => $this->graceExpiresAt,
            'next_check_at' => $this->nextCheckAt,
            'grace_period_hours' => $this->gracePeriodHours,
            'nonce' => $this->nonce,
            'sfc' => $this->staticFileChecksum,
            'sfc_version' => $this->staticFileChecksumVersion,
            'sfc_enabled' => $this->staticFileChecksumEnabled,
            'feature_flags' => $this->featureFlags,
        ];
    }

    private static function stringOrNull(mixed $value): ?string
    {
        return is_string($value) ? $value : null;
    }

    private static function intOrNull(mixed $value): ?int
    {
        return is_int($value) ? $value : (is_numeric($value) ? (int) $value : null);
    }
}
