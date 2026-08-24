<?php

namespace App\Events\Integration\Vault;

use App\DTO\Integration\IntegrationValidationResult;
use App\Models\Integration;
use Illuminate\Foundation\Events\Dispatchable;

class VaultValidationRequested
{
    use Dispatchable;

    public ?IntegrationValidationResult $result = null;

    public function __construct(
        public readonly Integration $integration,
    ) {}
}
