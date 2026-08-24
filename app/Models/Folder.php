<?php

/*
 * Explicit proprietary scope: the paid team/workspace visibility fields and relations in this file implement paid
 * Puppetflow features and are licensed under the Puppetflow Proprietary License.
 * See LICENSE_PROPRIETARY.md.
 */

namespace App\Models;

use App\Models\Concerns\HasStringId;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property string $id
 * @property string|null $team_id
 */
class Folder extends Model
{
    use HasStringId;

    public const ID_PREFIX = 'fld';

    protected $fillable = ['name', 'workspace_id', 'owner_id', 'parent_id', 'sort_order', 'is_shared', 'team_id'];

    protected function casts(): array
    {
        return [
            'is_shared' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::deleting(function (Folder $folder) {
            $folder->children->each->delete();
            Flow::where('folder_id', $folder->id)
                ->orWhere('workspace_folder_id', $folder->id)
                ->get()
                ->each
                ->delete();
        });
    }

    /** @param Builder<Folder> $query
     * @return Builder<Folder>
     */
    public function scopePersonal(Builder $query): Builder
    {
        return $query->where($query->getModel()->qualifyColumn('is_shared'), false);
    }

    /** @param Builder<Folder> $query
     * @return Builder<Folder>
     */
    public function scopeWorkspaceScope(Builder $query): Builder
    {
        return $query
            ->where($query->getModel()->qualifyColumn('is_shared'), true)
            ->whereNull($query->getModel()->qualifyColumn('team_id'));
    }

    /** @param Builder<Folder> $query
     * @return Builder<Folder>
     */
    public function scopeTeamScope(Builder $query, string $teamId): Builder
    {
        return $query
            ->where($query->getModel()->qualifyColumn('is_shared'), true)
            ->where($query->getModel()->qualifyColumn('team_id'), $teamId);
    }

    /** @param Builder<Folder> $query
     * @return Builder<Folder>
     */
    public function scopeVisibleTo(Builder $query, User $user): Builder
    {
        return $query->where($query->getModel()->qualifyColumn('owner_id'), $user->id);
    }

    /** @return BelongsTo<WorkspaceTeam, $this> */
    public function team(): BelongsTo
    {
        return $this->belongsTo(WorkspaceTeam::class, 'team_id');
    }

    /** @return BelongsTo<Workspace, $this> */
    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    /** @return BelongsTo<User, $this> */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /** @return BelongsTo<Folder, $this> */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Folder::class, 'parent_id');
    }

    /** @return HasMany<Folder, $this> */
    public function children(): HasMany
    {
        return $this->hasMany(Folder::class, 'parent_id')->orderBy($this->qualifyColumn('sort_order'));
    }

    /** @return HasMany<Flow, $this> */
    public function flows(): HasMany
    {
        return $this->hasMany(Flow::class);
    }

    /** @return HasMany<Folder, $this> */
    public function allChildren(): HasMany
    {
        return $this->children()->with('allChildren');
    }
}
