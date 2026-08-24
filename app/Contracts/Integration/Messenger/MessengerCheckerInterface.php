<?php

namespace App\Contracts\Integration\Messenger;

use App\DTO\Integration\IntegrationValidationResult;
use App\Enums\Integration\IntegrationMessengerProviderEnum;

interface MessengerCheckerInterface
{
    public function supports(IntegrationMessengerProviderEnum $provider): bool;

    public function check(string $token): IntegrationValidationResult;
}
