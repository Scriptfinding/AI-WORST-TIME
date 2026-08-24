<?php

namespace App\Services\Integration\Other\Vendor\Mailbox;

use App\Contracts\Integration\IntegrationCleanupInterface;
use App\Enums\Integration\IntegrationCategoryEnum;
use App\Models\Integration;
use App\Models\MailboxDomain;

class MailboxCleanupHandler implements IntegrationCleanupInterface
{
    public function supports(Integration $integration): bool
    {
        return $integration->category === IntegrationCategoryEnum::OTHER;
    }

    public function cleanup(Integration $integration): void
    {
        MailboxDomain::where('integration_id', $integration->id)
            ->get()
            ->each->delete();
    }
}
