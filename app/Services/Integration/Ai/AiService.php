<?php

namespace App\Services\Integration\Ai;

use App\Contracts\Integration\Ai\AiProviderDriverInterface;
use App\Enums\Integration\IntegrationAiProviderEnum;
use App\Models\AiModel;
use App\Models\Integration;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\ValidationException;
use LogicException;

class AiService
{
    /** @var array<string, AiProviderDriverInterface> */
    private array $drivers = [];

    /** @param iterable<AiProviderDriverInterface> $drivers */
    public function __construct(iterable $drivers)
    {
        foreach ($drivers as $driver) {
            $this->drivers[$driver->provider()->value] = $driver;
        }
    }

    public function driver(IntegrationAiProviderEnum $provider): AiProviderDriverInterface
    {
        return $this->drivers[$provider->value]
            ?? throw new LogicException("No AI driver is registered for {$provider->value}.");
    }

    /** @return list<array<string, mixed>> */
    public function listModels(IntegrationAiProviderEnum $provider, string $apiKey, bool $refresh = false): array
    {
        $cacheKey = 'ai-models:v3:'.$provider->value.':'.hash('sha256', $apiKey);
        if ($refresh) {
            Cache::forget($cacheKey);
        }

        return Cache::remember($cacheKey, now()->addMinutes(10), fn (): array => $this->driver($provider)->listModels($apiKey));
    }

    /**
     * @param  array<string, mixed>  $config
     * @return array<string, mixed>
     */
    public function validateConfig(
        IntegrationAiProviderEnum $provider,
        array $config,
        ?Integration $existing = null,
        bool $verifyRemote = true,
    ): array {
        $existingConfig = $existing instanceof Integration ? ($existing->config ?? []) : [];
        $merged = array_merge($existingConfig, $config);
        if (($config['api_key'] ?? null) === '' && $existing instanceof Integration) {
            $merged['api_key'] = $existing->config['api_key'] ?? null;
        }

        $apiKey = $merged['api_key'] ?? null;
        if (! is_string($apiKey) || trim($apiKey) === '') {
            throw ValidationException::withMessages(['config.api_key' => 'An API key is required.']);
        }

        if ($verifyRemote) {
            $this->listModels($provider, $apiKey, true);
        }

        $merged['api_key'] = trim($apiKey);

        return $merged;
    }

    /**
     * @param  list<array<string, mixed>>  $messages
     * @param  array<string, mixed>  $options
     * @return array<string, mixed>
     */
    public function execute(
        AiModel $aiModel,
        string $capability,
        array $messages,
        array $options = [],
    ): array {
        $integration = $aiModel->aiIntegration;
        if (! $integration instanceof Integration) {
            throw ValidationException::withMessages(['ai_model_id' => 'The linked AI integration is unavailable.']);
        }
        $provider = $integration->aiProvider();
        $config = $integration->config ?? [];
        $apiKey = $config['api_key'] ?? null;
        if (! is_string($apiKey) || $apiKey === '') {
            throw ValidationException::withMessages(['ai_model_id' => 'The linked AI integration has no API key.']);
        }

        $capabilities = $aiModel->capabilities;
        if (($capabilities[$capability] ?? false) !== true) {
            throw ValidationException::withMessages([
                'ai_model_id' => "This AI model does not support {$capability} input.",
            ]);
        }

        $result = $this->driver($provider)->message(
            $apiKey,
            $aiModel->ai_model_id,
            $messages,
            $options,
        );
        $result['provider'] = $provider->value;

        return $result;
    }
}
