<?php

namespace App\Services\Runtime;

use App\Models\Flow;
use App\Models\FlowRun;
use Illuminate\Support\Str;
use LogicException;

class RunnerCapabilityService
{
    public const TOKEN_GRACE_SECONDS = 60;

    public const MAX_TOKEN_TTL_SECONDS = Flow::UNLIMITED_TIMEOUT_SECONDS + self::TOKEN_GRACE_SECONDS;

    public const AUDIENCE = 'puppetflow-runner';

    public const SCOPE_MAILBOX_CLAIM = 'mailbox.claim';

    public const SCOPE_MAILBOX_RENEW = 'mailbox.renew';

    public const SCOPE_AI_EXECUTE = 'ai.execute';

    public const SCOPE_WAITING_DECLARE = 'waiting.declare';

    public const SCOPE_WAITING_CONSUME = 'waiting.consume';

    public const SCOPE_WAITING_CLEAR = 'waiting.clear';

    private const VERSION = 1;

    /**
     * @param  list<string>  $scopes
     * @return array{token: string, expires: int}
     */
    public function issue(FlowRun $run, int $ttlSeconds, array $scopes): array
    {
        $runId = $run->getKey();
        if (! is_numeric($runId)) {
            throw new LogicException('Runner capability requires a persisted flow run.');
        }

        $issuedAt = now()->getTimestamp();
        $maxTtl = $this->maxTokenTtlSeconds();
        $expires = $issuedAt + min(max(30, $ttlSeconds), $maxTtl);
        $scopes = array_values(array_unique(array_filter(
            array_map('trim', $scopes),
            static fn (string $scope): bool => $scope !== '',
        )));
        if ($scopes === []) {
            throw new LogicException('Runner capability requires at least one scope.');
        }
        $payload = $this->encode(json_encode([
            'v' => self::VERSION,
            'kid' => $this->keyId(),
            'aud' => self::AUDIENCE,
            'run_id' => (int) $runId,
            'iat' => $issuedAt,
            'exp' => $expires,
            'jti' => Str::random(24),
            'scopes' => $scopes,
        ], JSON_THROW_ON_ERROR));
        $signature = $this->encode(hash_hmac('sha256', $payload, $this->secret(), true));

        return [
            'token' => "{$payload}.{$signature}",
            'expires' => $expires,
        ];
    }

    /**
     * @return array{run: FlowRun, claims: array<string, mixed>}|null
     */
    public function resolve(string $token): ?array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 2) {
            return null;
        }

        [$payload, $signature] = $parts;
        $expected = $this->encode(hash_hmac('sha256', $payload, $this->secret(), true));
        if (! hash_equals($expected, $signature)) {
            return null;
        }

        $decoded = $this->decode($payload);
        if ($decoded === null) {
            return null;
        }

        $claims = json_decode($decoded, true);
        $now = now()->getTimestamp();
        $clockSkew = $this->configInt('puppetflow.runner_api.clock_skew_seconds', 30, 0);
        $maxTtl = $this->maxTokenTtlSeconds();
        if (
            ! is_array($claims)
            || ($claims['v'] ?? null) !== self::VERSION
            || ($claims['kid'] ?? null) !== $this->keyId()
            || ($claims['aud'] ?? null) !== self::AUDIENCE
            || ! isset($claims['run_id'], $claims['iat'], $claims['exp'], $claims['jti'], $claims['scopes'])
            || ! is_numeric($claims['run_id'])
            || ! is_numeric($claims['iat'])
            || ! is_numeric($claims['exp'])
            || ! is_string($claims['jti'])
            || strlen($claims['jti']) < 16
            || ! is_array($claims['scopes'])
            || array_filter($claims['scopes'], static fn (mixed $scope): bool => ! is_string($scope)) !== []
            || (int) $claims['iat'] > $now + $clockSkew
            || (int) $claims['exp'] < $now
            || (int) $claims['exp'] <= (int) $claims['iat']
            || (int) $claims['exp'] - (int) $claims['iat'] > $maxTtl
        ) {
            return null;
        }

        $run = FlowRun::query()->find((int) $claims['run_id']);

        return $run instanceof FlowRun ? ['run' => $run, 'claims' => $claims] : null;
    }

    private function secret(): string
    {
        $configured = config('puppetflow.runner_api.secret');
        $secret = is_string($configured) ? $configured : '';
        if (strlen($secret) < 32) {
            throw new LogicException('RUNNER_API_SECRET must contain at least 32 characters.');
        }

        return $secret;
    }

    private function keyId(): string
    {
        $configured = config('puppetflow.runner_api.key_id', 'v1');

        return is_string($configured) && $configured !== '' ? $configured : 'v1';
    }

    private function maxTokenTtlSeconds(): int
    {
        return min(
            self::MAX_TOKEN_TTL_SECONDS,
            $this->configInt(
                'puppetflow.runner_api.max_token_ttl_seconds',
                self::MAX_TOKEN_TTL_SECONDS,
                30,
            ),
        );
    }

    private function configInt(string $key, int $default, int $minimum): int
    {
        $configured = config($key, $default);

        return max($minimum, is_numeric($configured) ? (int) $configured : $default);
    }

    private function encode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }

    private function decode(string $value): ?string
    {
        $padding = strlen($value) % 4;
        if ($padding !== 0) {
            $value .= str_repeat('=', 4 - $padding);
        }

        $decoded = base64_decode(strtr($value, '-_', '+/'), true);

        return is_string($decoded) ? $decoded : null;
    }
}
