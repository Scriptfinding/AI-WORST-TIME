<?php

namespace App\Services\Integration\Messenger;

use App\Contracts\Integration\Messenger\MessengerCheckerInterface;
use App\DTO\Integration\IntegrationValidationResult;
use App\Enums\Integration\IntegrationMessengerProviderEnum;

class MessengerCheckChain
{
    /** @var MessengerCheckerInterface[] */
    private array $checkers;

    public function __construct(MessengerCheckerInterface ...$checkers)
    {
        $this->checkers = $checkers;
    }

    public function check(IntegrationMessengerProviderEnum $provider, string $token): IntegrationValidationResult
    {
        foreach ($this->checkers as $checker) {
            if ($checker->supports($provider)) {
                return $checker->check($token);
            }
        }

        return IntegrationValidationResult::failure("No messenger checker for provider: {$provider->value}");
    }
}
