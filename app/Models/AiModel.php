<?php

/*
 * Explicit proprietary scope: the paid shared AI model scopes in this file implement paid
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
class AiModel extends Model
{
    use HasStringId;

    public const ID_PREFIX = 'aim';

    protected $fillable = [
        'workspace_id',
        'user_id',
        'team_id',
        'ai_integration_id',
        'ai_model_id',
        'capabilities',
        'name',
        'scope',
        'group',
        'is_active',
        'stale',
    ];

    protected function casts(): array
    {
        return [
            'capabilities' => 'array',
            'is_active' => 'boolean',
            'stale' => 'boolean',
        ];
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
        return $this->belongsTo(WorkspaceTeam::class, 'team_id');
    }

    /** @return BelongsTo<Integration, $this> */
    public function aiIntegration(): BelongsTo
    {
        return $this->belongsTo(Integration::class, 'ai_integration_id');
    }
}
