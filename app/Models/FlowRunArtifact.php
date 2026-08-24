<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FlowRunArtifact extends Model
{
    public const STATUS_PENDING = 'pending';

    public const STATUS_READY = 'ready';

    public const STATUS_FAILED = 'failed';

    protected $fillable = [
        'flow_run_id',
        'type',
        'relative_path',
        'storage_path',
        'disk',
        'size_bytes',
        'mime_type',
        'checksum_sha256',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'size_bytes' => 'integer',
        ];
    }

    /** @return BelongsTo<FlowRun, $this> */
    public function flowRun(): BelongsTo
    {
        return $this->belongsTo(FlowRun::class);
    }
}
