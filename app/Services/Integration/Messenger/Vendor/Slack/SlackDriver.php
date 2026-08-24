<?php

namespace App\Services\Integration\Messenger\Vendor\Slack;

use App\Contracts\Integration\Messenger\MessengerDriverInterface;
use App\DTO\Integration\IntegrationValidationResult;
use App\DTO\Integration\Messenger\MessengerConfig;
use App\Enums\Integration\IntegrationMessengerProviderEnum;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SlackDriver implements MessengerDriverInterface
{
    private const API_BASE = 'https://slack.com/api';

    private const TIMEOUT = 10;

    public function supports(IntegrationMessengerProviderEnum $provider): bool
    {
        return $provider === IntegrationMessengerProviderEnum::SLACK;
    }

    public function validateCredentials(MessengerConfig $config): IntegrationValidationResult
    {
        return app(SlackMessengerChecker::class)->check($config->token());
    }

    public function detectChats(MessengerConfig $config): array
    {
        $token = $config->token();

        try {
            $channels = $this->listChannels($token, 'public_channel,private_channel');

            if ($channels === null) {
                $channels = $this->listChannels($token, 'public_channel');
            }

            if ($channels === null) {
                return ['ok' => false, 'error' => 'Failed to list channels. Make sure the bot has the channels:read scope.'];
            }

            if (empty($channels)) {
                return ['ok' => false, 'error' => 'No channels found. Invite the bot to a channel first using /invite @botname.'];
            }

            return ['ok' => true, 'channels' => $channels];
        } catch (\Throwable $e) {
            return ['ok' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * @return list<array{id: string, name: string}>|null
     */
    private function listChannels(string $token, string $types): ?array
    {
        $allChannels = [];
        $cursor = null;

        do {
            $params = [
                'types' => $types,
                'exclude_archived' => 'true',
                'limit' => 200,
            ];
            if ($cursor) {
                $params['cursor'] = $cursor;
            }

            $response = Http::timeout(self::TIMEOUT)
                ->withHeaders(['Authorization' => "Bearer {$token}"])
                ->get(self::API_BASE.'/conversations.list', $params);

            /** @var array{ok?: bool, channels?: list<array{id: string, name: string, is_member?: bool, is_private?: bool}>, response_metadata?: array{next_cursor?: string}} $data */
            $data = $response->json();

            if (! ($data['ok'] ?? false)) {
                return null;
            }

            foreach ($data['channels'] ?? [] as $channel) {
                if ($channel['is_member'] ?? false) {
                    $prefix = ($channel['is_private'] ?? false) ? '🔒 ' : '#';
                    $allChannels[] = [
                        'id' => $channel['id'],
                        'name' => $prefix.$channel['name'],
                    ];
                }
            }

            $cursor = $data['response_metadata']['next_cursor'] ?? null;
        } while ($cursor);

        return $allChannels;
    }

    public function sendTestMessage(MessengerConfig $config, string $chatId, string $message): array
    {
        $token = $config->token();

        try {
            $response = Http::timeout(self::TIMEOUT)
                ->withHeaders(['Authorization' => "Bearer {$token}"])
                ->post(self::API_BASE.'/chat.postMessage', [
                    'channel' => $chatId,
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
