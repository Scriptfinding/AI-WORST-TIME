<?php

namespace App\Services\Licensing;

use App\DTO\Licensing\LicenseTokenPayload;
use App\DTO\Licensing\SignedLicenseToken;
use App\Exceptions\Licensing\LicenseServerException;
use App\Models\Setting;
use Illuminate\Support\Carbon;
use RuntimeException;

class LicenseManager
{
    private const TOKEN_SETTING = 'license.token';

    private const SFC_LOCK_SETTING = 'license.sfc_lock';

    private bool $payloadResolved = false;

    private ?LicenseTokenPayload $resolvedPayload = null;

    public function __construct(
        private readonly LicenseClient $client,
        private readonly LicenseVerifier $verifier,
        private readonly LicenseFileStore $fileStore,
        private readonly LicenseFileImporter $files,
    ) {}

    public function activate(): LicenseTokenPayload
    {
        try {
            $payload = $this->storeServerResponse($this->client->activate());
            $this->lockOnChecksumFailure($payload);

            return $payload;
        } finally {
            $this->syncFeatureFlagStates();
        }
    }

    public function ping(): LicenseTokenPayload
    {
        // Every ping resynchronizes the flag-dependent resources, whether the
        // server granted fresh entitlements or the request failed.
        try {
            $payload = $this->storeServerResponse($this->client->ping());
            $this->lockOnChecksumFailure($payload);

            return $payload;
        } catch (LicenseServerException $e) {
            // A 4xx from the server is a definitive rejection (instance
            // released, license suspended...): drop the local token so the
            // platform locks and the captive /license page takes over,
            // whichever caller carried the ping.
            if ($e->isRejection()) {
                Setting::set(self::TOKEN_SETTING, '');
                $this->rememberPayload(null);
            }

            throw $e;
        } finally {
            $this->syncFeatureFlagStates();
        }
    }

    /**
     * A token freshly issued by the server is authoritative: it embeds the
     * latest official checksum for the version this instance just reported,
     * and the local checksum was recomputed by the client when sending the
     * request. A failure at this point is definitive and locks the instance.
     */
    private function lockOnChecksumFailure(LicenseTokenPayload $payload): void
    {
        $status = $this->verifier->staticFileChecksumStatus($payload);
        if ($status === LicenseVerifier::SFC_MISSING || $status === LicenseVerifier::SFC_MISMATCH) {
            $this->purgeForChecksumFailure($status);
        }
    }

    public function deactivate(): void
    {
        $this->client->deactivate();
        Setting::set(self::TOKEN_SETTING, '');
        $this->rememberPayload(null);
    }

    public function forgetToken(): void
    {
        Setting::set(self::TOKEN_SETTING, '');
        $this->rememberPayload(null);
    }

    public function payload(): ?LicenseTokenPayload
    {
        if ($this->payloadResolved) {
            return $this->resolvedPayload;
        }

        $token = $this->token();
        if (! $token) {
            return $this->rememberPayload(null);
        }

        try {
            return $this->rememberPayload($this->verifier->verify($token));
        } catch (\Throwable) {
            return $this->rememberPayload(null);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function status(): array
    {
        $payload = $this->payload();

        if (! $payload) {
            $lock = $this->staticFileChecksumLock();
            if ($lock) {
                $message = $lock['message'] ?? null;

                return [
                    'active' => false,
                    'status' => 'locked',
                    'message' => is_string($message) ? $message : 'The application files failed the integrity check.',
                ];
            }

            return [
                'active' => false,
                'status' => 'missing',
                'message' => 'No valid license token found.',
            ];
        }

        return [
            'active' => $this->verifier->isUsable($payload),
            'status' => $payload->status ?? 'unknown',
            'plan' => $payload->plan ?? 'community',
            'expires_at' => $payload->expiresAt,
            'grace_period_hours' => $payload->gracePeriodHours,
            'grace_expires_at' => $payload->graceExpiresAt,
            'next_check_at' => $payload->nextCheckAt,
        ];
    }

    public function ensureUsable(): bool
    {
        $payload = $this->payload();
        if (! $payload) {
            return false;
        }

        $sfcStatus = $this->verifier->staticFileChecksumStatus($payload);
        if ($sfcStatus === LicenseVerifier::SFC_MISSING || $sfcStatus === LicenseVerifier::SFC_MISMATCH) {
            return $this->handleStaticFileChecksumFailure($payload);
        }

        if (! $this->verifier->isUsable($payload)) {
            return $this->purgeIfGraceExpired($payload);
        }

        if (! $this->shouldPing()) {
            return true;
        }

        try {
            $payload = $this->ping();
        } catch (LicenseServerException $e) {
            // ping() already dropped the token on a definitive rejection.
            if ($e->isRejection()) {
                return false;
            }

            return $this->purgeIfGraceExpired($payload);
        } catch (\Throwable) {
            return $this->purgeIfGraceExpired($payload);
        }

        return $this->verifier->isUsable($payload);
    }

    /**
     * Deletes the token once its grace window is over; the imported license
     * file is kept so the instance re-activates when the server is back.
     */
    private function purgeIfGraceExpired(LicenseTokenPayload $payload): bool
    {
        if ($this->verifier->graceExpired($payload)) {
            Setting::set(self::TOKEN_SETTING, '');
            $this->rememberPayload(null);

            return false;
        }

        return $this->verifier->isUsable($payload);
    }

    /**
     * Fail-closed handling of a static file checksum failure detected on the
     * current token. The failure is confirmed by recomputing the checksum
     * outside the cache, then by fetching a fresh token from the license
     * server (a checksum may have been registered for this version since the
     * token was issued). A confirmed failure locks the instance: the license
     * is removed from database and filesystem, and the reason is persisted
     * for the /license page.
     */
    private function handleStaticFileChecksumFailure(LicenseTokenPayload $payload): bool
    {
        $status = $this->verifier->staticFileChecksumStatus($payload, fresh: true);
        if ($status !== LicenseVerifier::SFC_MISSING && $status !== LicenseVerifier::SFC_MISMATCH) {
            return $this->verifier->isUsable($payload);
        }

        // ping() locks the instance by itself when the fresh token still
        // fails the check, so a failure here only needs to report unusable.
        try {
            $payload = $this->ping();
        } catch (\Throwable) {
            // Server unreachable or rejecting: the local failure stands.
            $this->purgeForChecksumFailure($status);

            return false;
        }

        return $this->verifier->isUsable($payload);
    }

    private function purgeForChecksumFailure(string $status): void
    {
        $configuredVersion = config('license.app_version');
        $version = is_scalar($configuredVersion) ? (string) $configuredVersion : 'unknown';
        $version = $version !== '' ? $version : 'unknown';
        $message = $status === LicenseVerifier::SFC_MISSING
            ? "No official file checksum is registered for version {$version}. This build is not recognized by the license server, so the license was removed from this instance."
            : "The application files do not match the official checksum for version {$version}. The installation appears to have been modified, so the license was removed from this instance.";

        Setting::set(self::SFC_LOCK_SETTING, json_encode([
            'status' => $status,
            'version' => $version,
            'message' => $message,
            'locked_at' => now()->toIso8601String(),
        ], JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR));

        try {
            $this->client->deactivate();
        } catch (\Throwable) {
            // Best effort: local state is purged even when the server is unreachable.
        }

        Setting::set(self::TOKEN_SETTING, '');
        $this->rememberPayload(null);
        $this->fileStore->forget();
        $this->files->forget();
        $this->syncFeatureFlagStates();
    }

    /**
     * @return array<string, mixed>|null
     */
    public function staticFileChecksumLock(): ?array
    {
        $value = Setting::get(self::SFC_LOCK_SETTING);
        if (! is_string($value) || $value === '') {
            return null;
        }

        $decoded = json_decode($value, true);

        if (! is_array($decoded) || array_is_list($decoded)) {
            return null;
        }

        /** @var array<string, mixed> $decoded */
        return $decoded;
    }

    /**
     * @return array<string, bool|int|string>
     */
    public function featureFlags(): array
    {
        return $this->applicableFeatureFlags() ?? [];
    }

    /**
     * Returns null when no usable signed token is applicable. An empty array
     * means a usable token exists but grants no explicit entitlements.
     *
     * @return array<string, bool|int|string>|null
     */
    public function applicableFeatureFlags(): ?array
    {
        $payload = $this->payload();
        if (! $payload || ! $this->verifier->isUsable($payload)) {
            return null;
        }

        return $payload->featureFlags;
    }

    public function shouldPing(): bool
    {
        $payload = $this->payload();
        if (! $payload) {
            return $this->fileStore->has();
        }

        return $payload->nextCheckAt === null || Carbon::parse($payload->nextCheckAt)->isPast();
    }

    /**
     * @param  array<string, mixed>  $response
     */
    private function storeServerResponse(array $response): LicenseTokenPayload
    {
        $tokenData = $response['license'] ?? null;
        if (! is_array($tokenData) || array_is_list($tokenData)) {
            throw new RuntimeException('License server returned an invalid response.');
        }

        /** @var array<string, mixed> $tokenData */
        try {
            $token = SignedLicenseToken::fromArray($tokenData);
        } catch (RuntimeException) {
            throw new RuntimeException('License server returned an invalid response.');
        }

        $payload = $this->verifier->verify($token);
        if (isset($response['_request_nonce']) && $payload->nonce !== $response['_request_nonce']) {
            throw new RuntimeException('License server returned an invalid nonce.');
        }

        Setting::set(self::TOKEN_SETTING, json_encode($token->toArray(), JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR));
        $this->rememberPayload($payload);

        // A fresh token that passes the integrity check lifts a previous
        // checksum lock; a failing one will re-lock on the next request.
        if (! $this->verifier->failsStaticFileChecksum($payload)) {
            Setting::set(self::SFC_LOCK_SETTING, '');
        }

        $this->deployLicenseFile($response);

        return $payload;
    }

    /**
     * Soft deployment: the server pushes a freshly issued license file when the
     * one used for authentication became stale. Signature and recency are
     * checked by the importer; failures are swallowed because a deployment
     * problem must never break the ping that carried it.
     */
    /**
     * @param  array<string, mixed>  $response
     */
    private function deployLicenseFile(array $response): void
    {
        $content = $response['deploy_license_file'] ?? null;
        if (! is_string($content) || $content === '') {
            return;
        }

        try {
            $this->files->deploy($content);
        } catch (\Throwable) {
            // Keep the current file, the next ping will retry.
        }
    }

    private function syncFeatureFlagStates(): void
    {
        try {
            app(\App\Services\FeatureFlags\FeatureFlagService::class)->syncStaleStates();
        } catch (\Throwable) {
            // A sync failure must never mask the ping result.
        }
    }

    private function token(): ?SignedLicenseToken
    {
        $value = Setting::get(self::TOKEN_SETTING);
        if (! is_string($value) || $value === '') {
            return null;
        }

        $decoded = json_decode($value, true);

        if (! is_array($decoded) || array_is_list($decoded)) {
            return null;
        }

        /** @var array<string, mixed> $decoded */
        try {
            return SignedLicenseToken::fromArray($decoded);
        } catch (RuntimeException) {
            return null;
        }
    }

    private function rememberPayload(?LicenseTokenPayload $payload): ?LicenseTokenPayload
    {
        $this->payloadResolved = true;

        return $this->resolvedPayload = $payload;
    }
}
