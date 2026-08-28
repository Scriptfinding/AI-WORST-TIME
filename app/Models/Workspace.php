<?php

/*
 * Explicit proprietary scope: the licensed retention, retry and timeout limits plus paid workspace roles in this file implement paid
 * Puppetflow features and are licensed under the Puppetflow Proprietary License.
 * See LICENSE_PROPRIETARY.md.
 */

namespace App\Models;

use App\Models\Concerns\HasStringId;
use App\Services\FeatureFlags\FeatureFlagService;
use App\Services\Storage\StoragePathSharder;
use App\Services\Storage\UploadStorage;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property \Illuminate\Support\Carbon|null $expires_at
 * @property string $id
 * @property string|null $owner_id
 * @property int $runs_retention_default
 * @property int $runs_retention_max
 * @property int $debug_log_object_depth
 * @property int $debug_log_array_limit
 * @property bool $require_two_factor
 */
class Workspace extends Model
{
    use HasStringId;

    public const ID_PREFIX = 'work';

    protected $fillable = [
        'name', 'slug', 'lookup_key', 'owner_id',
        'expires_at',
        'runs_retention_default', 'runs_retention_max',
        'default_flow_timeout_seconds', 'max_flow_timeout_seconds',
        'max_retries_default', 'max_retries_max',
        'viewport_width', 'viewport_height', 'keyboard_speed',
        'debug_log_object_depth', 'debug_log_array_limit',
        'allow_trigger_advertising',
        'require_two_factor',
        'default_flow_code', 'default_flow_type', 'default_flow_nodal_graph',
        'icon_type', 'icon_value', 'icon_color', 'icon_upload_path',
    ];

    protected function casts(): array
    {
        return [
            'runs_retention_default' => 'integer',
            'runs_retention_max' => 'integer',
            'default_flow_timeout_seconds' => 'integer',
            'max_flow_timeout_seconds' => 'integer',
            'max_retries_default' => 'integer',
            'max_retries_max' => 'integer',
            'viewport_width' => 'integer',
            'viewport_height' => 'integer',
            'keyboard_speed' => 'integer',
            'debug_log_object_depth' => 'integer',
            'debug_log_array_limit' => 'integer',
            'allow_trigger_advertising' => 'boolean',
            'require_two_factor' => 'boolean',
            'default_flow_nodal_graph' => 'array',
            'expires_at' => 'datetime',
        ];
    }

    protected $appends = ['icon_url'];

    public function getIconUrlAttribute(): ?string
    {
        if ($this->icon_type === 'upload' && $this->icon_upload_path) {
            return app(UploadStorage::class)->url(
                $this->icon_upload_path,
                (int) ($this->updated_at->timestamp ?? 0),
            );
        }

        return null;
    }

    public static function splitIdPath(int|string $id): string
    {
        return 'workspaces/'.StoragePathSharder::split($id);
    }

    public function iconUploadDir(): string
    {
        return self::splitIdPath($this->id).'/workspace';
    }

    public function isExpired(): bool
    {
        return $this->expires_at?->isPast() ?? false;
    }

    protected static function booted(): void
    {
        static::creating(function (Workspace $workspace) {
            if (empty($workspace->slug)) {
                $workspace->slug = Str::slug($workspace->name);
            }
        });

        static::deleting(function (Workspace $workspace) {
            $workspace->dataTables->each->delete();
            $workspace->flows->each->delete();

            DB::afterCommit(
                fn () => app(UploadStorage::class)->deleteDirectory(self::splitIdPath($workspace->id)),
            );
        });
    }

    /** @return BelongsTo<User, $this> */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /** @return BelongsToMany<User, $this> */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class)
            ->withPivot('role')
            ->withTimestamps();
    }

    /** @return HasMany<Folder, $this> */
    public function folders(): HasMany
    {
        return $this->hasMany(Folder::class);
    }

    /** @return HasMany<Folder, $this> */
    public function rootFolders(): HasMany
    {
        return $this->hasMany(Folder::class)->whereNull('parent_id');
    }

    /** @return HasMany<Flow, $this> */
    public function flows(): HasMany
    {
        return $this->hasMany(Flow::class);
    }

    /** @return HasMany<DataTable, $this> */
    public function dataTables(): HasMany
    {
        return $this->hasMany(DataTable::class);
    }

    public function getEffectiveRetentionDefault(): int
    {
        return $this->capByPositiveMax(
            max(0, (int) ($this->runs_retention_default ?? 0)),
            $this->getEffectiveRetentionMax(),
            true,
        );
    }

    public function getEffectiveRetentionMax(): int
    {
        $globalMax = app(FeatureFlagService::class)->maximumRetentionLimit();
        $workspaceMax = max(0, (int) ($this->runs_retention_max ?? 0));
        $limits = array_filter([$globalMax, $workspaceMax], fn (int $limit) => $limit > 0);

        return empty($limits) ? 0 : min($limits);
    }

    public function getEffectiveMaxFlowTimeoutSeconds(): int
    {
        $globalMax = app(FeatureFlagService::class)->maximumTimeoutSeconds();
        $workspaceMax = max(0, (int) ($this->max_flow_timeout_seconds ?? 0));
        $limits = array_filter([$globalMax, $workspaceMax], fn (int $limit) => $limit > 0);

        return empty($limits) ? 0 : min($limits);
    }

    public function getEffectiveDefaultFlowTimeoutSeconds(): int
    {
        return $this->capByPositiveMax(
            max(0, (int) ($this->default_flow_timeout_seconds ?? 0)),
            $this->getEffectiveMaxFlowTimeoutSeconds(),
            true,
        );
    }

    public function getEffectiveMaxRetriesDefault(): int
    {
        $default = max(0, (int) ($this->max_retries_default ?? 0));
        $workspaceMax = max(0, (int) ($this->max_retries_max ?? 0));
        $effectiveMax = $this->getEffectiveMaxRetriesLimit();

        if ($effectiveMax <= 0) {
            return 0;
        }

        if ($workspaceMax > 0 && $default === 0) {
            return $effectiveMax;
        }

        return $default > 0 ? min($default, $effectiveMax) : 0;
    }

    public function getEffectiveMaxRetriesLimit(): int
    {
        $globalMax = app(FeatureFlagService::class)->maximumRetriesLimit();
        $workspaceMax = max(0, (int) ($this->max_retries_max ?? 0));

        return $workspaceMax > 0 ? min($workspaceMax, $globalMax) : $globalMax;
    }

    private function capByPositiveMax(int $value, int $max, bool $zeroUsesMax = false): int
    {
        if ($max <= 0) {
            return $value;
        }

        if ($value === 0 && $zeroUsesMax) {
            return $max;
        }

        return $value > 0 ? min($value, $max) : $value;
    }

    /** @return HasMany<WorkspaceTeam, $this> */
    public function teams(): HasMany
    {
        return $this->hasMany(WorkspaceTeam::class);
    }

    /** @return HasMany<PrivateLibrary, $this> */
    public function privateLibraries(): HasMany
    {
        return $this->hasMany(PrivateLibrary::class);
    }

    /** @return HasMany<WorkspaceProxy, $this> */
    public function proxies(): HasMany
    {
        return $this->hasMany(WorkspaceProxy::class);
    }

    /** @return HasOne<WorkspaceMcpSetting, $this> */
    public function mcpSetting(): HasOne
    {
        return $this->hasOne(WorkspaceMcpSetting::class);
    }

    /** @return HasMany<McpAccessToken, $this> */
    public function mcpAccessTokens(): HasMany
    {
        return $this->hasMany(McpAccessToken::class);
    }

    /** @return HasMany<McpOauthClient, $this> */
    public function mcpOauthClients(): HasMany
    {
        return $this->hasMany(McpOauthClient::class);
    }

    /** @return HasMany<McpOauthConnection, $this> */
    public function mcpOauthConnections(): HasMany
    {
        return $this->hasMany(McpOauthConnection::class);
    }
}
