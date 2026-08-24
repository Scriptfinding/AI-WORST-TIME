<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class IntegrationRepository extends Model
{
    protected $fillable = [
        'integration_id',
        'external_id',
        'name',
        'full_name',
        'default_branch',
        'url',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
        ];
    }

    /** @return BelongsTo<Integration, $this> */
    public function integration(): BelongsTo
    {
        return $this->belongsTo(Integration::class);
    }

    /** @return HasMany<FlowRepositoryLink, $this> */
    public function flowLinks(): HasMany
    {
        return $this->hasMany(FlowRepositoryLink::class);
    }
}
