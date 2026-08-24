<?php

namespace App\DTO\Integration\Repository;

use App\Contracts\Integration\Repository\RepositoryConfig;
use App\DTO\Integration\Config\AbstractPersistedIntegrationConfig;

final readonly class GiteaRepositoryConfig extends AbstractPersistedIntegrationConfig implements RepositoryConfig
{
    /** @param array<string, mixed> $values */
    public static function fromArray(array $values): self
    {
        return new self($values);
    }

    public function baseUrl(): string
    {
        return $this->string('base_url', 'https://gitea.com');
    }

    public function internalUrl(): ?string
    {
        return $this->nullableString('internal_url');
    }

    public function clientId(): string
    {
        return $this->string('client_id');
    }

    public function clientSecret(): string
    {
        return $this->string('client_secret');
    }

    public function redirectUri(): ?string
    {
        return $this->nullableString('redirect_uri');
    }

    public function accessToken(): string
    {
        return $this->string('access_token');
    }

    public function authorizeUrl(): ?string
    {
        return $this->nullableString('authorize_url');
    }

    public function withAuthorizeUrl(string $authorizeUrl): self
    {
        return new self($this->replacing('authorize_url', $authorizeUrl));
    }

    /** @param array<string, mixed> $tokens */
    public function withOAuthTokens(array $tokens): self
    {
        return new self($this->merging($tokens));
    }
}
