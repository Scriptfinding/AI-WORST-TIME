<?php

namespace App\Services\Notification\Vendor;

use App\Contracts\Notification\NotificationDriverInterface;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DiscordDriver implements NotificationDriverInterface
{
    private const API_BASE = 'https://discord.com/api/v10';

    private const TIMEOUT = 10;

    public function supports(string $provider): bool
    {
        return $provider === 'discord';
    }

    public function send(string $token, string $channelId, string $message): array
    {
        try {
            $response = Http::timeout(self::TIMEOUT)
                ->withHeaders(['Authorization' => "Bot {$token}"])
                ->post(self::API_BASE."/channels/{$channelId}/messages", [
                    'content' => $message,
                ]);

            if ($response->successful()) {
                return ['ok' => true];
            }

            return ['ok' => false, 'error' => 'Send failed (HTTP '.$response->status().')'];
        } catch (\Throwable $e) {
            Log::error("Discord send error: {$e->getMessage()}");

            return ['ok' => false, 'error' => $e->getMessage()];
        }
    }
}
