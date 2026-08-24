<?php

namespace App\Services\Integration\Config;

use App\Contracts\Integration\Repository\RepositoryConfig;
use App\DTO\Integration\Messenger\MessengerConfig;
use App\DTO\Integration\Repository\BitbucketRepositoryConfig;
use App\DTO\Integration\Repository\GiteaRepositoryConfig;
use App\DTO\Integration\Repository\GithubRepositoryConfig;
use App\DTO\Integration\Repository\GitlabRepositoryConfig;
use App\Enums\Integration\IntegrationMessengerProviderEnum;
use App\Enums\Integration\IntegrationRepositoryProviderEnum;

final class IntegrationConfigHydrator
{
    /** @param array<string, mixed> $config */
    public function messenger(IntegrationMessengerProviderEnum $provider, array $config): MessengerConfig
    {
        return MessengerConfig::fromArray($config);
    }

    /** @param array<string, mixed> $config */
    public function repository(IntegrationRepositoryProviderEnum $provider, array $config): RepositoryConfig
    {
        return match ($provider) {
            IntegrationRepositoryProviderEnum::GITHUB => GithubRepositoryConfig::fromArray($config),
            IntegrationRepositoryProviderEnum::GITLAB => GitlabRepositoryConfig::fromArray($config),
            IntegrationRepositoryProviderEnum::GITEA => GiteaRepositoryConfig::fromArray($config),
            IntegrationRepositoryProviderEnum::BITBUCKET => BitbucketRepositoryConfig::fromArray($config),
        };
    }
}
