<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property string $user_id
 * @property string $external_subject
 * @property string $external_subject_hash
 * @property string|null $email_snapshot
 */
class UserExternalIdentity extends Model
{
    protected $fillable = [
        'user_id',
        'identity_provider_id',
        'external_subject',
        'external_subject_hash',
        'email_snapshot',
    ];

    protected static function booted(): void
    {
        static::saving(function (UserExternalIdentity $identity): void {
            $identity->external_subject_hash = hash('sha256', $identity->external_subject);
        });
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<IdentityProvider, $this> */
    public function provider(): BelongsTo
    {
        return $this->belongsTo(IdentityProvider::class, 'identity_provider_id');
    }
}
