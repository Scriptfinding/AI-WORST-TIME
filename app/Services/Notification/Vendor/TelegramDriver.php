<?php

namespace App\Services\Notification\Vendor;

use App\Contracts\Notification\NotificationDriverInterface;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TelegramDriver implements NotificationDriverInterface
{
    private const API_BASE = 'https://api.telegram.org/bot';

    private const TIMEOUT = 10;

    public function supports(string $provider): bool
    {
        return $provider === 'telegram';
    }

    public function send(string $token, string $chatId, string $message): array
    {
        try {
            $response = Http::timeout(self::TIMEOUT)
                ->post(self::API_BASE.$token.'/sendMessage', [
                    'chat_id' => $chatId,
                    'text' => $message,
                    'parse_mode' => 'HTML',
                ]);

            /** @var array{ok?: bool, description?: string} $data */
            $data = $response->json();

            if ($data['ok'] ?? false) {
                return ['ok' => true];
            }

            return ['ok' => false, 'error' => $data['description'] ?? 'Send failed'];
        } catch (\Throwable $e) {
            Log::error("Telegram send error: {$e->getMessage()}");

            return ['ok' => false, 'error' => $e->getMessage()];
        }
    }
}
