<?php

namespace App\Contracts\Integration\Vault;

use App\DTO\Integration\IntegrationValidationResult;
use App\Enums\Integration\IntegrationVaultProviderEnum;

interface VaultUrlCheckerInterface
{
    public function supports(IntegrationVaultProviderEnum $provider): bool;

    public function check(string $url): IntegrationValidationResult;
}
