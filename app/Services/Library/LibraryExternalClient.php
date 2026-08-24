<?php

namespace App\Services\Library;

use App\DTO\Library\LibraryStats;
use Illuminate\Support\Facades\Http;

class LibraryExternalClient
{
    private function baseUrl(): string
    {
        $configuredUrl = config('puppetflow.blueprints_api_url');
        if (! is_string($configuredUrl) || $configuredUrl === '') {
            throw new \LogicException('The Blueprints API URL is not configured.');
        }

        return rtrim($configuredUrl, '/');
    }

    /** @return array<string, mixed>|null */
    public function catalog(): ?array
    {
        try {
            $response = Http::timeout(15)->get($this->baseUrl());
            $payload = $response->successful() ? $response->json() : null;

            /** @var array<string, mixed>|null $payload */
            return is_array($payload) ? $payload : null;
        } catch (\Throwable) {
            return null;
        }
    }

    /**
     * @param  list<string>  $keys
     * @return array<string, LibraryStats>
     */
    public function stats(array $keys, ?string $identityHash = null): array
    {
        if (empty($keys)) {
            return [];
        }

        try {
            $query = [
                'keys' => implode(',', $keys),
            ];
            if ($identityHash) {
                $query['identity_hash'] = $identityHash;
            }

            $response = Http::timeout(5)->get($this->baseUrl().'/stats', $query);

            $payload = $response->successful() ? $response->json('stats') : null;
            if (! is_array($payload)) {
                return [];
            }

            $stats = [];
            foreach ($payload as $key => $value) {
                if (is_string($key)) {
                    $stats[$key] = LibraryStats::fromValue($value);
                }
            }

            return $stats;
        } catch (\Throwable) {
            return [];
        }
    }

    /**
     * @param  array<string, mixed>  $metadata
     */
    public function recordEvent(int $externalId, string $event, string $identityHash, array $metadata = []): ?LibraryStats
    {
        try {
            $response = Http::timeout(5)->post($this->baseUrl()."/{$externalId}/events", [
                'event' => $event,
                'identity_hash' => $identityHash,
                'source_app' => 'core',
                'metadata' => $metadata,
            ]);

            $stats = $response->successful() ? $response->json('stats') : null;

            return is_array($stats) ? LibraryStats::fromValue($stats) : null;
        } catch (\Throwable) {
            return null;
        }
    }

    /**
     * @param  array<string, mixed>  $metadata
     * @return array<string, mixed>|null
     */
    public function upvote(int $externalId, string $identityHash, array $metadata = []): ?array
    {
        try {
            $response = Http::timeout(5)->post($this->baseUrl()."/{$externalId}/upvote", [
                'identity_hash' => $identityHash,
                'metadata' => $metadata,
            ]);

            $data = $response->successful() ? $response->json() : null;

            /** @var array<string, mixed>|null $data */
            return is_array($data) ? $data : null;
        } catch (\Throwable) {
            return null;
        }
    }

    public function identityHash(?string $workspaceId, ?string $userId): string
    {
        $configuredKey = config('app.key');
        $appKey = is_string($configuredKey) ? $configuredKey : '';
        $payload = implode(':', [$workspaceId ?: 'none', $userId ?: 'none']);

        return hash_hmac('sha256', $payload, $appKey ?: 'puppetflow-library');
    }
}
