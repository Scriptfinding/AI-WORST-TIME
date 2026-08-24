<?php

namespace App\Subscribers\Integration\Messenger;

use App\Events\Integration\Messenger\MessengerValidationRequested;
use App\Services\Integration\Config\IntegrationConfigHydrator;
use App\Services\Integration\Messenger\MessengerCheckChain;
use App\Services\Integration\Messenger\MessengerService;
use Illuminate\Events\Dispatcher;

class MessengerValidationSubscriber
{
    public function __construct(
        private readonly MessengerCheckChain $checkChain,
        private readonly MessengerService $messengerService,
        private readonly IntegrationConfigHydrator $configHydrator,
    ) {}

    public function handleValidation(MessengerValidationRequested $event): void
    {
        $integration = $event->integration;
        $provider = $integration->messengerProvider();
        $config = $this->configHydrator->messenger($provider, $integration->config ?? []);
        $tokenCheck = $this->checkChain->check($provider, $config->token());

        if (! $tokenCheck->valid) {
            $event->result = $tokenCheck;

            return;
        }

        $event->result = $this->messengerService->validateCredentials($provider, $config);
    }

    public function subscribe(Dispatcher $events): void
    {
        $events->listen(
            MessengerValidationRequested::class,
            [self::class, 'handleValidation'],
        );
    }
}
