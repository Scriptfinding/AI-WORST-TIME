<?php

namespace App\Services\Integration\Messenger;

use App\Contracts\Integration\Messenger\MessengerDriverInterface;
use App\DTO\Integration\IntegrationValidationResult;
use App\DTO\Integration\Messenger\MessengerConfig;
use App\Enums\Integration\IntegrationMessengerProviderEnum;

class MessengerService
{
    /** @var MessengerDriverInterface[] */
    private array $drivers;

    public function __construct(MessengerDriverInterface ...$drivers)
    {
        $this->drivers = $drivers;
    }

    public function driver(IntegrationMessengerProviderEnum $provider): MessengerDriverInterface
    {
        foreach ($this->drivers as $driver) {
            if ($driver->supports($provider)) {
                return $driver;
            }
        }

        throw new \InvalidArgumentException("No messenger driver supports provider: {$provider->value}");
    }

    public function validateCredentials(IntegrationMessengerProviderEnum $provider, MessengerConfig $config): IntegrationValidationResult
    {
        return $this->driver($provider)->validateCredentials($config);
    }

    /**
     * @return array{ok: bool, channels?: array<int, array{id: string, name: string}>, chat_id?: string, chat_name?: string, error?: string}
     */
    public function detectChats(IntegrationMessengerProviderEnum $provider, MessengerConfig $config): array
    {
        return $this->driver($provider)->detectChats($config);
    }

    /**
     * @return array{ok: bool, error?: string}
     */
    public function sendTestMessage(IntegrationMessengerProviderEnum $provider, MessengerConfig $config, string $chatId, string $message): array
    {
        return $this->driver($provider)->sendTestMessage($config, $chatId, $message);
    }
}
