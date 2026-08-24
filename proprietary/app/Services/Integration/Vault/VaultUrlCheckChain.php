<?php

namespace App\Services\Integration\Vault;

use App\Contracts\Integration\Vault\VaultUrlCheckerInterface;
use App\DTO\Integration\IntegrationValidationResult;
use App\Enums\Integration\IntegrationVaultProviderEnum;

class VaultUrlCheckChain
{
    /** @var VaultUrlCheckerInterface[] */
    private array $checkers;

    public function __construct(VaultUrlCheckerInterface ...$checkers)
    {
        $this->checkers = $checkers;
    }

    public function check(IntegrationVaultProviderEnum $provider, string $url): IntegrationValidationResult
    {
        foreach ($this->checkers as $checker) {
            if ($checker->supports($provider)) {
                return $checker->check($url);
            }
        }

        return IntegrationValidationResult::failure("No URL checker for provider: {$provider->value}");
    }

    public function supports(IntegrationVaultProviderEnum $provider): bool
    {
        foreach ($this->checkers as $checker) {
            if ($checker->supports($provider)) {
                return true;
            }
        }

        return false;
    }
}
