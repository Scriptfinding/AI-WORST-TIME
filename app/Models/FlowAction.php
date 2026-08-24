<?php

/*
 * Explicit proprietary scope: the paid shared-scope and replay-override fields in this file implement paid
 * Puppetflow features and are licensed under the Puppetflow Proprietary License.
 * See LICENSE_PROPRIETARY.md.
 */

namespace App\Models;

use App\Models\Concerns\HasStringId;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property string $id
 * @property string $scope
 * @property string|null $team_id
 */
class FlowAction extends Model
{
    use HasStringId;

    public const ID_PREFIX = 'act';

    protected $hidden = ['config'];

    protected $fillable = [
        'flow_id',
        'user_id',
        'type',
        'label',
        'group',
        'config',
        'is_active',
        'is_public',
        'scope',
        'team_id',
        'fire_on_error',
        'export_artifacts_screenshots',
        'export_artifacts_downloads',
        'export_artifacts_recording',
        'last_triggered_at',
    ];

    protected function casts(): array
    {
        return [
            'config' => 'encrypted:array',
            'is_active' => 'boolean',
            'is_public' => 'boolean',
            'fire_on_error' => 'boolean',
            'export_artifacts_screenshots' => 'boolean',
            'export_artifacts_downloads' => 'boolean',
            'export_artifacts_recording' => 'boolean',
            'last_triggered_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Flow, $this> */
    public function flow(): BelongsTo
    {
        return $this->belongsTo(Flow::class);
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
