<?php

namespace App\Models;

use App\Casts\SafeEncrypted;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $identity_provider_id
 * @property string $external_subject
 */
class SsoRegistrationRequest extends Model
{
    protected $fillable = [
        'registration_request_id',
        'identity_provider_id',
        'external_subject',
        'external_subject_hash',
        'username',
    ];

    protected $hidden = [
        'external_subject',
    ];

    protected function casts(): array
    {
        return [
            'external_subject' => SafeEncrypted::class,
        ];
    }

    /** @return BelongsTo<RegistrationRequest, $this> */
    public function registrationRequest(): BelongsTo
    {
        return $this->belongsTo(RegistrationRequest::class);
    }

    /** @return BelongsTo<IdentityProvider, $this> */
    public function provider(): BelongsTo
    {
        return $this->belongsTo(IdentityProvider::class, 'identity_provider_id');
    }
}
