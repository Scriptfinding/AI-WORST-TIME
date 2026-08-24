<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property bool $enabled
 * @property bool $include_unexposed_flow_previews
 * @property array<int, string>|null $enabled_tools
 * @property bool $stale
 */
class WorkspaceMcpSetting extends Model
{
    protected $fillable = [
        'workspace_id',
        'enabled',
        'include_unexposed_flow_previews',
        'enabled_tools',
        'stale',
    ];

    protected function casts(): array
    {
        return [
            'enabled' => 'boolean',
            'include_unexposed_flow_previews' => 'boolean',
            'enabled_tools' => 'array',
            'stale' => 'boolean',
        ];
    }

    /** @return BelongsTo<Workspace, $this> */
    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }
}
