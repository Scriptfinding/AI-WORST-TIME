<?php

namespace App\Services\Integration\Messenger;

use App\Contracts\Integration\IntegrationCleanupInterface;
use App\Enums\Integration\IntegrationCategoryEnum;
use App\Models\Integration;
use App\Models\NotificationChannel;

class MessengerCleanupHandler implements IntegrationCleanupInterface
{
    public function supports(Integration $integration): bool
    {
        return $integration->category === IntegrationCategoryEnum::MESSENGER;
    }

    public function cleanup(Integration $integration): void
    {
        NotificationChannel::where('messenger_integration_id', $integration->id)->delete();
    }
}
