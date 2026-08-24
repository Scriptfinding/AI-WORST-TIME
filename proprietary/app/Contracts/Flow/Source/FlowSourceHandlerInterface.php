<?php

namespace App\Contracts\Flow\Source;

use App\Enums\Integration\IntegrationRepositoryProviderEnum;
use App\Models\FlowRepositoryLink;
use App\Models\Integration;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;

interface FlowSourceHandlerInterface
{
    public function supports(IntegrationRepositoryProviderEnum $provider): bool;

    public function resolveCode(FlowRepositoryLink $link, Integration $integration): ?string;

    public function syncLink(FlowRepositoryLink $link, Integration $integration): bool;

    public function verifyWebhook(Integration $integration, string $rawBody, Request $request): bool;

    /**
     * @param  array<string, mixed>  $payload
     * @param  Collection<int, Integration>  $integrations
     * @return int Number of flows synced.
     */
    public function processWebhook(array $payload, Collection $integrations, Request $request): int;
}
