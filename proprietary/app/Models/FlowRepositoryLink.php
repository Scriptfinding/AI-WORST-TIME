<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property string $flow_id
 * @property string $repo_full_name
 * @property string $branch
 * @property string $file_path
 */
class FlowRepositoryLink extends Model
{
    protected $fillable = [
        'flow_id',
        'integration_id',
        'repo_full_name',
        'branch',
        'file_path',
        'sync_trigger',
        'last_synced_at',
    ];

    protected function casts(): array
    {
        return [
            'last_synced_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Flow, $this> */
    public function flow(): BelongsTo
    {
        return $this->belongsTo(Flow::class);
    }

    /** @return BelongsTo<Integration, $this> */
    public function integration(): BelongsTo
    {
        return $this->belongsTo(Integration::class);
    }
}
