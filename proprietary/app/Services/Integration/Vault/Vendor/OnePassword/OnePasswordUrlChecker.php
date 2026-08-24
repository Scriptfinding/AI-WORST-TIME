<?php

namespace App\Services\Integration\Vault\Vendor\OnePassword;

use App\Contracts\Integration\Vault\VaultUrlCheckerInterface;
use App\DTO\Integration\IntegrationValidationResult;
use App\Enums\Integration\IntegrationVaultProviderEnum;
use App\Services\Integration\Http\IntegrationHttpClientFactory;
use Illuminate\Support\Facades\Log;

class OnePasswordUrlChecker implements VaultUrlCheckerInterface
{
    public function __construct(
        private readonly IntegrationHttpClientFactory $httpClients,
    ) {}

    public function supports(IntegrationVaultProviderEnum $provider): bool
    {
        return $provider === IntegrationVaultProviderEnum::ONEPASSWORD;
    }

    public function check(string $url): IntegrationValidationResult
    {
        if (empty($url)) {
            Log::error('Server URL is required.');

            return IntegrationValidationResult::failure('Server URL is required.');
        }

        $parsed = parse_url($url);

        if (! $parsed || ! isset($parsed['scheme'], $parsed['host'])) {
            Log::error('Invalid URL format.');

            return IntegrationValidationResult::failure('Invalid URL format.');
        }

        if (! in_array($parsed['scheme'], ['http', 'https'], true)) {
            Log::error('URL must use http or https.');

            return IntegrationValidationResult::failure('URL must use http or https.');
        }

        try {
            $response = $this->httpClients->for($url)
                ->timeout(5)
                ->connectTimeout(3)
                ->get(rtrim($url, '/').'/heartbeat');

            if ($response->successful()) {
                return IntegrationValidationResult::success();
            }

            Log::error('Server returned HTTP '.$response->status().'.');

            return IntegrationValidationResult::failure("Server returned HTTP {$response->status()}.");
        } catch (\Throwable) {
            Log::error('Vault server heartbeat failed.');

            return IntegrationValidationResult::failure('Server unreachable.');
        }
    }
}
