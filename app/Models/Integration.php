<?php

/*
 * Explicit proprietary scope: the paid repository, vault and shared-scope fields and relations in this file implement paid
 * Puppetflow features and are licensed under the Puppetflow Proprietary License.
 * See LICENSE_PROPRIETARY.md.
 */

namespace App\Models;

use App\Casts\IntegrationProviderCast;
use App\Casts\SafeEncrypted;
use App\Contracts\Integration\IntegrationProviderInterface;
use App\Enums\Integration\IntegrationAiProviderEnum;
use App\Enums\Integration\IntegrationCategoryEnum;
use App\Enums\Integration\IntegrationMessengerProviderEnum;
use App\Enums\Integration\IntegrationRepositoryProviderEnum;
use App\Enums\Integration\IntegrationVaultProviderEnum;
use App\Models\Concerns\HasStringId;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property string $id
 * @property IntegrationCategoryEnum $category
 * @property IntegrationProviderInterface|null $provider
 * @property array<string, mixed>|null $config
 * @property string $scope
 * @property string|null $team_id
 * @property string|null $webhook_id
 * @property bool $is_active
 * @property bool $stale
 * @property-read mixed $provider_status
 * @property-read string|null $provider_external_url
 * @property-read string|null $webhook_url
 * @property-read bool $is_readonly
 */
class Integration extends Model
{
    use HasStringId;

    public const ID_PREFIX = 'intg';

    protected $fillable = [
        'workspace_id',
        'user_id',
        'category',
        'provider',
        'name',
        'config',
        'is_active',
        'stale',
        'scope',
        'team_id',
    ];

    protected $hidden = ['config', 'webhook_id'];

    protected $appends = ['provider_status', 'provider_external_url', 'webhook_url', 'is_readonly'];

    protected static function booted(): void
    {
        static::creating(function (Integration $integration): void {
            if (
                $integration->category === IntegrationCategoryEnum::REPOSITORY
                && (
                    ! is_string($integration->webhook_id)
                    || preg_match('/\A[a-f0-9]{64}\z/', $integration->webhook_id) !== 1
                )
            ) {
                $integration->webhook_id = self::newWebhookId();
            }
        });
    }

    public static function newWebhookId(): string
    {
        return bin2hex(random_bytes(32));
    }

    protected function casts(): array
    {
        return [
            'category' => IntegrationCategoryEnum::class,
            'provider' => IntegrationProviderCast::class,
            'config' => SafeEncrypted::class.':true',
            'is_active' => 'boolean',
            'stale' => 'boolean',
        ];
    }

    /** @return Attribute<string|null, never> */
    protected function providerStatus(): Attribute
    {
        return Attribute::get(function () {
            $provider = $this->provider;
            if (! $provider instanceof IntegrationProviderInterface) {
                return null;
            }

            return $provider->resolveStatus($this->config ?? []);
        });
    }

    /** @return Attribute<string|null, never> */
    protected function providerExternalUrl(): Attribute
    {
        return Attribute::get(function () {
            $provider = $this->provider;
            if (! $provider instanceof IntegrationProviderInterface) {
                return null;
            }

            return $provider->resolveExternalUrl($this->config ?? []);
        });
    }

    /** @return Attribute<string|null, never> */
    protected function webhookUrl(): Attribute
    {
        return Attribute::get(function (): ?string {
            $provider = $this->provider;
            if (
                ! $provider instanceof IntegrationRepositoryProviderEnum
                || ! is_string($this->webhook_id)
                || $this->webhook_id === ''
            ) {
                return null;
            }

            $configuredUrl = config('app.url');
            $baseUrl = rtrim(is_string($configuredUrl) ? $configuredUrl : '', '/');
            /** @var string $webhookUrl */
            $webhookUrl = "{$baseUrl}/api/webhooks/{$provider->value}/{$this->webhook_id}";

            return $webhookUrl;
        });
    }

    /** @return Attribute<bool, never> */
    protected function isReadonly(): Attribute
    {
        return Attribute::get(function () {
            $config = $this->config ?? [];

            return (bool) ($config['readonly'] ?? $config['managed_by_env'] ?? false);
        });
    }

    public function messengerProvider(): IntegrationMessengerProviderEnum
    {
        if (! $this->provider instanceof IntegrationMessengerProviderEnum) {
            throw new \LogicException('Integration is not configured with a messenger provider.');
        }

        return $this->provider;
    }

    public function aiProvider(): IntegrationAiProviderEnum
    {
        if (! $this->provider instanceof IntegrationAiProviderEnum) {
            throw new \LogicException('Integration is not configured with an AI provider.');
        }

        return $this->provider;
    }

    public function repositoryProvider(): IntegrationRepositoryProviderEnum
    {
        if (! $this->provider instanceof IntegrationRepositoryProviderEnum) {
            throw new \LogicException('Integration is not configured with a repository provider.');
        }

        return $this->provider;
    }

    public function vaultProvider(): IntegrationVaultProviderEnum
    {
        if (! $this->provider instanceof IntegrationVaultProviderEnum) {
            throw new \LogicException('Integration is not configured with a vault provider.');
        }

        return $this->provider;
    }

    /** @return BelongsTo<Workspace, $this> */
    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<WorkspaceTeam, $this> */
    public function team(): BelongsTo
    {
        return $this->belongsTo(WorkspaceTeam::class, 'team_id');
    }

    /** @return HasMany<AiModel, $this> */
    public function aiModels(): HasMany
    {
        return $this->hasMany(AiModel::class, 'ai_integration_id');
    }

    /** @return HasMany<IntegrationRepository, $this> */
    public function repositories(): HasMany
    {
        return $this->hasMany(IntegrationRepository::class);
    }

    /**
     * @param  Builder<Integration>  $query
     * @return Builder<Integration>
     */
    public function scopeRepository(Builder $query): Builder
    {
        return $query->where($query->getModel()->qualifyColumn('category'), IntegrationCategoryEnum::REPOSITORY);
    }

    /**
     * @param  Builder<Integration>  $query
     * @return Builder<Integration>
     */
    public function scopeVault(Builder $query): Builder
    {
        return $query->where($query->getModel()->qualifyColumn('category'), IntegrationCategoryEnum::VAULT);
    }

    /**
     * @param  Builder<Integration>  $query
     * @return Builder<Integration>
     */
    public function scopeForProvider(Builder $query, \BackedEnum $provider): Builder
    {
        return $query->where($query->getModel()->qualifyColumn('provider'), $provider->value);
    }
}
