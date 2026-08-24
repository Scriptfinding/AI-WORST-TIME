<?php

namespace App\Services\Notification\Vendor;

use App\Contracts\Notification\NotificationDriverInterface;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SlackDriver implements NotificationDriverInterface
{
    private const API_BASE = 'https://slack.com/api';

    private const TIMEOUT = 10;

    public function supports(string $provider): bool
    {
        return $provider === 'slack';
    }

    public function send(string $token, string $channelId, string $message): array
    {
        try {
            $response = Http::timeout(self::TIMEOUT)
                ->withHeaders(['Authorization' => "Bearer {$token}"])
                ->post(self::API_BASE.'/chat.postMessage', [
                    'channel' => $channelId,
                    'text' => $message,
                ]);

            /** @var array{ok?: bool, error?: string} $data */
            $data = $response->json();

            if ($data['ok'] ?? false) {
                return ['ok' => true];
            }

            return ['ok' => false, 'error' => $data['error'] ?? 'Send failed'];
        } catch (\Throwable $e) {
            Log::error("Slack send error: {$e->getMessage()}");

            return ['ok' => false, 'error' => $e->getMessage()];
        }
    }
}
