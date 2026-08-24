<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property \Illuminate\Support\Carbon|null $revoked_at
 * @property \Illuminate\Support\Carbon|null $created_at
 */
class McpOauthClient extends Model
{
    protected $fillable = [
        'workspace_id',
        'user_id',
        'oauth_client_id',
        'name',
        'redirect_uri',
        'revoked_at',
        'stale',
    ];

    protected function casts(): array
    {
        return [
            'revoked_at' => 'datetime',
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
}
