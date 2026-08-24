<?php

namespace App\Services\Flow\Source;

use App\Contracts\Flow\Source\FlowSourceHandlerInterface;
use App\Enums\Authorization\Ability;
use App\Enums\Integration\IntegrationCategoryEnum;
use App\Enums\Integration\IntegrationRepositoryProviderEnum;
use App\Models\Flow;
use App\Models\FlowRepositoryLink;
use App\Models\Integration;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;

class FlowSourceService
{
    /** @var FlowSourceHandlerInterface[] */
    private array $handlers;

    public function __construct(FlowSourceHandlerInterface ...$handlers)
    {
        $this->handlers = $handlers;
    }

    public function resolveCode(Flow $flow, ?User $actor): ?string
    {
        if (! $actor) {
            return null;
        }

        $link = $flow->repositoryLink;
        if (! $link instanceof FlowRepositoryLink) {
            return null;
        }

        $link->loadMissing('integration');
        $integration = $link->integration;
        $workspaceId = $integration instanceof Integration
            ? $integration->getAttribute('workspace_id')
            : null;

        if (
            ! $integration instanceof Integration
            || ! (bool) $integration->getAttribute('is_active')
            || (bool) $integration->getAttribute('stale')
            || ! is_scalar($workspaceId)
            || $workspaceId !== $flow->workspace_id
            || $integration->getRawOriginal('category') !== IntegrationCategoryEnum::REPOSITORY->value
            || ! Gate::forUser($actor)->allows(Ability::USE->value, $integration)
        ) {
            return null;
        }

        $providerValue = $integration->getRawOriginal('provider');
        $provider = is_string($providerValue)
            ? IntegrationRepositoryProviderEnum::tryFrom($providerValue)
            : null;
        if (! $provider) {
            return null;
        }

        $handler = $this->handlerFor($provider);
        if (! $handler) {
            return null;
        }

        try {
            return $handler->resolveCode($link, $integration);
        } catch (\Throwable) {
            Log::warning('FlowSource: failed to resolve repository code.', [
                'flow_id' => $flow->id,
                'provider' => $provider->value,
            ]);

            return null;
        }
    }

    public function syncLink(FlowRepositoryLink $link): bool
    {
        $link->loadMissing('integration');
        $integration = $link->integration;

        if (
            ! $integration instanceof Integration
            || ! (bool) $integration->getAttribute('is_active')
        ) {
            return false;
        }

        $providerValue = $integration->getRawOriginal('provider');
        $provider = is_string($providerValue)
            ? IntegrationRepositoryProviderEnum::tryFrom($providerValue)
            : null;
        if (! $provider) {
            return false;
        }

        $handler = $this->handlerFor($provider);
        if (! $handler) {
            return false;
        }

        try {
            return $handler->syncLink($link, $integration);
        } catch (\Throwable) {
            Log::warning('FlowSource: repository sync failed.', [
                'flow_id' => $link->flow_id,
                'provider' => $provider->value,
            ]);

            return false;
        }
    }

    /**
     * @return array{authenticated: bool, valid_payload: bool, synced: int}
     */
    public function processWebhook(string $provider, string $webhookId, Request $request): array
    {
        $enum = IntegrationRepositoryProviderEnum::tryFrom($provider);
        if (! $enum) {
            return $this->webhookResult(false);
        }

        $handler = $this->handlerFor($enum);
        if (! $handler) {
            return $this->webhookResult(false);
        }

        $rawBody = $request->getContent();
        $integration = Integration::query()
            ->where('webhook_id', $webhookId)
            ->where('category', IntegrationCategoryEnum::REPOSITORY->value)
            ->where('provider', $enum->value)
            ->where('is_active', true)
            ->where('stale', false)
            ->with('user')
            ->first();

        if (! $integration instanceof Integration) {
            return $this->webhookResult(false);
        }

        try {
            $verified = $handler->verifyWebhook($integration, $rawBody, $request);
        } catch (\Throwable) {
            $verified = false;
        }
        if (! $verified) {
            return $this->webhookResult(false);
        }

        try {
            $payload = json_decode($rawBody, true, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            return $this->webhookResult(true, false);
        }

        if (! is_array($payload)) {
            return $this->webhookResult(true, false);
        }

        /** @var array<string, mixed> $payload */
        return $this->webhookResult(
            true,
            true,
            $handler->processWebhook($payload, new Collection([$integration]), $request),
        );
    }

    /**
     * @return array{authenticated: bool, valid_payload: bool, synced: int}
     */
    private function webhookResult(bool $authenticated, bool $validPayload = true, int $synced = 0): array
    {
        return [
            'authenticated' => $authenticated,
            'valid_payload' => $validPayload,
            'synced' => $synced,
        ];
    }

    private function handlerFor(IntegrationRepositoryProviderEnum $provider): ?FlowSourceHandlerInterface
    {
        foreach ($this->handlers as $handler) {
            if ($handler->supports($provider)) {
                return $handler;
            }
        }

        return null;
    }
}
