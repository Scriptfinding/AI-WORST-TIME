<?php

namespace App\Contracts\Integration\Messenger;

use App\DTO\Integration\IntegrationValidationResult;
use App\DTO\Integration\Messenger\MessengerConfig;
use App\Enums\Integration\IntegrationMessengerProviderEnum;

interface MessengerDriverInterface
{
    public function supports(IntegrationMessengerProviderEnum $provider): bool;

    public function validateCredentials(MessengerConfig $config): IntegrationValidationResult;

    /**
     * @return array{ok: bool, channels?: array<int, array{id: string, name: string}>, chat_id?: string, chat_name?: string, error?: string}
     */
    public function detectChats(MessengerConfig $config): array;

    /** @return array{ok: bool, error?: string} */
    public function sendTestMessage(MessengerConfig $config, string $chatId, string $message): array;
}
