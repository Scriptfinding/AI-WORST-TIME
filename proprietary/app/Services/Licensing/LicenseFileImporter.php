<?php

namespace App\Services\Licensing;

use App\DTO\Licensing\LicenseFilePayload;
use App\DTO\Licensing\SignedLicenseToken;
use App\Models\Setting;
use Illuminate\Support\Carbon;
use RuntimeException;
use ZipArchive;

class LicenseFileImporter
{
    private const FILE_SETTING = 'license.file';

    // Both spellings are accepted because self-hosted operators commonly use either one.
    private const DEFAULT_FILENAMES = ['puppetflow.license', 'puppetflow.licence'];

    // A license file is a few hundred bytes; anything larger inside an archive is not one.
    private const MAX_LICENSE_FILE_BYTES = 64 * 1024;

    public function __construct(
        private readonly LicenseFileStore $fileStore,
        private readonly LicensePublicKey $publicKey,
    ) {}

    public function forget(): void
    {
        Setting::set(self::FILE_SETTING, '');
    }

    public function import(string $content): LicenseFilePayload
    {
        // The download from the license server is a zip bundling the license
        // with its README and Terms; accept it as-is so users never have to
        // know whether to hand over the zip or the extracted .license file.
        $content = $this->extractFromArchiveIfNeeded($content);

        $payload = $this->verify($content);

        // The signed file is the activation credential sent to the license server.
        $this->fileStore->set($content);
        Setting::set(self::FILE_SETTING, json_encode($this->storedMetadata($payload), JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR));

        return $payload;
    }

    /**
     * Silently install a license file pushed by the license server during
     * activate/ping (soft deployment), so plan or flag changes reach the
     * instance without service interruption or manual re-download.
     *
     * The file signature is verified with the pinned public key and files
     * that are not strictly newer than the current one are refused, so a
     * compromised network path can neither forge a file nor downgrade to an
     * older legitimate one.
     */
    public function deploy(string $content): ?LicenseFilePayload
    {
        $payload = $this->verify($content);

        $currentIssuedAt = $this->metadata()['issued_at'] ?? null;
        $newIssuedAt = $payload->issuedAt;
        if ($newIssuedAt === null || $newIssuedAt === '') {
            return null;
        }
        if (is_string($currentIssuedAt) && $currentIssuedAt !== ''
            && Carbon::parse($newIssuedAt)->lte(Carbon::parse($currentIssuedAt))) {
            return null;
        }

        $this->import($content);

        return $payload;
    }

    /**
     * @return array<string, mixed>|null
     */
    public function metadata(): ?array
    {
        $value = Setting::get(self::FILE_SETTING);
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

    private function extractFromArchiveIfNeeded(string $content): string
    {
        if (! str_starts_with($content, "PK\x03\x04")) {
            return $content;
        }

        $path = tempnam(sys_get_temp_dir(), 'pf-license-zip-');
        if ($path === false || file_put_contents($path, $content) === false) {
            throw new RuntimeException('The uploaded archive could not be read.');
        }

        try {
            $zip = new ZipArchive;
            if ($zip->open($path) !== true) {
                throw new RuntimeException('The uploaded archive could not be opened.');
            }

            try {
                $index = $this->findLicenseEntry($zip);
                if ($index === null) {
                    throw new RuntimeException('The uploaded archive does not contain a puppetflow.license file.');
                }

                $extracted = $zip->getFromIndex($index, self::MAX_LICENSE_FILE_BYTES);
                if (! is_string($extracted) || $extracted === '') {
                    throw new RuntimeException('The license file inside the archive could not be read.');
                }

                return $extracted;
            } finally {
                $zip->close();
            }
        } finally {
            @unlink($path);
        }
    }

    private function findLicenseEntry(ZipArchive $zip): ?int
    {
        $fallback = null;

        for ($index = 0; $index < $zip->numFiles; $index++) {
            $name = (string) $zip->getNameIndex($index);
            if ($name === '' || str_ends_with($name, '/') || str_contains($name, '__MACOSX')) {
                continue;
            }

            $basename = strtolower(basename($name));
            if (in_array($basename, self::DEFAULT_FILENAMES, true)) {
                return $index;
            }
            if ($fallback === null && preg_match('/\.licen[cs]e$/', $basename)) {
                $fallback = $index;
            }
        }

        return $fallback;
    }

    private function verify(string $content): LicenseFilePayload
    {
        $decoded = base64_decode(trim($content), true);
        if ($decoded === false) {
            throw new RuntimeException('License file is not valid base64.');
        }

        $envelope = json_decode($decoded, true, flags: JSON_THROW_ON_ERROR);
        if (! is_array($envelope) || array_is_list($envelope)
            || ! isset($envelope['payload'], $envelope['signature'])) {
            throw new RuntimeException('License file has an invalid format.');
        }

        /** @var array<string, mixed> $envelope */
        $token = SignedLicenseToken::fromArray($envelope);
        $signature = base64_decode($token->signature, true);
        if ($signature === false || strlen($signature) !== SODIUM_CRYPTO_SIGN_BYTES) {
            throw new RuntimeException('License file signature has an invalid format.');
        }

        if (! sodium_crypto_sign_verify_detached($signature, $token->payload, $this->publicKey->material())) {
            throw new RuntimeException('License file signature is invalid.');
        }

        $decodedPayload = json_decode($token->payload, true, flags: JSON_THROW_ON_ERROR);
        if (! is_array($decodedPayload) || array_is_list($decodedPayload)) {
            throw new RuntimeException('License file payload is not supported.');
        }

        /** @var array<string, mixed> $decodedPayload */
        $payload = LicenseFilePayload::fromArray($decodedPayload);
        if ($payload->type !== 'puppetflow-license' || $payload->version !== 1) {
            throw new RuntimeException('License file payload is not supported.');
        }

        return $payload;
    }

    /**
     * @return array{
     *     imported_at: string,
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
    private function storedMetadata(LicenseFilePayload $payload): array
    {
        return [
            'imported_at' => now()->toIso8601String(),
            'issued_at' => $payload->issuedAt,
            'license_id' => $payload->licenseId,
            'customer_id' => $payload->customerId,
            'plan' => $payload->plan,
            'reference' => $payload->reference,
            'grace_period_hours' => $payload->gracePeriodHours,
            'sfc_enabled' => $payload->staticFileChecksumEnabled,
            'feature_flags' => $payload->featureFlags,
        ];
    }
}
