<?php

namespace App\Services\Integration\Messenger\Vendor\Discord;

use App\Contracts\Integration\Messenger\MessengerDriverInterface;
use App\DTO\Integration\IntegrationValidationResult;
use App\DTO\Integration\Messenger\MessengerConfig;
use App\Enums\Integration\IntegrationMessengerProviderEnum;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DiscordDriver implements MessengerDriverInterface
{
    private const API_BASE = 'https://discord.com/api/v10';

    private const TIMEOUT = 10;

    public function supports(IntegrationMessengerProviderEnum $provider): bool
    {
        return $provider === IntegrationMessengerProviderEnum::DISCORD;
    }

    public function validateCredentials(MessengerConfig $config): IntegrationValidationResult
    {
        return app(DiscordMessengerChecker::class)->check($config->token());
    }

    public function detectChats(MessengerConfig $config): array
    {
        $token = $config->token();

        try {
            $guildsResp = Http::timeout(self::TIMEOUT)
                ->withHeaders(['Authorization' => "Bot {$token}"])
                ->get(self::API_BASE.'/users/@me/guilds');

            if (! $guildsResp->successful()) {
                return ['ok' => false, 'error' => 'Failed to list servers (HTTP '.$guildsResp->status().'). Make sure the bot has been added to a server.'];
            }

            /** @var list<array{id: string, name: string}> $guilds */
            $guilds = $guildsResp->json();
            if (empty($guilds)) {
                return ['ok' => false, 'error' => 'The bot is not in any server. Invite it to a server first.'];
            }

            $channels = [];
            foreach ($guilds as $guild) {
                $channelsResp = Http::timeout(self::TIMEOUT)
                    ->withHeaders(['Authorization' => "Bot {$token}"])
                    ->get(self::API_BASE."/guilds/{$guild['id']}/channels");

                if (! $channelsResp->successful()) {
                    continue;
                }

                /** @var list<array{id: string, name: string, type: int}> $guildChannels */
                $guildChannels = $channelsResp->json();
                foreach ($guildChannels as $ch) {
                    if ($ch['type'] === 0) {
                        $channels[] = [
                            'id' => $ch['id'],
                            'name' => '#'.$ch['name'].' ('.$guild['name'].')',
                        ];
                    }
                }
            }

            if (empty($channels)) {
                return ['ok' => false, 'error' => "No text channels found in the bot's servers."];
            }

            return ['ok' => true, 'channels' => $channels];
        } catch (\Throwable $e) {
            return ['ok' => false, 'error' => $e->getMessage()];
        }
    }

    public function sendTestMessage(MessengerConfig $config, string $chatId, string $message): array
    {
        $token = $config->token();

        try {
            $response = Http::timeout(self::TIMEOUT)
                ->withHeaders(['Authorization' => "Bot {$token}"])
                ->post(self::API_BASE."/channels/{$chatId}/messages", [
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
