<?php

namespace App\Services\Integration\Messenger\Vendor\Telegram;

use App\Contracts\Integration\Messenger\MessengerCheckerInterface;
use App\DTO\Integration\IntegrationValidationResult;
use App\Enums\Integration\IntegrationMessengerProviderEnum;
use Illuminate\Support\Facades\Http;

class TelegramMessengerChecker implements MessengerCheckerInterface
{
    private const API_BASE = 'https://api.telegram.org/bot';

    private const TIMEOUT_SECONDS = 10;

    public function supports(IntegrationMessengerProviderEnum $provider): bool
    {
        return $provider === IntegrationMessengerProviderEnum::TELEGRAM;
    }

    public function check(string $token): IntegrationValidationResult
    {
        if (blank($token)) {
            return IntegrationValidationResult::failure('Bot token is required.');
        }

        try {
            $response = Http::timeout(self::TIMEOUT_SECONDS)
                ->get(self::API_BASE.$token.'/getMe');
        } catch (\Illuminate\Http\Client\ConnectionException) {
            return IntegrationValidationResult::failure('Could not reach Telegram. Please try again.');
        }

        if ($response->status() === 401) {
            return IntegrationValidationResult::failure('Invalid bot token. Please double-check and try again.');
        }

        if ($response->status() === 429) {
            $retryAfter = $response->header('Retry-After');

            return IntegrationValidationResult::failure("Rate limited by Telegram. Retry in {$retryAfter} seconds.");
        }

        if (! $response->successful()) {
            $rawDescription = $response->json('description', 'Unknown error');
            $desc = is_string($rawDescription) ? $rawDescription : 'Unknown error';

            return IntegrationValidationResult::failure("Telegram API error: {$desc}");
        }

        /** @var array{ok?: bool, result?: array{username?: string}} $body */
        $body = $response->json();

        if (! ($body['ok'] ?? false) || empty($body['result']['username'])) {
            return IntegrationValidationResult::failure('Unexpected response from Telegram.');
        }

        return IntegrationValidationResult::success(botName: $body['result']['username']);
    }
}
