<?php

namespace App\Services\Integration\Messenger\Vendor\Slack;

use App\Contracts\Integration\Messenger\MessengerCheckerInterface;
use App\DTO\Integration\IntegrationValidationResult;
use App\Enums\Integration\IntegrationMessengerProviderEnum;
use Illuminate\Support\Facades\Http;

class SlackMessengerChecker implements MessengerCheckerInterface
{
    private const API_BASE = 'https://slack.com/api';

    private const TIMEOUT_SECONDS = 10;

    public function supports(IntegrationMessengerProviderEnum $provider): bool
    {
        return $provider === IntegrationMessengerProviderEnum::SLACK;
    }

    public function check(string $token): IntegrationValidationResult
    {
        if (blank($token)) {
            return IntegrationValidationResult::failure('Bot token is required.');
        }

        try {
            $response = Http::timeout(self::TIMEOUT_SECONDS)
                ->withHeaders(['Authorization' => 'Bearer '.$token])
                ->get(self::API_BASE.'/auth.test');
        } catch (\Illuminate\Http\Client\ConnectionException) {
            return IntegrationValidationResult::failure('Could not reach Slack. Please try again.');
        }

        if (! $response->successful()) {
            return IntegrationValidationResult::failure('Could not reach Slack. Please try again.');
        }

        /** @var array{ok?: bool, error?: string, bot_id?: string, user?: string} $body */
        $body = $response->json();

        if (! ($body['ok'] ?? false)) {
            $error = $body['error'] ?? 'unknown_error';

            if ($error === 'invalid_auth' || $error === 'not_authed') {
                return IntegrationValidationResult::failure('Invalid bot token. Please double-check and try again.');
            }

            if ($error === 'token_revoked') {
                return IntegrationValidationResult::failure('This token has been revoked. Please generate a new one.');
            }

            return IntegrationValidationResult::failure("Slack API error: {$error}");
        }

        $botName = $body['bot_id'] ?? $body['user'] ?? null;

        if (empty($botName)) {
            return IntegrationValidationResult::failure('Unexpected response from Slack.');
        }

        return IntegrationValidationResult::success(botName: $botName);
    }
}
