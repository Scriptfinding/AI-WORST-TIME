<?php

namespace App\Enums\Integration;

use App\Contracts\Integration\InitializesIntegrationConfig;
use App\Contracts\Integration\IntegrationProviderInterface;
use App\DTO\Integration\Repository\BitbucketRepositoryConfig;
use App\DTO\Integration\Repository\GiteaRepositoryConfig;
use App\DTO\Integration\Repository\GithubRepositoryConfig;
use App\DTO\Integration\Repository\GitlabRepositoryConfig;
use App\Models\Integration;

enum IntegrationRepositoryProviderEnum: string implements InitializesIntegrationConfig, IntegrationProviderInterface
{
    case GITHUB = 'github';
    case GITLAB = 'gitlab';
    case BITBUCKET = 'bitbucket';
    case GITEA = 'gitea';

    public function category(): IntegrationCategoryEnum
    {
        return IntegrationCategoryEnum::REPOSITORY;
    }

    public function label(): string
    {
        return match ($this) {
            self::GITHUB => 'GitHub',
            self::GITLAB => 'GitLab',
            self::BITBUCKET => 'Bitbucket',
            self::GITEA => 'Gitea',
        };
    }

    /** @param array<string, mixed> $config */
    public function resolveStatus(array $config): string
    {
        return match ($this) {
            self::GITHUB => GithubRepositoryConfig::fromArray($config)->appId() === null ? 'pending' : 'connected',
            self::GITLAB => GitlabRepositoryConfig::fromArray($config)->accessToken() === '' ? 'pending' : 'connected',
            self::BITBUCKET => BitbucketRepositoryConfig::fromArray($config)->apiToken() === '' ? 'pending' : 'connected',
            self::GITEA => GiteaRepositoryConfig::fromArray($config)->accessToken() === '' ? 'pending' : 'connected',
        };
    }

    /** @param array<string, mixed> $config */
    public function resolveExternalUrl(array $config): ?string
    {
        return match ($this) {
            self::GITHUB => ($slug = GithubRepositoryConfig::fromArray($config)->slug()) !== ''
                ? "https://github.com/apps/{$slug}/installations/new"
                : null,
            self::GITLAB => GitlabRepositoryConfig::fromArray($config)->authorizeUrl(),
            self::GITEA => GiteaRepositoryConfig::fromArray($config)->authorizeUrl(),
            self::BITBUCKET => null,
        };
    }

    /**
     * @param  array<string, mixed>  $config
     * @return array<string, mixed>
     */
    public function initializeConfig(array $config, Integration $integration): array
    {
        return match ($this) {
            self::GITLAB => GitlabRepositoryConfig::fromArray($config)
                ->withAuthorizeUrl(route('integrations.gitlab.authorize', $integration))
                ->toArray(),
            self::GITEA => GiteaRepositoryConfig::fromArray($config)
                ->withAuthorizeUrl(route('integrations.gitea.authorize', $integration))
                ->toArray(),
            default => $config,
        };
    }
}
