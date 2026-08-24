<?php

namespace App\Services\Integration\Ai;

use App\Contracts\Integration\IntegrationCleanupInterface;
use App\Enums\Integration\IntegrationCategoryEnum;
use App\Models\AiModel;
use App\Models\Integration;

class AiCleanupHandler implements IntegrationCleanupInterface
{
    public function supports(Integration $integration): bool
    {
        return $integration->category === IntegrationCategoryEnum::AI;
    }

    public function cleanup(Integration $integration): void
    {
        AiModel::where('ai_integration_id', $integration->id)->delete();
    }
}
