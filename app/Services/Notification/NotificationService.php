<?php

namespace App\Services\Notification;

use App\Contracts\Notification\NotificationDriverInterface;
use App\Models\NotificationChannel;
use App\Models\User;

class NotificationService
{
    /** @var NotificationDriverInterface[] */
    private array $drivers;

    public function __construct(NotificationDriverInterface ...$drivers)
    {
        $this->drivers = $drivers;
    }

    /** @return array{ok: bool, error?: string} */
    public function sendMessage(NotificationChannel $channel, User $actor, string $message): array
    {
        $token = $channel->getRuntimeToken($actor, $channel->workspace_id);
        $chatId = $channel->getChatId();
        if ($token === null || $chatId === null) {
            throw new \UnexpectedValueException('Notification channel credentials are incomplete.');
        }

        return $this->driver($channel->provider)->send(
            $token,
            $chatId,
            $message,
        );
    }

    private function driver(string $provider): NotificationDriverInterface
    {
        foreach ($this->drivers as $driver) {
            if ($driver->supports($provider)) {
                return $driver;
            }
        }

        return new class implements NotificationDriverInterface
        {
            public function supports(string $provider): bool
            {
                return true;
            }

            public function send(string $token, string $chatId, string $message): array
            {
                return ['ok' => false, 'error' => 'Unsupported provider'];
            }
        };
    }
}
