<?php

namespace App\Models;

use App\Models\Concerns\HasStringId;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * @property string $workspace_id
 * @property string $id
 * @property string $name
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class WorkspaceTeam extends Model
{
    use HasStringId;

    public const ID_PREFIX = 'team';

    protected $fillable = ['workspace_id', 'name'];

    /** @return BelongsTo<Workspace, $this> */
    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    /** @return BelongsToMany<User, $this> */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'team_user', 'team_id')
            ->withPivot('workspace_id')
            ->withTimestamps();
    }

    /** @return HasOne<Folder, $this> */
    public function rootFolder(): HasOne
    {
        return $this->hasOne(Folder::class, 'team_id')->whereNull('parent_id');
    }
}
