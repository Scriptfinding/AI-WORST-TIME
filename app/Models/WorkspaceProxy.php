<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $workspace_id
 * @property string|null $user_id
 * @property string|null $team_id
 * @property string $label
 * @property string $visibility
 * @property string|null $group
 * @property string $scheme
 * @property string $host
 * @property int $port
 * @property string|null $username
 * @property string|null $password
 */
class WorkspaceProxy extends Model
{
    protected $fillable = [
        'workspace_id',
        'user_id',
        'team_id',
        'label',
        'visibility',
        'group',
        'scheme',
        'host',
        'port',
        'username',
        'password',
    ];

    protected $hidden = [
        'username',
        'password',
    ];

    protected function casts(): array
    {
        return [
            'port' => 'integer',
            'username' => 'encrypted',
            'password' => 'encrypted',
        ];
    }

    public function server(): string
    {
        $host = str_contains($this->host, ':') && ! str_starts_with($this->host, '[')
            ? "[{$this->host}]"
            : $this->host;

        return "{$this->scheme}://{$host}:{$this->port}";
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

    /** @return HasMany<Flow, $this> */
    public function flows(): HasMany
    {
        return $this->hasMany(Flow::class);
    }
}
