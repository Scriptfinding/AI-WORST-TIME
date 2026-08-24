<?php

/*
 * Explicit proprietary scope: the paid shared-scope and private-library source fields in this file implement paid
 * Puppetflow features and are licensed under the Puppetflow Proprietary License.
 * See LICENSE_PROPRIETARY.md.
 */

namespace App\Models;

use App\Models\Concerns\HasStringId;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property string $id
 * @property string|null $library_latest_source_sha
 * @property bool $library_update_available
 * @property string $scope
 * @property string|null $team_id
 */
class Snippet extends Model
{
    use HasStringId;

    public const ID_PREFIX = 'snip';

    protected $fillable = [
        'workspace_id',
        'user_id',
        'label',
        'description',
        'group',
        'args',
        'code',
        'snippet_type',
        'nodal_graph',
        'scope',
        'team_id',
        'is_active',
        'stale',
        'library_external_id',
        'library_external_key',
        'library_namespace',
        'library_reference',
        'library_source_path',
        'library_source_sha',
        'library_source_url',
        'library_imported_at',
    ];

    protected $appends = ['library_locked'];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'stale' => 'boolean',
            'snippet_type' => 'string',
            'nodal_graph' => 'array',
            'library_imported_at' => 'datetime',
        ];
    }

    public function getLibraryLockedAttribute(): bool
    {
        return ! empty($this->library_reference);
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
}
