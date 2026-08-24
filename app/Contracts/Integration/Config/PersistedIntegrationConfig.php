<?php

namespace App\Contracts\Integration\Config;

interface PersistedIntegrationConfig
{
    /** @return array<string, mixed> */
    public function toArray(): array;
}
