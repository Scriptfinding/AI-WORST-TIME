<?php

namespace App\DTO\Integration\Messenger;

use App\DTO\Integration\Config\AbstractPersistedIntegrationConfig;

final readonly class MessengerConfig extends AbstractPersistedIntegrationConfig
{
    /** @param array<string, mixed> $values */
    public static function fromArray(array $values): self
    {
        return new self($values);
    }

    public function token(): string
    {
        return $this->string('token');
    }
}
