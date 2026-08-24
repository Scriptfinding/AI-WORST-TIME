<?php

/*
 * Explicit proprietary scope: the paid sharing scopes, repository links and replay settings in this file implement paid
 * Puppetflow features and are licensed under the Puppetflow Proprietary License.
 * See LICENSE_PROPRIETARY.md.
 */

namespace App\Models;

use App\Models\Concerns\HasStringId;
use App\Services\FeatureFlags\FeatureFlagService;
use App\Services\Flow\ArtifactCleanupService;
use App\Services\Storage\RunArtifactPathResolver;
use App\Services\Storage\StoragePathSharder;
use App\Services\Storage\UploadStorage;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * @property array<string, mixed>|null $nodal_graph
 * @property array<array-key, mixed>|null $default_inputs
 * @property Carbon|null $content_updated_at
 * @property Carbon|null $updated_at
 * @property string|null $owner_workspace_role
 * @property string|null $library_latest_source_sha
 * @property bool $library_update_available
 * @property string $id
 * @property string $name
 * @property string $visibility
 * @property bool $is_published
 * @property int|null $published_version_id
 * @property string|null $team_id
 * @property int|null $runs_retention_limit
 * @property string|null $folder_id
 * @property string|null $workspace_folder_id
 * @property int|null $queue_index
 * @property string $proxy_mode
 * @property int|null $workspace_proxy_id
 * @property bool $export_artifacts_recording
 * @property int $manual_run_score
 * @property bool $manual_run_production_mode
 * @property array<string, mixed>|null $manual_run_score_state
 * @property Carbon|null $manual_run_score_updated_at
 */
class Flow extends Model
{
    use HasStringId;

    public const ID_PREFIX = 'flow';

    public const UNLIMITED_TIMEOUT_SECONDS = 9_999_999;

    protected $table = 'flows';

    protected $hidden = [
        'manual_run_score',
        'manual_run_production_mode',
        'manual_run_score_state',
        'manual_run_score_updated_at',
    ];

    protected $fillable = [
        'name',
        'description',
        'readme',
        'code',
        'source_type',
        'flow_type',
        'nodal_graph',
        'library_external_id',
        'library_external_key',
        'library_namespace',
        'library_reference',
        'library_source_path',
        'library_source_sha',
        'library_source_url',
        'library_imported_at',
        'manual_input',
        'default_inputs',
        'blueprint_input_definitions',
        'workspace_id',
        'folder_id',
        'workspace_folder_id',
        'team_id',
        'owner_id',
        'is_published',
        'published_version_id',
        'available_in_mcp',
        'queue_index',
        'proxy_mode',
        'workspace_proxy_id',
        'visibility',
        'timeout_seconds',
        'operator_seconds',
        'max_retries',
        'include_raw_output',
        'include_input_in_output',
        'include_context_in_output',
        'always_success_response',
        'export_artifacts_screenshots',
        'export_artifacts_downloads',
        'export_artifacts_recording',
        'runs_retention_limit',
        'viewport_width',
        'viewport_height',
        'keyboard_speed',
        'disable_web_security',
        'last_run_result',
        'last_run_at',
        'manual_run_score',
        'manual_run_production_mode',
        'manual_run_score_state',
        'manual_run_score_updated_at',
        'icon_type',
        'icon_value',
        'icon_color',
        'cover_color',
        'icon_upload_path',
        'content_updated_at',
    ];

    protected $appends = ['icon_url', 'library_locked'];

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

    protected function casts(): array
    {
        return [
            'is_published' => 'boolean',
            'published_version_id' => 'integer',
            'available_in_mcp' => 'boolean',
            'queue_index' => 'integer',
            'workspace_proxy_id' => 'integer',
            'visibility' => 'string',
            'flow_type' => 'string',
            'nodal_graph' => 'array',
            'manual_input' => 'array',
            'default_inputs' => 'array',
            'blueprint_input_definitions' => 'array',
            'last_run_result' => 'array',
            'last_run_at' => 'datetime',
            'manual_run_score' => 'integer',
            'manual_run_production_mode' => 'boolean',
            'manual_run_score_state' => 'array',
            'manual_run_score_updated_at' => 'datetime',
            'timeout_seconds' => 'integer',
            'operator_seconds' => 'integer',
            'max_retries' => 'integer',
            'include_raw_output' => 'boolean',
            'include_input_in_output' => 'boolean',
            'include_context_in_output' => 'boolean',
            'always_success_response' => 'boolean',
            'export_artifacts_screenshots' => 'boolean',
            'export_artifacts_downloads' => 'boolean',
            'export_artifacts_recording' => 'boolean',
            'runs_retention_limit' => 'integer',
            'viewport_width' => 'integer',
            'viewport_height' => 'integer',
            'keyboard_speed' => 'integer',
            'disable_web_security' => 'boolean',
            'library_imported_at' => 'datetime',
            'content_updated_at' => 'datetime',
        ];
    }

    public function getLibraryLockedAttribute(): bool
    {
        return ! empty($this->library_reference);
    }

    public function getPublishedVersionNumberAttribute(): ?int
    {
        $version = $this->publishedVersion;

        return $version instanceof FlowVersion ? $version->version : null;
    }

    protected static function booted(): void
    {
        static::creating(function (Flow $flow) {
            $flow->content_updated_at ??= Carbon::now();
        });

        static::saving(function (Flow $flow) {
            if ($flow->exists && ($flow->isDirty('code') || $flow->isDirty('nodal_graph'))) {
                $flow->content_updated_at = Carbon::now();
            }
        });

        static::created(function (Flow $flow): void {
            // When the attribute is not provided, the database column defaults to published.
            $isPublished = $flow->getAttribute('is_published') ?? true;
            if (! $isPublished || $flow->published_version_id || $flow->source_type === 'repository') {
                return;
            }

            $version = $flow->versions()->create([
                'version' => 1,
                'code' => $flow->code,
                'nodal_graph' => $flow->flow_type === 'nodal' ? $flow->nodal_graph : null,
                'flow_type' => $flow->flow_type,
                'published_by' => $flow->owner_id,
                'published_at' => now(),
            ]);
            $flow->updateQuietly(['published_version_id' => $version->id]);
        });

        static::deleting(function (Flow $flow) {
            if (DB::transactionLevel() > 0) {
                Flow::query()
                    ->whereKey($flow->getKey())
                    ->lockForUpdate()
                    ->firstOrFail();
            }
            if ($flow->hasActiveRuns()) {
                throw ValidationException::withMessages([
                    'flow' => 'A flow with an active or cancellation-requested run cannot be deleted.',
                ]);
            }
            $runs = $flow->runs()->with('artifacts')->get();
            $cleanup = app(ArtifactCleanupService::class);
            $deletionIds = [];
            foreach ($runs as $run) {
                /** @var \Illuminate\Database\Eloquent\Collection<int, FlowRunArtifact> $artifacts */
                $artifacts = $run->getRelation('artifacts');
                $deletionIds = [
                    ...$deletionIds,
                    ...$cleanup->stageArtifactDeletions($artifacts),
                ];
            }

            DB::afterCommit(function () use ($flow, $runs, $cleanup, $deletionIds): void {
                $cleanup->dispatchArtifactDeletions($deletionIds);
                $cleanup->deleteFlowArtifacts($flow, $runs);

                app(UploadStorage::class)->deleteDirectory(self::splitIdPath($flow->id));
            });
        });
    }

    public function hasActiveRuns(): bool
    {
        return $this->runs()->activeOrCancelling()->exists();
    }

    /** @param  iterable<array-key, string>  $flowIds */
    public static function anyHaveActiveRuns(iterable $flowIds): bool
    {
        return FlowRun::query()
            ->whereIn('flow_id', collect($flowIds)->all())
            ->activeOrCancelling()
            ->exists();
    }

    public static function splitIdPath(string $id): string
    {
        return 'flows/'.StoragePathSharder::split($id);
    }

    public function iconUploadDir(): string
    {
        return self::splitIdPath($this->id).'/flow';
    }

    public function getFlowArtifactsBasePath(bool $create = true): string
    {
        return app(RunArtifactPathResolver::class)->absoluteFlowPath($this, $create);
    }

    /** @return BelongsTo<Workspace, $this> */
    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    /** @return BelongsTo<WorkspaceProxy, $this> */
    public function workspaceProxy(): BelongsTo
    {
        return $this->belongsTo(WorkspaceProxy::class);
    }

    /** @return BelongsTo<Folder, $this> */
    public function folder(): BelongsTo
    {
        return $this->belongsTo(Folder::class);
    }

    /** @return BelongsTo<Folder, $this> */
    public function workspaceFolder(): BelongsTo
    {
        return $this->belongsTo(Folder::class, 'workspace_folder_id');
    }

    /** @return BelongsTo<WorkspaceTeam, $this> */
    public function team(): BelongsTo
    {
        return $this->belongsTo(WorkspaceTeam::class, 'team_id');
    }

    /** @return BelongsTo<User, $this> */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /** @return HasMany<FlowTrigger, $this> */
    public function triggers(): HasMany
    {
        return $this->hasMany(FlowTrigger::class);
    }

    /** @return HasMany<FlowAction, $this> */
    public function actions(): HasMany
    {
        return $this->hasMany(FlowAction::class);
    }

    /** @return array{width: int, height: int} */
    public function getEffectiveViewport(): array
    {
        $workspace = $this->workspace;

        return [
            'width' => $this->viewport_width ?? $workspace->viewport_width ?? 1280,
            'height' => $this->viewport_height ?? $workspace->viewport_height ?? 720,
        ];
    }

    public function getEffectiveKeyboardSpeed(): int
    {
        return $this->keyboard_speed ?? $this->workspace->keyboard_speed ?? 100;
    }

    public function getEffectiveRetentionLimit(): int
    {
        $workspace = $this->workspace;
        $wsDefault = $workspace?->getEffectiveRetentionDefault() ?? 0;
        $wsMax = $workspace?->getEffectiveRetentionMax() ?? 0;

        $flowLimit = $this->runs_retention_limit;

        if ($flowLimit === null || $flowLimit === 0) {
            $effective = $wsDefault;
        } else {
            $effective = $flowLimit;
        }

        if ($wsMax > 0 && $effective > 0) {
            $effective = min($effective, $wsMax);
        } elseif ($wsMax > 0 && $effective === 0) {
            $effective = $wsMax;
        }

        return $effective;
    }

    public function getEffectiveMaxTimeoutSeconds(): int
    {
        return $this->workspace?->getEffectiveMaxFlowTimeoutSeconds()
            ?? app(FeatureFlagService::class)->maximumTimeoutSeconds();
    }

    public function getEffectiveTimeoutSeconds(): int
    {
        $timeout = max(0, (int) ($this->timeout_seconds ?? 300));
        $workspaceDefault = $this->workspace?->getEffectiveDefaultFlowTimeoutSeconds() ?? 0;
        $max = $this->getEffectiveMaxTimeoutSeconds();

        if ($timeout === 0) {
            $timeout = $workspaceDefault;
        }

        if ($timeout === 0) {
            return $max > 0 ? $max : self::UNLIMITED_TIMEOUT_SECONDS;
        }

        return $max > 0 ? min($timeout, $max) : max(5, $timeout);
    }

    public function getEffectiveMaxRetries(): int
    {
        $maxRetries = max(0, (int) ($this->max_retries ?? 0));
        $workspaceDefault = $this->workspace?->getEffectiveMaxRetriesDefault() ?? 0;
        $workspaceMax = $this->workspace?->getEffectiveMaxRetriesLimit()
            ?? app(FeatureFlagService::class)->maximumRetriesLimit();

        if ($maxRetries === 0) {
            $maxRetries = $workspaceDefault;
        }

        return min($maxRetries, $workspaceMax);
    }

    /** @return HasMany<FlowUserInput, $this> */
    public function userInputs(): HasMany
    {
        return $this->hasMany(FlowUserInput::class);
    }

    /** @return HasMany<FlowRun, $this> */
    public function runs(): HasMany
    {
        return $this->hasMany(FlowRun::class);
    }

    /** @return HasMany<FlowVersion, $this> */
    public function versions(): HasMany
    {
        return $this->hasMany(FlowVersion::class);
    }

    /** @return BelongsTo<FlowVersion, $this> */
    public function publishedVersion(): BelongsTo
    {
        return $this->belongsTo(FlowVersion::class, 'published_version_id');
    }

    /** @return HasOne<FlowRun, $this> */
    public function latestRun(): HasOne
    {
        return $this->hasOne(FlowRun::class)->latestOfMany();
    }

    /** @return HasOne<FlowRepositoryLink, $this> */
    public function repositoryLink(): HasOne
    {
        return $this->hasOne(FlowRepositoryLink::class);
    }

    /** @return HasMany<MailboxWatcher, $this> */
    public function mailboxWatchers(): HasMany
    {
        return $this->hasMany(MailboxWatcher::class);
    }
}
