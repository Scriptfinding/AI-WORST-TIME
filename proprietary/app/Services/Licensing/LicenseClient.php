<?php

namespace App\Services\Licensing;

use App\Exceptions\Licensing\LicenseServerException;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class LicenseClient
{
    public function __construct(
        private readonly LicenseFileStore $fileStore,
        private readonly LicensePublicKey $publicKey,
        private readonly StaticFileChecksumCalculator $staticFileChecksum,
        private readonly SystemIdentity $systemIdentity,
        private readonly LicenseInstanceId $instanceIdProvider,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function activate(): array
    {
        return $this->post('activate');
    }

    /**
     * @return array<string, mixed>
     */
    public function ping(): array
    {
        return $this->post('ping');
    }

    /**
     * @return array<string, mixed>
     */
    public function deactivate(): array
    {
        return $this->post('deactivate', includeNonce: false);
    }

    public function communityLicenseAvailable(): bool
    {
        $response = Http::timeout($this->timeout())
            ->acceptJson()
            ->get($this->serverUrl().'/api/licenses/community/availability');

        return $response->successful() && $response->json('enabled') === true;
    }

    public function requestCommunityLicense(string $email): void
    {
        $response = Http::timeout($this->timeout())
            ->acceptJson()
            ->post($this->serverUrl().'/api/licenses/community/request', [
                'email' => $email,
            ]);

        if (! $response->successful()) {
            $message = $response->json('message');
            throw new LicenseServerException(
                is_string($message) && $message !== '' ? $message : 'The Community license request failed.',
                $response->status(),
            );
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function post(string $endpoint, bool $includeNonce = true): array
    {
        $baseUrl = $this->serverUrl();
        $licenseFile = $this->fileStore->get();

        if (! $licenseFile) {
            throw new RuntimeException('License file is missing.');
        }

        $payload = [
            'license_file' => $licenseFile,
            'instance_id' => $this->instanceId(),
            'app_url' => config('app.url'),
            'app_version' => config('license.app_version'),
            'fingerprint' => $this->fingerprint(),
            'private_ip_address' => $this->privateIpAddress(),
            'public_ip_address' => $this->publicIpAddress(),
            // Lets the license server detect instances whose verification key
            // was tampered with to accept forged licenses.
            'public_key_fingerprint' => $this->publicKey->fingerprint(),
            // Lets the license server detect instances whose source files were
            // modified, by comparing against the official checksum per version.
            // Computed outside the cache so the reported value always reflects
            // the current state of the files; this also refreshes the cache
            // used by the local verification right after the response.
            'sfc' => $this->staticFileChecksum->fresh(),
            // system_name, system_id, network_id
            ...$this->systemIdentity->toArray(),
            'metadata' => [
                'php' => PHP_VERSION,
                'laravel' => app()->version(),
            ],
        ];

        $nonce = null;
        if ($includeNonce) {
            $nonce = bin2hex(random_bytes(24));
            $payload['nonce'] = $nonce;
        }

        $response = Http::timeout($this->timeout())
            ->acceptJson()
            ->post("{$baseUrl}/api/licenses/{$endpoint}", $payload);

        if (! $response->successful()) {
            $message = $response->json('message');
            throw new LicenseServerException(
                is_string($message) && $message !== '' ? $message : "License {$endpoint} failed.",
                $response->status(),
            );
        }

        $data = $response->json();
        if (! is_array($data)) {
            throw new LicenseServerException('License server returned an invalid response.', $response->status());
        }

        if ($nonce) {
            $data['_request_nonce'] = $nonce;
        }

        /** @var array<string, mixed> $data */
        return $data;
    }

    private function serverUrl(): string
    {
        $configuredUrl = config('license.server_url');
        $baseUrl = is_string($configuredUrl) ? rtrim($configuredUrl, '/') : '';

        if ($baseUrl === '') {
            throw new RuntimeException('License server URL is missing.');
        }

        return $baseUrl;
    }

    public function instanceId(): string
    {
        return $this->instanceIdProvider->get();
    }

    private function fingerprint(): string
    {
        $appUrl = config('app.url');

        return implode('|', [
            php_uname('n'),
            base_path(),
            is_scalar($appUrl) ? (string) $appUrl : '',
        ]);
    }

    private function publicIpAddress(): ?string
    {
        foreach (['https://4.ident.me', 'https://4.tnedi.me'] as $url) {
            try {
                $ip = trim(Http::timeout(5)->get($url)->body());
            } catch (\Throwable) {
                continue;
            }

            if ($this->isIpv4($ip)) {
                return $ip;
            }
        }

        return null;
    }

    private function privateIpAddress(): ?string
    {
        $candidates = array_filter([
            $_SERVER['SERVER_ADDR'] ?? null,
            gethostbyname((string) gethostname()),
            ...((array) gethostbynamel((string) gethostname())),
        ]);

        foreach ($candidates as $ip) {
            if (! is_scalar($ip)) {
                continue;
            }
            $ip = trim((string) $ip);
            if ($this->isPrivateIpv4($ip)) {
                return $ip;
            }
        }

        foreach ($candidates as $ip) {
            if (! is_scalar($ip)) {
                continue;
            }
            $ip = trim((string) $ip);
            if ($this->isIpv4($ip) && ! str_starts_with($ip, '127.')) {
                return $ip;
            }
        }

        return null;
    }

    private function isIpv4(string $ip): bool
    {
        return filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4) !== false;
    }

    private function isPrivateIpv4(string $ip): bool
    {
        return $this->isIpv4($ip)
            && (
                str_starts_with($ip, '10.')
                || str_starts_with($ip, '192.168.')
                || preg_match('/^172\.(1[6-9]|2\d|3[0-1])\./', $ip) === 1
            );
    }

    private function timeout(): int
    {
        $timeout = config('license.timeout');

        return is_int($timeout) ? $timeout : (is_numeric($timeout) ? (int) $timeout : 10);
    }
}
