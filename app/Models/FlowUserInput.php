<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property array<array-key, mixed>|null $input
 */
class FlowUserInput extends Model
{
    protected $fillable = [
        'flow_id',
        'user_id',
        'input',
    ];

    protected $casts = [
        'input' => 'array',
    ];

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
