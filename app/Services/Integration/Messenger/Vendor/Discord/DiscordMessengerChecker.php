<?php

namespace App\Services\Integration\Messenger\Vendor\Discord;

use App\Contracts\Integration\Messenger\MessengerCheckerInterface;
use App\DTO\Integration\IntegrationValidationResult;
use App\Enums\Integration\IntegrationMessengerProviderEnum;
use Illuminate\Support\Facades\Http;

class DiscordMessengerChecker implements MessengerCheckerInterface
{
    private const API_BASE = 'https://discord.com/api/v10';

    private const TIMEOUT_SECONDS = 10;

    public function supports(IntegrationMessengerProviderEnum $provider): bool
    {
        return $provider === IntegrationMessengerProviderEnum::DISCORD;
    }

    public function check(string $token): IntegrationValidationResult
    {
        if (blank($token)) {
            return IntegrationValidationResult::failure('Bot token is required.');
        }

        try {
            $response = Http::timeout(self::TIMEOUT_SECONDS)
                ->withHeaders(['Authorization' => 'Bot '.$token])
                ->get(self::API_BASE.'/users/@me');
        } catch (\Illuminate\Http\Client\ConnectionException) {
            return IntegrationValidationResult::failure('Could not reach Discord. Please try again.');
        }

        if ($response->status() === 401) {
            return IntegrationValidationResult::failure('Invalid bot token. Please double-check and try again.');
        }

        if ($response->status() === 429) {
            $rawRetryAfter = $response->json('retry_after', '?');
            $retryAfter = is_scalar($rawRetryAfter) ? (string) $rawRetryAfter : '?';

            return IntegrationValidationResult::failure("Rate limited by Discord. Retry in {$retryAfter} seconds.");
        }

        if (! $response->successful()) {
            $rawMessage = $response->json('message', 'Unknown error');
            $message = is_string($rawMessage) ? $rawMessage : 'Unknown error';

            return IntegrationValidationResult::failure("Discord API error: {$message}");
        }

        /** @var array{username?: string, bot?: bool} $body */
        $body = $response->json();
        $username = $body['username'] ?? null;

        if (empty($username)) {
            return IntegrationValidationResult::failure('Unexpected response from Discord.');
        }

        if (! ($body['bot'] ?? false)) {
            return IntegrationValidationResult::failure('This token does not belong to a bot account.');
        }

        return IntegrationValidationResult::success(botName: $username);
    }
}
