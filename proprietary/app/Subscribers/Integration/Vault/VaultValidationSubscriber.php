<?php

namespace App\Subscribers\Integration\Vault;

use App\DTO\Integration\Vault\OnePasswordVaultConfig;
use App\Events\Integration\Vault\VaultValidationRequested;
use App\Services\Integration\Vault\VaultConfigHydrator;
use App\Services\Integration\Vault\VaultService;
use App\Services\Integration\Vault\VaultUrlCheckChain;
use Illuminate\Events\Dispatcher;

class VaultValidationSubscriber
{
    public function __construct(
        private readonly VaultUrlCheckChain $urlCheckChain,
        private readonly VaultService $vaultService,
        private readonly VaultConfigHydrator $configHydrator,
    ) {}

    public function handleValidation(VaultValidationRequested $event): void
    {
        $integration = $event->integration;
        $provider = $integration->vaultProvider();
        $config = $this->configHydrator->hydrate($provider, $integration->config ?? []);

        if ($this->urlCheckChain->supports($provider)) {
            if (! $config instanceof OnePasswordVaultConfig) {
                throw new \LogicException('URL checks require 1Password configuration.');
            }
            $urlCheck = $this->urlCheckChain->check($provider, $config->serverUrl());

            if (! $urlCheck->valid) {
                $event->result = $urlCheck;

                return;
            }
        }

        $event->result = $this->vaultService->validateCredentials($provider, $config);
    }

    public function subscribe(Dispatcher $events): void
    {
        $events->listen(
            VaultValidationRequested::class,
            [self::class, 'handleValidation'],
        );
    }
}
