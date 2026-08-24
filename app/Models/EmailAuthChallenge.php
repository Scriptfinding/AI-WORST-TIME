<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * @property array<string, mixed>|null $context
 * @property Carbon $expires_at
 * @property Carbon $last_sent_at
 * @property Carbon|null $consumed_at
 */
class EmailAuthChallenge extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'email',
        'intent',
        'context',
        'pin_hash',
        'token_hash',
        'attempts',
        'ip_address',
        'expires_at',
        'last_sent_at',
        'consumed_at',
    ];

    protected $hidden = [
        'pin_hash',
        'token_hash',
    ];

    protected function casts(): array
    {
        return [
            'context' => 'array',
            'expires_at' => 'datetime',
            'last_sent_at' => 'datetime',
            'consumed_at' => 'datetime',
        ];
    }
}
