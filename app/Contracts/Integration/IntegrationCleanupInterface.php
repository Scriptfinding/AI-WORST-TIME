<?php

namespace App\Contracts\Integration;

use App\Models\Integration;

interface IntegrationCleanupInterface
{
    public function supports(Integration $integration): bool;

    public function cleanup(Integration $integration): void;
}
