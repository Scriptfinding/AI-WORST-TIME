<?php

namespace App\Providers;

use App\Authorization\AuthorizationContextFactory;
use App\Authorization\WorkspaceAccessEvaluator;
use App\Contracts\BrandingProvider;
use App\Contracts\FlowExecutionEngine;
use App\Services\Branding\DefaultBrandingProvider;
use App\Services\Flow\Source\FlowSourceService;
use App\Services\Flow\Source\Vendor\BitbucketFlowSourceHandler;
use App\Services\Flow\Source\Vendor\GiteaFlowSourceHandler;
use App\Services\Flow\Source\Vendor\GithubFlowSourceHandler;
use App\Services\Flow\Source\Vendor\GitlabFlowSourceHandler;
use App\Services\Integration\Ai\AiService;
use App\Services\Integration\Ai\AiCleanupHandler;
use App\Services\Integration\Ai\Vendor\Anthropic\AnthropicDriver;
use App\Services\Integration\Ai\Vendor\Gemini\GeminiDriver;
use App\Services\Integration\Ai\Vendor\Mistral\MistralDriver;
use App\Services\Integration\Ai\Vendor\OpenAi\OpenAiDriver;
use App\Services\Integration\Config\IntegrationConfigHydrator;
use App\Services\Integration\Http\IntegrationHttpClientFactory;
use App\Services\Integration\Messenger\MessengerCheckChain;
use App\Services\Integration\Messenger\MessengerCleanupHandler;
use App\Services\Integration\Messenger\MessengerService;
use App\Services\Integration\Messenger\Vendor\Discord\DiscordDriver as MessengerDiscord;
use App\Services\Integration\Messenger\Vendor\Discord\DiscordMessengerChecker;
use App\Services\Integration\Messenger\Vendor\Slack\SlackDriver as MessengerSlack;
use App\Services\Integration\Messenger\Vendor\Slack\SlackMessengerChecker;
use App\Services\Integration\Messenger\Vendor\Telegram\TelegramDriver as MessengerTelegram;
use App\Services\Integration\Messenger\Vendor\Telegram\TelegramMessengerChecker;
use App\Services\Integration\Other\Vendor\Mailbox\DnsService;
use App\Services\Integration\Other\Vendor\Mailbox\MailboxCleanupHandler;
use App\Services\Integration\Repository\RepositoryService;
use App\Services\Integration\Repository\Vendor\Bitbucket\BitbucketDriver as RepoBitbucket;
use App\Services\Integration\Repository\Vendor\Gitea\GiteaDriver as RepoGitea;
use App\Services\Integration\Repository\Vendor\Github\GithubDriver as RepoGithub;
use App\Services\Integration\Repository\Vendor\Gitlab\GitlabDriver as RepoGitlab;
use App\Services\Integration\Vault\VaultCleanupHandler;
use App\Services\Integration\Vault\VaultConfigHydrator;
use App\Services\Integration\Vault\VaultService;
use App\Services\Integration\Vault\VaultUrlCheckChain;
use App\Services\Integration\Vault\Vendor\Aws\AwsSecretsManagerDriver;
use App\Services\Integration\Vault\Vendor\Azure\AzureKeyVaultDriver;
use App\Services\Integration\Vault\Vendor\Hashicorp\HashicorpVaultDriver;
use App\Services\Integration\Vault\Vendor\OnePassword\OnePasswordDriver;
use App\Services\Integration\Vault\Vendor\OnePassword\OnePasswordUrlChecker;
use App\Services\Notification\NotificationService;
use App\Services\Notification\Vendor\DiscordDriver;
use App\Services\Notification\Vendor\SlackDriver;
use App\Services\Notification\Vendor\TelegramDriver;
use App\Services\Puppeteer\PuppeteerExecutionEngine;
use App\Services\Variable\TypeResolver\Resolver\OtpTypeResolver;
use App\Services\Variable\TypeResolver\Resolver\VaultTypeResolver;
use App\Services\Variable\TypeResolver\VariableTypeResolverChain;
use App\Services\Variable\VariableResolverService;
use App\Subscribers\Integration\IntegrationCleanupSubscriber;
use App\Subscribers\Integration\Messenger\MessengerValidationSubscriber;
use App\Subscribers\Integration\Other\Vendor\Mailbox\MailboxDomainSubscriber;
use App\Subscribers\Integration\Repository\RepositoryWebhookSubscriber;
use App\Subscribers\Integration\Repository\Vendor\Github\GithubRepositorySubscriber;
use App\Subscribers\Integration\Vault\VaultValidationSubscriber;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;
use Laravel\Passport\Passport;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(BrandingProvider::class, DefaultBrandingProvider::class);
        $this->app->bind(FlowExecutionEngine::class, PuppeteerExecutionEngine::class);
        $this->app->scoped(AuthorizationContextFactory::class);
        $this->app->scoped(WorkspaceAccessEvaluator::class);

        $this->app->singleton(NotificationService::class, function () {
            return new NotificationService(
                new TelegramDriver,
                new DiscordDriver,
                new SlackDriver,
            );
        });

        $this->app->singleton(AiService::class, function () {
            return new AiService([
                new OpenAiDriver,
                new GeminiDriver,
                new AnthropicDriver,
                new MistralDriver,
            ]);
        });

        $this->app->singleton(RepositoryService::class, function ($app) {
            $httpClients = $app->make(IntegrationHttpClientFactory::class);

            return new RepositoryService(
                new IntegrationConfigHydrator,
                new RepoGithub,
                new RepoGitlab($httpClients),
                new RepoBitbucket,
                new RepoGitea($httpClients),
            );
        });

        $this->app->singleton(VaultService::class, function ($app) {
            $httpClients = $app->make(IntegrationHttpClientFactory::class);
            $httpTargets = $app->make(\App\Services\Security\PublicHttpTargetGuard::class);

            return new VaultService(
                new VaultConfigHydrator,
                new OnePasswordDriver($httpClients),
                new HashicorpVaultDriver($httpClients),
                new AwsSecretsManagerDriver,
                new AzureKeyVaultDriver($httpTargets),
            );
        });

        $this->app->singleton(VaultUrlCheckChain::class, function ($app) {
            return new VaultUrlCheckChain(
                new OnePasswordUrlChecker(
                    $app->make(IntegrationHttpClientFactory::class),
                ),
            );
        });

        $this->app->singleton(MessengerService::class, function () {
            return new MessengerService(
                new MessengerTelegram,
                new MessengerDiscord,
                new MessengerSlack,
            );
        });

        $this->app->singleton(MessengerCheckChain::class, function () {
            return new MessengerCheckChain(
                new TelegramMessengerChecker,
                new DiscordMessengerChecker,
                new SlackMessengerChecker,
            );
        });

        $this->app->singleton(FlowSourceService::class, function ($app) {
            return new FlowSourceService(
                new GithubFlowSourceHandler($app->make(RepositoryService::class)),
                new GitlabFlowSourceHandler($app->make(RepositoryService::class)),
                new BitbucketFlowSourceHandler($app->make(RepositoryService::class)),
                new GiteaFlowSourceHandler($app->make(RepositoryService::class)),
            );
        });

        // Scoped so the vault resolver's integration memo resets between
        // requests and queue jobs.
        $this->app->scoped(VariableTypeResolverChain::class, function () {
            return new VariableTypeResolverChain(
                new VaultTypeResolver,
                new OtpTypeResolver,
            );
        });

        $this->app->scoped(VariableResolverService::class, function ($app) {
            return new VariableResolverService(
                $app->make(VariableTypeResolverChain::class),
                $app->make(AuthorizationContextFactory::class),
                $app->make(\App\Authorization\Visibility\SharedResourceVisibility::class),
            );
        });

        $this->app->singleton(DnsService::class);

        $this->app->singleton(IntegrationCleanupSubscriber::class, function () {
            return new IntegrationCleanupSubscriber(
                new AiCleanupHandler,
                new MessengerCleanupHandler,
                new VaultCleanupHandler,
                new MailboxCleanupHandler,
            );
        });
    }

    public function boot(): void
    {
        if (config('app.scheme') === 'https') {
            \Illuminate\Support\Facades\URL::forceScheme('https');
        }

        Passport::tokensCan([
            'mcp' => 'Use Puppetflow instance-level MCP tools.',
        ]);

        Passport::tokensExpireIn(now()->addHours(8));
        Passport::refreshTokensExpireIn(now()->addDays(30));

        Event::subscribe(subscriber: GithubRepositorySubscriber::class);
        Event::subscribe(subscriber: RepositoryWebhookSubscriber::class);
        Event::subscribe(subscriber: VaultValidationSubscriber::class);
        Event::subscribe(subscriber: MessengerValidationSubscriber::class);
        Event::subscribe(subscriber: MailboxDomainSubscriber::class);
        Event::subscribe(subscriber: IntegrationCleanupSubscriber::class);

    }
}
