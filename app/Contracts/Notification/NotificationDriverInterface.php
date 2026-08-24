<?php

namespace App\Contracts\Notification;

interface NotificationDriverInterface
{
    public function supports(string $provider): bool;

    /**
     * @return array{ok: bool, error?: string}
     */
    public function send(string $token, string $chatId, string $message): array;
}
