<?php

namespace App\Services\Licensing;

use App\DTO\Licensing\LicenseTokenPayload;
use App\DTO\Licensing\SignedLicenseToken;
use Illuminate\Support\Carbon;
use RuntimeException;

class LicenseVerifier
{
    public const SFC_OK = 'ok';

    /** Token issued for another version, typically right after an upgrade. */
    public const SFC_STALE_TOKEN = 'stale_token';

    /** No official checksum registered for the version this instance reported. */
    public const SFC_MISSING = 'missing';

    /** The local files diverge from the official release checksum. */
    public const SFC_MISMATCH = 'mismatch';

    public function __construct(
        private readonly LicensePublicKey $publicKey,
        private readonly StaticFileChecksumCalculator $staticFileChecksum,
        private readonly LicenseInstanceId $instanceId,
    ) {}

    public function verify(SignedLicenseToken $token): LicenseTokenPayload
    {
        $publicKey = $this->publicKey->material();
        $signature = base64_decode($token->signature, true);

        if ($signature === false || strlen($signature) !== SODIUM_CRYPTO_SIGN_BYTES) {
            throw new RuntimeException('Invalid license signature format.');
        }

        if (! sodium_crypto_sign_verify_detached($signature, $token->payload, $publicKey)) {
            throw new RuntimeException('Invalid license signature.');
        }

        $decoded = json_decode($token->payload, true, flags: JSON_THROW_ON_ERROR);
        if (! is_array($decoded) || array_is_list($decoded)) {
            throw new RuntimeException('Invalid license payload.');
        }

        /** @var array<string, mixed> $decoded */
        $payload = LicenseTokenPayload::fromArray($decoded);
        $this->assertInstance($payload);

        return $payload;
    }

    public function isUsable(LicenseTokenPayload $payload): bool
    {
        if ($payload->status !== 'active') {
            return false;
        }

        if ($this->failsStaticFileChecksum($payload)) {
            return false;
        }

        if ($payload->graceExpiresAt !== null) {
            return Carbon::parse($payload->graceExpiresAt)->isFuture();
        }

        if ($payload->expiresAt === null) {
            return false;
        }

        return Carbon::parse($payload->expiresAt)->addHours($payload->gracePeriodHours ?? 0)->isFuture();
    }

    /**
     * True when the token expired and its grace window is over, as opposed to
     * being unusable for another reason (suspended license, checksum failure).
     */
    public function graceExpired(LicenseTokenPayload $payload): bool
    {
        if ($payload->graceExpiresAt !== null) {
            return Carbon::parse($payload->graceExpiresAt)->isPast();
        }

        if ($payload->expiresAt === null) {
            return true;
        }

        return Carbon::parse($payload->expiresAt)->addHours($payload->gracePeriodHours ?? 0)->isPast();
    }

    /**
     * The signed token embeds the official static file checksum of the
     * version the instance reported at activation/ping time. The check is
     * fail-closed: a token without checksum means the license server has no
     * official checksum registered for this version, and a divergence with
     * the locally computed checksum means the source files were modified.
     * Both make the license unusable. The only tolerated case is a token
     * issued for another version (right after an upgrade), until the next
     * ping refreshes it.
     */
    public function staticFileChecksumStatus(LicenseTokenPayload $payload, bool $fresh = false): string
    {
        if (! $payload->staticFileChecksumEnabled) {
            return self::SFC_OK;
        }

        $expected = $payload->staticFileChecksum;
        $sfcVersion = $payload->staticFileChecksumVersion;

        if (! is_string($expected) || $expected === '' || ! is_string($sfcVersion) || $sfcVersion === '') {
            return self::SFC_MISSING;
        }

        $configuredVersion = config('license.app_version');
        $currentVersion = is_scalar($configuredVersion) ? (string) $configuredVersion : '';
        if ($currentVersion === '' || $sfcVersion !== $currentVersion) {
            return self::SFC_STALE_TOKEN;
        }

        $actual = $fresh ? $this->staticFileChecksum->fresh() : $this->staticFileChecksum->cached();

        return hash_equals($expected, $actual) ? self::SFC_OK : self::SFC_MISMATCH;
    }

    public function failsStaticFileChecksum(LicenseTokenPayload $payload, bool $fresh = false): bool
    {
        return in_array(
            $this->staticFileChecksumStatus($payload, $fresh),
            [self::SFC_MISSING, self::SFC_MISMATCH],
            true,
        );
    }

    private function assertInstance(LicenseTokenPayload $payload): void
    {
        if ($payload->instanceId !== $this->instanceId->get()) {
            throw new RuntimeException('License is not valid for this instance.');
        }
    }
}
