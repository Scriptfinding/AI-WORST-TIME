<?php

namespace App\Services\Integration\Vault;

use App\Contracts\Integration\Vault\VaultDriverInterface;
use App\DTO\Integration\IntegrationValidationResult;
use App\DTO\Integration\Vault\VaultConfig;
use App\Enums\Integration\IntegrationVaultProviderEnum;

class VaultService
{
    /** @var VaultDriverInterface[] */
    private array $drivers;

    public function __construct(
        private readonly VaultConfigHydrator $configHydrator,
        VaultDriverInterface ...$drivers,
    ) {
        $this->drivers = $drivers;
    }

    public function driver(IntegrationVaultProviderEnum $provider): VaultDriverInterface
    {
        foreach ($this->drivers as $driver) {
            if ($driver->supports($provider)) {
                return $driver;
            }
        }

        throw new \InvalidArgumentException("No vault driver supports provider: {$provider->value}");
    }

    /** @param VaultConfig|array<string, mixed> $config */
    public function validateCredentials(IntegrationVaultProviderEnum $provider, VaultConfig|array $config): IntegrationValidationResult
    {
        return $this->driver($provider)->validateCredentials($this->config($provider, $config));
    }

    /**
     * @param  VaultConfig|array<string, mixed>  $config
     * @return array<int, array{id: string, name: string}>
     */
    public function listVaults(IntegrationVaultProviderEnum $provider, VaultConfig|array $config): array
    {
        return $this->driver($provider)->listVaults($this->config($provider, $config));
    }

    /**
     * @param  VaultConfig|array<string, mixed>  $config
     * @return array<int, array{id: string, title: string, category: string}>
     */
    public function listItems(IntegrationVaultProviderEnum $provider, VaultConfig|array $config, string $vaultId): array
    {
        return $this->driver($provider)->listItems($this->config($provider, $config), $vaultId);
    }

    /**
     * @param  VaultConfig|array<string, mixed>  $config
     * @return array<int, array{id: string, label: string, type: string}>
     */
    public function listItemFields(IntegrationVaultProviderEnum $provider, VaultConfig|array $config, string $vaultId, string $itemId): array
    {
        return $this->driver($provider)->listItemFields($this->config($provider, $config), $vaultId, $itemId);
    }

    /** @param VaultConfig|array<string, mixed> $config */
    public function getSecret(IntegrationVaultProviderEnum $provider, VaultConfig|array $config, string $vaultId, string $itemId, string $fieldLabel, bool $raw = false): ?string
    {
        return $this->driver($provider)->getSecret($this->config($provider, $config), $vaultId, $itemId, $fieldLabel, $raw);
    }

    /** @param VaultConfig|array<string, mixed> $config */
    private function config(IntegrationVaultProviderEnum $provider, VaultConfig|array $config): VaultConfig
    {
        return $config instanceof VaultConfig
            ? $config
            : $this->configHydrator->hydrate($provider, $config);
    }
}
