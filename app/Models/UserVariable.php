<?php

/*
 * Explicit proprietary scope: the paid vault-reference and shared-scope fields in this file implement paid
 * Puppetflow features and are licensed under the Puppetflow Proprietary License.
 * See LICENSE_PROPRIETARY.md.
 */

namespace App\Models;

use App\Casts\SafeEncrypted;
use App\Models\Concerns\HasStringId;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property string $id
 * @property string $value
 * @property string|null $team_id
 * @property string|null $vault_provider
 * @property string|null $vault_integration_id
 * @property string|null $vault_field_type
 */
class UserVariable extends Model
{
    use HasStringId;

    public const ID_PREFIX = 'var';

    protected $fillable = [
        'user_id',
        'workspace_id',
        'key',
        'value',
        'type',
        'scope',
        'team_id',
        'group',
        'vault_provider',
        'vault_integration_id',
        'vault_vault_id',
        'vault_vault_name',
        'vault_item_id',
        'vault_item_name',
        'vault_field_label',
        'vault_field_type',
        'stale',
    ];

    protected function casts(): array
    {
        return [
            'value' => SafeEncrypted::class,
            'stale' => 'boolean',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<Workspace, $this> */
    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    /** @return BelongsTo<WorkspaceTeam, $this> */
    public function team(): BelongsTo
    {
        return $this->belongsTo(\App\Models\WorkspaceTeam::class, 'team_id');
    }

    /** @return BelongsTo<Integration, $this> */
    public function vaultIntegration(): BelongsTo
    {
        return $this->belongsTo(Integration::class, 'vault_integration_id');
    }
}
