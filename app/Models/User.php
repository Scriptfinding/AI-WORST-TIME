<?php

/*
 * Explicit proprietary scope: the paid team, role and SSO identity relations in this file implement paid
 * Puppetflow features and are licensed under the Puppetflow Proprietary License.
 * See LICENSE_PROPRIETARY.md.
 */

namespace App\Models;

use App\Models\Concerns\HasStringId;
use App\Services\Flow\ArtifactCleanupService;
use App\Services\Storage\StoragePathSharder;
use App\Services\Storage\UploadStorage;
use App\Support\IdentityEmail;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Laravel\Passport\Contracts\OAuthenticatable;
use Laravel\Passport\HasApiTokens;

/**
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property string $id
 * @property-read \Illuminate\Database\Eloquent\Relations\Pivot $pivot
 * @property int $flows_count
 */
class User extends Authenticatable implements OAuthenticatable
{
    use HasApiTokens, HasStringId, Notifiable;

    public const ID_PREFIX = 'user';

    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'email',
        'google_id',
        'github_id',
        'password',
        'role',
        'can_create_workspace',
        'timezone',
        'explorer_view_mode',
        'onboarding_versions',
        'last_workspace_id',
        'avatar_path',
        'icon_type',
        'icon_value',
        'icon_color',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'two_factor_confirmed_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_secret',
        'two_factor_recovery_codes',
    ];

    protected $appends = [
        'icon_url',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'can_create_workspace' => 'boolean',
            'onboarding_versions' => 'array',
            'two_factor_confirmed_at' => 'datetime',
            'two_factor_secret' => 'encrypted',
            'two_factor_recovery_codes' => 'encrypted',
        ];
    }

    /** @return Attribute<string, string> */
    protected function email(): Attribute
    {
        return Attribute::make(
            set: fn (mixed $value): string => IdentityEmail::normalize($value),
        );
    }

    public function hasTwoFactorEnabled(): bool
    {
        return $this->two_factor_confirmed_at !== null;
    }

    protected static function booted(): void
    {
        static::creating(function (User $user) {
            /** @var string $defaultTimezone */
            $defaultTimezone = config('app.default_timezone', 'UTC');
            $user->timezone ??= $defaultTimezone;
        });

        static::deleting(function (User $user) {
            $ownedFlows = $user->ownedFlows()->with('runs.artifacts')->get();
            if ($ownedFlows->contains(fn (Flow $flow): bool => $flow->hasActiveRuns())) {
                throw ValidationException::withMessages([
                    'user' => 'A user who owns a flow with an active or cancellation-requested run cannot be deleted.',
                ]);
            }
            $runs = $ownedFlows->flatMap(fn (Flow $flow) => $flow->runs);

            $ownedFlows->each->delete();
            DB::afterCommit(function () use ($user, $runs): void {
                app(ArtifactCleanupService::class)->deleteUserArtifacts($user, $runs);
                app(UploadStorage::class)->deleteDirectory(self::splitIdPath($user->id));
            });
        });
    }

    public function getIconUrlAttribute(): ?string
    {
        if ($this->icon_type === 'upload' && $this->avatar_path) {
            return app(UploadStorage::class)->url(
                $this->avatar_path,
                (int) ($this->updated_at->timestamp ?? 0),
            );
        }

        return null;
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public static function splitIdPath(int|string $id): string
    {
        return 'users/'.StoragePathSharder::split($id).'/user';
    }

    public function iconUploadDir(): string
    {
        return self::splitIdPath($this->id);
    }

    public static function workspaceMemberId(string $id, string $workspaceId): ?string
    {
        $memberId = static::query()
            ->whereKey($id)
            ->whereHas('workspaces', fn ($query) => $query->where('workspaces.id', $workspaceId))
            ->value('id');

        return is_string($memberId) ? $memberId : null;
    }

    /** @return BelongsToMany<Workspace, $this> */
    public function workspaces(): BelongsToMany
    {
        return $this->belongsToMany(Workspace::class)
            ->withPivot('role')
            ->withTimestamps();
    }

    /** @return BelongsToMany<WorkspaceTeam, $this> */
    public function teams(): BelongsToMany
    {
        return $this->belongsToMany(WorkspaceTeam::class, 'team_user', 'user_id', 'team_id')
            ->withPivot('workspace_id')
            ->withTimestamps();
    }

    /** @return HasMany<Flow, $this> */
    public function ownedFlows(): HasMany
    {
        return $this->hasMany(Flow::class, 'owner_id');
    }

    /** @return HasMany<ApiKey, $this> */
    public function apiKeys(): HasMany
    {
        return $this->hasMany(ApiKey::class);
    }

    /** @return HasMany<McpAccessToken, $this> */
    public function mcpAccessTokens(): HasMany
    {
        return $this->hasMany(McpAccessToken::class);
    }

    /** @return HasMany<UserExternalIdentity, $this> */
    public function externalIdentities(): HasMany
    {
        return $this->hasMany(UserExternalIdentity::class);
    }

    public function belongsToWorkspace(Workspace $workspace): bool
    {
        return $this->workspaces()->where('workspaces.id', $workspace->id)->exists();
    }

    public function preferredWorkspace(): ?Workspace
    {
        if ($this->last_workspace_id) {
            $workspace = $this->isAdmin()
                ? Workspace::find($this->last_workspace_id)
                : $this->workspaces()->where('workspaces.id', $this->last_workspace_id)->first();

            if ($workspace) {
                return $workspace;
            }
        }

        return $this->isAdmin()
            ? Workspace::first()
            : $this->workspaces()->first();
    }

    public function rememberWorkspace(?Workspace $workspace): void
    {
        if (! $workspace || $this->last_workspace_id === $workspace->id) {
            return;
        }

        $this->forceFill(['last_workspace_id' => $workspace->id])->saveQuietly();
    }
}
