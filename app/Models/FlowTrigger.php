<?php

/*
 * Explicit proprietary scope: the paid shared-scope fields and relations in this file implement paid
 * Puppetflow features and are licensed under the Puppetflow Proprietary License.
 * See LICENSE_PROPRIETARY.md.
 */

namespace App\Models;

use App\Models\Concerns\HasStringId;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

/**
 * @property string $id
 * @property array<string, mixed>|null $config
 * @property array<array-key, mixed>|null $input_template
 * @property string $scope
 * @property string|null $team_id
 */
class FlowTrigger extends Model
{
    use HasStringId;

    public const ID_PREFIX = 'trig';

    protected $appends = ['endpoint_url'];

    protected $hidden = ['config', 'token', 'endpoint_url'];

    protected $fillable = [
        'flow_id',
        'user_id',
        'type',
        'label',
        'group',
        'input_template',
        'config',
        'is_active',
        'is_public',
        'scope',
        'team_id',
        'token',
        'last_triggered_at',
    ];

    protected function casts(): array
    {
        return [
            'input_template' => 'array',
            'config' => 'array',
            'is_active' => 'boolean',
            'is_public' => 'boolean',
            'last_triggered_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (FlowTrigger $trigger) {
            if ($trigger->type === 'webhook' && empty($trigger->token)) {
                $trigger->token = Str::random(48);
            }
        });
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

    public function getEndpointUrlAttribute(): string
    {
        return url("/api/trigger/{$this->token}");
    }
}
