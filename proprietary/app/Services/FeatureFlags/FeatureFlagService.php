<?php

namespace App\Services\FeatureFlags;

use App\Enums\Integration\IntegrationCategoryEnum;
use App\Models\AiModel;
use App\Models\Integration;
use App\Models\Mailbox;
use App\Models\MailboxDomain;
use App\Models\MailboxWatcher;
use App\Models\McpAccessToken;
use App\Models\McpOauthClient;
use App\Models\McpOauthConnection;
use App\Models\NotificationChannel;
use App\Models\PrivateLibrary;
use App\Models\Snippet;
use App\Models\UserVariable;
use App\Models\WorkspaceMcpSetting;
use App\Services\Licensing\LicenseManager;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class FeatureFlagService
{
    private const DISABLED_FEATURE_MESSAGE = 'This feature is not available on your instance.';

    /** @var array<string, mixed>|null */
    private ?array $resolvedFlags = null;

    private const ENABLED_DEFAULTS = [
        'snippets_enabled' => true,
        'variables_enabled' => true,
        'run_metadata_search_enabled' => false,
        'mcp_enabled' => true,
        'messenger_enabled' => true,
        'mailbox_enabled' => true,
        'ai_enabled' => true,
        'live_view_enabled' => true,
        'recording_enabled' => false,
        'teams_enabled' => false,
        'workspace_sharing_enabled' => false,
        'two_factor_enforcement_enabled' => false,
        'vaults_enabled' => false,
        'vcs_enabled' => false,
        'private_libraries_enabled' => false,
        'whitelabel_enabled' => false,
        'sso_enabled' => false,
        'github_stargazers' => true,
    ];

    private const LIMIT_DEFAULTS = [
        'workspace_limit' => -1,
        'concurrent_runs_limit' => -1,
        'maximum_retention_limit' => 0,
        'maximum_timeout_seconds' => 0,
        'maximum_retries_limit' => 5,
        'cycle_freq' => 0,
        'cycle_runs_limit' => 0,
        'instance_storage_limit_bytes' => 0,
    ];

    private const PROMOTION_DEFAULTS = [
        'promote_disabled_features' => true,
        'promote_disabled_features_reason' => 'Upgrade your plan to unlock this feature.',
    ];

    /**
     * @return array<string, mixed>
     */
    public function all(): array
    {
        if ($this->resolvedFlags !== null) {
            return $this->resolvedFlags;
        }

        $configuredFlags = config('puppetflow.feature_flags', []);
        $configured = array_filter(
            is_array($configuredFlags) ? $configuredFlags : [],
            fn ($value) => $value !== null
        );
        $licensed = app(LicenseManager::class)->applicableFeatureFlags();
        $licensedDefaults = $licensed === null
            ? []
            : array_fill_keys(array_keys(self::ENABLED_DEFAULTS), false);

        return $this->resolvedFlags = [
            ...self::ENABLED_DEFAULTS,
            ...self::LIMIT_DEFAULTS,
            ...self::PROMOTION_DEFAULTS,
            ...$configured,
            ...$licensedDefaults,
            ...($licensed ?? []),
        ];
    }

    public function enabled(string $flag): bool
    {
        return filter_var($this->all()[$flag] ?? true, FILTER_VALIDATE_BOOL);
    }

    public function limit(string $flag): int
    {
        $value = $this->all()[$flag] ?? -1;

        return is_int($value) ? $value : (is_numeric($value) ? (int) $value : -1);
    }

    public function maximumRetentionLimit(): int
    {
        return max(0, $this->limit('maximum_retention_limit'));
    }

    public function maximumTimeoutSeconds(): int
    {
        return max(0, $this->limit('maximum_timeout_seconds'));
    }

    public function maximumRetriesLimit(): int
    {
        return max(0, $this->limit('maximum_retries_limit'));
    }

    public function teamsEnabled(): bool
    {
        return $this->enabled('teams_enabled');
    }

    public function workspaceSharingEnabled(): bool
    {
        return $this->enabled('workspace_sharing_enabled');
    }

    /**
     * Scopes a resource may use given the current flags. The owner-level
     * scope name differs per resource ('owner' or 'user'), hence the param.
     */
    /**
     * @return list<string>
     */
    public function allowedScopes(string $ownerScope = 'owner'): array
    {
        $scopes = [$ownerScope];

        if ($this->workspaceSharingEnabled()) {
            $scopes[] = 'workspace';
        }

        if ($this->teamsEnabled()) {
            $scopes[] = 'team';
        }

        return $scopes;
    }

    /**
     * Whether workspace pivot roles (admin/manager) are honored. When off,
     * every workspace member is evaluated as a plain member; only instance
     * admins keep elevated powers.
     */
    public function sharingRolesEnabled(): bool
    {
        return $this->workspaceSharingEnabled();
    }

    /**
     * Whether a workspace pivot role grants admin-level powers, taking the
     * sharing feature flag into account.
     */
    public function workspaceRoleGrantsAdmin(?string $role): bool
    {
        return $this->sharingRolesEnabled() && $role === 'admin';
    }

    public function promoteDisabledFeatures(): bool
    {
        return filter_var($this->all()['promote_disabled_features'] ?? false, FILTER_VALIDATE_BOOL);
    }

    public function disabledFeatureMessage(): string
    {
        $value = $this->all()['promote_disabled_features_reason'] ?? '';
        $reason = is_scalar($value) ? trim((string) $value) : '';

        return $reason === ''
            ? self::DISABLED_FEATURE_MESSAGE
            : self::DISABLED_FEATURE_MESSAGE.' '.$reason;
    }

    /**
     * @return array<string, bool|int|string>
     */
    public function frontendSettings(): array
    {
        return [
            'snippets_enabled' => $this->enabled('snippets_enabled'),
            'variables_enabled' => $this->enabled('variables_enabled'),
            'run_metadata_search_enabled' => $this->enabled('run_metadata_search_enabled'),
            'mcp_enabled' => $this->enabled('mcp_enabled'),
            'private_libraries_enabled' => $this->enabled('private_libraries_enabled'),
            'vaults_enabled' => $this->enabled('vaults_enabled'),
            'messenger_enabled' => $this->enabled('messenger_enabled'),
            'mailbox_enabled' => $this->enabled('mailbox_enabled'),
            'ai_enabled' => $this->enabled('ai_enabled'),
            'vcs_enabled' => $this->enabled('vcs_enabled'),
            'recording_enabled' => $this->enabled('recording_enabled'),
            'live_view_enabled' => $this->enabled('live_view_enabled'),
            'teams_enabled' => $this->enabled('teams_enabled'),
            'workspace_sharing_enabled' => $this->enabled('workspace_sharing_enabled'),
            'two_factor_enforcement_enabled' => $this->enabled('two_factor_enforcement_enabled'),
            'whitelabel_enabled' => $this->enabled('whitelabel_enabled'),
            'sso_enabled' => $this->enabled('sso_enabled'),
            'github_stargazers' => $this->enabled('github_stargazers'),
            'workspace_limit' => $this->limit('workspace_limit'),
            'concurrent_runs_limit' => $this->limit('concurrent_runs_limit'),
            'maximum_retention_limit' => $this->maximumRetentionLimit(),
            'maximum_timeout_seconds' => $this->maximumTimeoutSeconds(),
            'maximum_retries_limit' => $this->maximumRetriesLimit(),
            'max_flow_timeout_seconds' => $this->maximumTimeoutSeconds(),
            'promote_disabled_features' => $this->promoteDisabledFeatures(),
            'disabled_feature_message' => $this->disabledFeatureMessage(),
        ];
    }

    public function ensureFreshResources(): void
    {
        $this->syncStaleStates();
    }

    /**
     * @return array<string, array{enabled: bool, stale: bool, updated: int}>
     */
    public function syncStaleStates(): array
    {
        $summary = [];

        $summary['snippets'] = $this->syncModelStale(Snippet::class, $this->enabled('snippets_enabled'));
        $summary['user_variables'] = $this->syncModelStale(UserVariable::class, $this->enabled('variables_enabled'));
        $summary['private_libraries'] = $this->syncModelStale(PrivateLibrary::class, $this->enabled('private_libraries_enabled'));
        $summary['notification_channels'] = $this->syncModelStale(NotificationChannel::class, $this->enabled('messenger_enabled'));
        $summary['ai_models'] = $this->syncModelStale(AiModel::class, $this->enabled('ai_enabled'));
        $summary['mailbox_domains'] = $this->syncModelStale(MailboxDomain::class, $this->enabled('mailbox_enabled'));
        $summary['mailboxes'] = $this->syncModelStale(Mailbox::class, $this->enabled('mailbox_enabled'));
        $summary['mailbox_watchers'] = $this->syncModelStale(MailboxWatcher::class, $this->enabled('mailbox_enabled'));

        $mcpEnabled = $this->enabled('mcp_enabled');
        $summary['workspace_mcp_settings'] = $this->syncModelStale(WorkspaceMcpSetting::class, $mcpEnabled);
        $summary['mcp_access_tokens'] = $this->syncModelStale(McpAccessToken::class, $mcpEnabled);
        $summary['mcp_oauth_clients'] = $this->syncModelStale(McpOauthClient::class, $mcpEnabled);
        $summary['mcp_oauth_connections'] = $this->syncModelStale(McpOauthConnection::class, $mcpEnabled);

        $summary['vault_integrations'] = $this->syncIntegrationStale(IntegrationCategoryEnum::VAULT, $this->enabled('vaults_enabled'));
        $summary['ai_integrations'] = $this->syncIntegrationStale(IntegrationCategoryEnum::AI, $this->enabled('ai_enabled'));
        $summary['messenger_integrations'] = $this->syncIntegrationStale(IntegrationCategoryEnum::MESSENGER, $this->enabled('messenger_enabled'));
        $summary['repository_integrations'] = $this->syncIntegrationStale(IntegrationCategoryEnum::REPOSITORY, $this->enabled('vcs_enabled'));
        $summary['mailbox_integrations'] = $this->syncMailboxIntegrationStale($this->enabled('mailbox_enabled'));

        return $summary;
    }

    public function abortIfDisabled(string $flag): void
    {
        abort_unless($this->enabled($flag), 404, $this->disabledFeatureMessage());
    }

    public function abortIfStale(Model $model): void
    {
        abort_if((bool) ($model->getAttribute('stale') ?? false), 404);
    }

    public function abortIfIntegrationUnavailable(Integration $integration): void
    {
        $this->abortIfDisabled($this->flagForIntegrationCategory($integration->category));
        $this->abortIfStale($integration);
    }

    public function flagForIntegrationCategory(IntegrationCategoryEnum|string $category): string
    {
        $value = $category instanceof IntegrationCategoryEnum ? $category->value : $category;

        return match ($value) {
            IntegrationCategoryEnum::AI->value => 'ai_enabled',
            IntegrationCategoryEnum::VAULT->value => 'vaults_enabled',
            IntegrationCategoryEnum::MESSENGER->value => 'messenger_enabled',
            IntegrationCategoryEnum::REPOSITORY->value => 'vcs_enabled',
            default => 'other_enabled',
        };
    }

    public function abortIfWorkspaceLimitReached(): void
    {
        $limit = $this->limit('workspace_limit');
        if ($limit < 0) {
            return;
        }

        abort_if(DB::table('workspaces')->count() >= $limit, 403, 'Workspace limit reached.');
    }

    /**
     * @param  class-string<Model>  $modelClass
     * @return array{enabled: bool, stale: bool, updated: int}
     */
    private function syncModelStale(string $modelClass, bool $enabled): array
    {
        $table = (new $modelClass)->getTable();
        if (! Schema::hasTable($table) || ! Schema::hasColumn($table, 'stale')) {
            return [
                'enabled' => $enabled,
                'stale' => ! $enabled,
                'updated' => 0,
            ];
        }

        $targetStale = ! $enabled;
        $updated = $modelClass::query()
            ->where('stale', ! $targetStale)
            ->update(['stale' => $targetStale]);

        return [
            'enabled' => $enabled,
            'stale' => $targetStale,
            'updated' => $updated,
        ];
    }

    /**
     * @return array{enabled: bool, stale: bool, updated: int}
     */
    private function syncIntegrationStale(IntegrationCategoryEnum $category, bool $enabled): array
    {
        if (! Schema::hasTable('integrations') || ! Schema::hasColumn('integrations', 'stale')) {
            return [
                'enabled' => $enabled,
                'stale' => ! $enabled,
                'updated' => 0,
            ];
        }

        $targetStale = ! $enabled;
        $updated = Integration::where('category', $category->value)
            ->where('stale', ! $targetStale)
            ->update(['stale' => $targetStale]);

        return [
            'enabled' => $enabled,
            'stale' => $targetStale,
            'updated' => $updated,
        ];
    }

    /**
     * @return array{enabled: bool, stale: bool, updated: int}
     */
    private function syncMailboxIntegrationStale(bool $enabled): array
    {
        if (! Schema::hasTable('integrations') || ! Schema::hasColumn('integrations', 'stale')) {
            return [
                'enabled' => $enabled,
                'stale' => ! $enabled,
                'updated' => 0,
            ];
        }

        $targetStale = ! $enabled;
        $updated = Integration::where('category', IntegrationCategoryEnum::OTHER->value)
            ->where('provider', 'mailbox')
            ->where('stale', ! $targetStale)
            ->update(['stale' => $targetStale]);

        return [
            'enabled' => $enabled,
            'stale' => $targetStale,
            'updated' => $updated,
        ];
    }
}
