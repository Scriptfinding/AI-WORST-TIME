<?php

namespace App\Models;

use App\Database\DatabaseDialect;
use App\Models\Concerns\HasStringId;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property string $id
 * @property string $workspace_id
 * @property string $user_id
 * @property string|null $team_id
 * @property string $name
 * @property string|null $description
 * @property string|null $group
 * @property string $visibility
 * @property string $physical_name
 * @property-read User|null $user
 * @property-read WorkspaceTeam|null $team
 */
class DataTable extends Model
{
    use HasStringId;

    public const ID_PREFIX = 'dtbl';

    protected $fillable = [
        'workspace_id',
        'user_id',
        'team_id',
        'name',
        'description',
        'group',
        'visibility',
        'physical_name',
    ];

    protected $hidden = ['physical_name'];

    protected static function booted(): void
    {
        static::deleting(function (DataTable $table): void {
            app(DatabaseDialect::class)->dropDataTable($table->physical_name);
        });
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
        return $this->belongsTo(WorkspaceTeam::class);
    }

    /** @return HasMany<DataTableColumn, $this> */
    public function columns(): HasMany
    {
        return $this->hasMany(DataTableColumn::class)->orderBy('position');
    }
}
