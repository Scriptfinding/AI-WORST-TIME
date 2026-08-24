<?php

namespace App\Contracts\Integration;

use App\Models\Integration;

interface InitializesIntegrationConfig
{
    /**
     * @param  array<string, mixed>  $config
     * @return array<string, mixed>
     */
    public function initializeConfig(array $config, Integration $integration): array;
}
