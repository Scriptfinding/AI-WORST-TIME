<?php

namespace App\Events\Integration\Messenger;

use App\DTO\Integration\IntegrationValidationResult;
use App\Models\Integration;
use Illuminate\Foundation\Events\Dispatchable;

class MessengerValidationRequested
{
    use Dispatchable;

    public ?IntegrationValidationResult $result = null;

    public function __construct(
        public readonly Integration $integration,
    ) {}
}
