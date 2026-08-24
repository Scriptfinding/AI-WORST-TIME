<?php

namespace App\Contracts\Integration;

use App\Enums\Integration\IntegrationCategoryEnum;

interface IntegrationProviderInterface
{
    public function category(): IntegrationCategoryEnum;

    public function label(): string;

    /**
     * Derive a connection status from the integration config.
     * Return null if the provider has no external setup flow.
     *
     * @param  array<string, mixed>  $config
     */
    public function resolveStatus(array $config): ?string;

    /**
     * Derive an external configuration URL from the integration config.
     * Return null if the provider has no external management page.
     *
     * @param  array<string, mixed>  $config
     */
    public function resolveExternalUrl(array $config): ?string;
}
