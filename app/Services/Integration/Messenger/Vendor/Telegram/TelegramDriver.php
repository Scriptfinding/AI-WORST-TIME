<?php

namespace App\Services\Integration\Messenger\Vendor\Telegram;

use App\Contracts\Integration\Messenger\MessengerDriverInterface;
use App\DTO\Integration\IntegrationValidationResult;
use App\DTO\Integration\Messenger\MessengerConfig;
use App\Enums\Integration\IntegrationMessengerProviderEnum;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TelegramDriver implements MessengerDriverInterface
{
    private const API_BASE = 'https://api.telegram.org/bot';

    private const TIMEOUT = 10;

    public function supports(IntegrationMessengerProviderEnum $provider): bool
    {
        return $provider === IntegrationMessengerProviderEnum::TELEGRAM;
    }

    public function validateCredentials(MessengerConfig $config): IntegrationValidationResult
    {
        return app(TelegramMessengerChecker::class)->check($config->token());
    }

    public function detectChats(MessengerConfig $config): array
    {
        $token = $config->token();

        try {
            $response = $this->getUpdates($token);

            /** @var array{ok?: bool, error_code?: int, description?: string, result?: list<array{message?: array{chat?: array{id: int|string, first_name?: string, title?: string}}}>} $data */
            $data = $response->json();

            if ($this->hasActiveWebhookConflict($data)) {
                $deleteResponse = Http::timeout(self::TIMEOUT)
                    ->post(self::API_BASE.$token.'/deleteWebhook', [
                        'drop_pending_updates' => false,
                    ]);

                /** @var array{ok?: bool, description?: string} $deleteData */
                $deleteData = $deleteResponse->json();

                if (! ($deleteData['ok'] ?? false)) {
                    return ['ok' => false, 'error' => $deleteData['description'] ?? 'Failed to delete Telegram webhook'];
                }

                $response = $this->getUpdates($token);
                /** @var array{ok?: bool, error_code?: int, description?: string, result?: list<array{message?: array{chat?: array{id: int|string, first_name?: string, title?: string}}}>} $data */
                $data = $response->json();
            }

            if (! ($data['ok'] ?? false)) {
                return ['ok' => false, 'error' => $data['description'] ?? 'Failed to get updates'];
            }

            foreach ($data['result'] ?? [] as $update) {
                if (isset($update['message']['chat'])) {
                    $chat = $update['message']['chat'];

                    return [
                        'ok' => true,
                        'chat_id' => (string) $chat['id'],
                        'chat_name' => $chat['first_name'] ?? $chat['title'] ?? 'Unknown',
                    ];
                }
            }

            return ['ok' => false, 'error' => 'No messages found. Make sure you sent a message to the bot.'];
        } catch (\Throwable $e) {
            return ['ok' => false, 'error' => $e->getMessage()];
        }
    }

    private function getUpdates(string $token): \Illuminate\Http\Client\Response
    {
        return Http::timeout(self::TIMEOUT)
            ->get(self::API_BASE.$token.'/getUpdates', [
                'limit' => 10,
                'allowed_updates' => json_encode(['message']),
            ]);
    }

    /** @param array{error_code?: int, description?: string} $data */
    private function hasActiveWebhookConflict(array $data): bool
    {
        return ($data['error_code'] ?? null) === 409
            && str_contains($data['description'] ?? '', "can't use getUpdates method while webhook is active");
    }

    public function sendTestMessage(MessengerConfig $config, string $chatId, string $message): array
    {
        $token = $config->token();

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
