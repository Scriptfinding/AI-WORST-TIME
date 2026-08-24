<?php

namespace App\Models;

use App\Casts\SafeEncrypted;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property array<array-key, mixed> $cookies
 */
class FlowUserCookieJar extends Model
{
    protected $fillable = [
        'flow_id',
        'user_id',
        'jar_name',
        'cookies',
    ];

    protected $hidden = [
        'cookies',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'cookies' => SafeEncrypted::class.':true',
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
}
