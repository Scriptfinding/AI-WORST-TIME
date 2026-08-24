<?php

namespace App\Services\BrowserStream;

use App\Models\FlowRun;
use LogicException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

final class BrowserStreamTokenService
{
    public const ROLE_PRODUCER = 'producer';

    public const ROLE_VIEWER = 'viewer';

    public const ROLE_CONTROLLER = 'controller';

    /** @return array{expires: int, token: string} */
    public function issue(FlowRun $run, string $role, ?int $ttlSeconds = null): array
    {
        if (! in_array($role, [
            self::ROLE_PRODUCER,
            self::ROLE_VIEWER,
            self::ROLE_CONTROLLER,
        ], true)) {
            throw new LogicException('Invalid browser stream role.');
        }

        $configuredSecret = config('services.browser_stream.secret');
        $secret = is_string($configuredSecret) ? $configuredSecret : '';
        if (strlen($secret) < 32) {
            throw new LogicException('BROWSER_STREAM_SECRET must contain at least 32 characters.');
        }

        if ($role !== self::ROLE_PRODUCER && $run->status !== 'running') {
            throw new ConflictHttpException('Run is not active for live view.');
        }

        $isProducer = $role === self::ROLE_PRODUCER;
        $configuredDefaultTtl = config(
            $isProducer ? 'services.browser_stream.producer_token_ttl' : 'services.browser_stream.token_ttl',
            $isProducer ? 300 : 60,
        );
        $defaultTtl = is_numeric($configuredDefaultTtl) ? (int) $configuredDefaultTtl : ($isProducer ? 300 : 60);
        $configuredMaxTtl = config(
            $isProducer ? 'services.browser_stream.producer_max_token_ttl' : 'services.browser_stream.max_token_ttl',
            $isProducer ? 10000029 : 300,
        );
        $maxTtl = is_numeric($configuredMaxTtl) ? (int) $configuredMaxTtl : ($isProducer ? 10000029 : 300);
        $ttl = max(1, min(
            $isProducer ? max($ttlSeconds ?? $defaultTtl, $defaultTtl) : ($ttlSeconds ?? $defaultTtl),
            $maxTtl,
        ));
        $expires = now()->addSeconds($ttl)->getTimestamp();
        $payload = "{$run->id}:{$role}:{$expires}";

        return [
            'expires' => $expires,
            'token' => hash_hmac('sha256', $payload, $secret),
        ];
    }

    public function publicUrl(FlowRun $run, string $role): string
    {
        $configuredUrl = config('services.browser_stream.public_url', '/browser-stream');
        $baseUrl = rtrim(is_string($configuredUrl) ? $configuredUrl : '/browser-stream', '/');
        $path = $role === self::ROLE_PRODUCER ? 'puppetflow' : 'stream';

        return "{$baseUrl}/{$path}/{$run->id}";
    }

    /** @param array{expires: int, token: string} $token */
    public function protocol(array $token): string
    {
        return "puppetflow-v1.{$token['expires']}.{$token['token']}";
    }
}
