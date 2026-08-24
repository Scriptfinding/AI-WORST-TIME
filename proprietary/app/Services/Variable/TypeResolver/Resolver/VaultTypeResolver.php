<?php

namespace App\Services\Variable\TypeResolver\Resolver;

use App\Contracts\Variable\TypeResolver\VariableTypeResolverInterface;
use App\Enums\Integration\IntegrationVaultProviderEnum;
use App\Models\Integration;
use App\Models\UserVariable;
use App\Services\FeatureFlags\FeatureFlagService;
use App\Services\Integration\Vault\VaultService;
use Illuminate\Support\Facades\Log;

class VaultTypeResolver implements VariableTypeResolverInterface
{
    /**
     * Vault variables usually share one integration; memoize lookups (nulls
     * included) so a run bootstrap costs one query per integration instead of
     * one per variable. The chain is container-scoped, so this resets between
     * requests and queue jobs.
     *
     * @var array<string, Integration|null>
     */
    private array $integrations = [];

    public function supports(string $type): bool
    {
        return $type === 'vault';
    }

    public function isSecret(): bool
    {
        return true;
    }

    public function resolveValue(UserVariable $var, string $workspaceId): ?string
    {
        return $this->fetchSecret($var->value, $workspaceId, $var->vault_integration_id);
    }

    public function buildEnvEntry(UserVariable $var, string $workspaceId): array
    {
        $isOtp = $var->vault_field_type === 'OTP';
        $value = $this->fetchSecret($var->value, $workspaceId, $var->vault_integration_id, raw: $isOtp);

        return [
            'value' => $value,
            'vault_field_type' => $var->vault_field_type,
        ];
    }

    private function fetchSecret(string $reference, string $workspaceId, ?string $integrationId = null, bool $raw = false): ?string
    {
        if (! app(FeatureFlagService::class)->enabled('vaults_enabled')) {
            return null;
        }

        if (! preg_match('#^(\w+)://(.+)/(.+)/(.+)$#', $reference, $matches)) {
            return null;
        }

        [, $providerStr, $vaultId, $itemId, $fieldLabel] = $matches;
        $vaultId = rawurldecode($vaultId);
        $itemId = rawurldecode($itemId);
        $fieldLabel = rawurldecode($fieldLabel);

        $provider = IntegrationVaultProviderEnum::tryFrom($providerStr);
        if (! $provider) {
            Log::warning("Unknown vault provider: {$providerStr}", ['workspace_id' => $workspaceId]);

            return null;
        }

        $cacheKey = $integrationId ? "id:{$integrationId}:{$workspaceId}" : "provider:{$providerStr}:{$workspaceId}";
        if (! array_key_exists($cacheKey, $this->integrations)) {
            $this->integrations[$cacheKey] = $integrationId
                ? Integration::where('id', $integrationId)
                    ->where('workspace_id', $workspaceId)
                    ->where('is_active', true)
                    ->where('stale', false)
                    ->first()
                : Integration::where('workspace_id', $workspaceId)
                    ->where('provider', $providerStr)
                    ->where('is_active', true)
                    ->where('stale', false)
                    ->vault()
                    ->first();
        }
        $integration = $this->integrations[$cacheKey];

        if (! $integration) {
            Log::warning("No active vault integration for provider: {$providerStr}", ['workspace_id' => $workspaceId]);

            return null;
        }

        try {
            return app(VaultService::class)->getSecret($provider, $integration->config ?? [], $vaultId, $itemId, $fieldLabel, $raw);
        } catch (\Throwable $e) {
            Log::warning("Failed to resolve vault secret: {$e->getMessage()}", [
                'provider' => $provider,
                'workspace_id' => $workspaceId,
            ]);

            return null;
        }
    }
}
