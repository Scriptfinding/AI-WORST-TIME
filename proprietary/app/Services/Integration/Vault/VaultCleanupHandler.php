<?php

namespace App\Services\Integration\Vault;

use App\Contracts\Integration\IntegrationCleanupInterface;
use App\Enums\Integration\IntegrationCategoryEnum;
use App\Models\Integration;
use App\Models\UserVariable;

class VaultCleanupHandler implements IntegrationCleanupInterface
{
    public function supports(Integration $integration): bool
    {
        return $integration->category === IntegrationCategoryEnum::VAULT;
    }

    public function cleanup(Integration $integration): void
    {
        UserVariable::where('vault_integration_id', $integration->id)->delete();
    }
}
