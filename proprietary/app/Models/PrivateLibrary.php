<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property string $workspace_id
 * @property string $user_id
 * @property string|null $team_id
 * @property string $label
 * @property string|null $description
 * @property string $url
 * @property string $visibility
 * @property string|null $group
 * @property string|null $repo
 * @property string|null $branch
 * @property \Illuminate\Support\Carbon|null $cached_at
 * @property array<string, mixed>|null $manifest
 * @property string|null $last_error
 */
class PrivateLibrary extends Model
{
    protected $fillable = [
        'workspace_id',
        'user_id',
        'team_id',
        'label',
        'description',
        'url',
        'visibility',
        'group',
        'repo',
        'branch',
        'manifest',
        'cached_at',
        'last_error',
        'stale',
    ];

    protected function casts(): array
    {
        return [
            'manifest' => 'array',
            'cached_at' => 'datetime',
            'stale' => 'boolean',
        ];
    }

    /** @return BelongsTo<Workspace, $this> */
    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    /** @return BelongsTo<User, $this> */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /** @return BelongsTo<WorkspaceTeam, $this> */
    public function team(): BelongsTo
    {
        return $this->belongsTo(WorkspaceTeam::class, 'team_id');
    }
}
