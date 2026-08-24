<?php

namespace App\Services\Puppeteer;

use App\Models\FlowRun;
use App\Support\Flow\PinokioConfig;

final class RuntimeSecretManager
{
    public function __construct(private readonly PinokioConfig $pinokioConfig) {}

    public function merge(FlowRun $run, string $path): void
    {
        if (! file_exists($path) || ! is_string($content = file_get_contents($path)) || $content === '') {
            return;
        }

        $recorded = [];
        foreach (explode("\n", $content) as $line) {
            $value = $line !== '' ? json_decode($line, true) : null;
            if (is_string($value) && $value !== '') {
                $recorded[] = $value;
            }
        }
        if ($recorded === []) {
            return;
        }

        $current = $run->getAttribute('resolved_secrets');
        $current = is_array($current) ? $current : [];
        $merged = array_values(array_unique([...$current, ...$recorded]));
        if ($merged !== $current) {
            $run->update(['resolved_secrets' => $merged]);
        }
    }

    public function redact(FlowRun $run, ?string $value): ?string
    {
        $redacted = $run->redactResolvedSecrets($value);
        $value = is_string($redacted) || $redacted === null ? $redacted : $value;
        $token = $this->pinokioConfig->token;

        return $token !== '' && is_string($value)
            ? str_replace($token, '[REDACTED]', $value)
            : $value;
    }
}
