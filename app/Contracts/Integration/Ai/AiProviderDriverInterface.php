<?php

namespace App\Contracts\Integration\Ai;

use App\Enums\Integration\IntegrationAiProviderEnum;

interface AiProviderDriverInterface
{
    public function provider(): IntegrationAiProviderEnum;

    /** @return list<array<string, mixed>> */
    public function listModels(string $apiKey): array;

    /**
     * @param  list<array<string, mixed>>  $messages
     * @param  array<string, mixed>  $options
     * @return array<string, mixed>
     */
    public function message(string $apiKey, string $model, array $messages, array $options = []): array;
}
