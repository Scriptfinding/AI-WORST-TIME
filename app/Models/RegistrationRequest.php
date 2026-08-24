<?php

namespace App\Models;

use App\Support\IdentityEmail;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property string|null $password
 * @property Carbon|null $email_verified_at
 * @property string $origin
 */
class RegistrationRequest extends Model
{
    public const ORIGIN_PASSWORD = 'password';

    public const ORIGIN_EMAIL = 'email';

    public const ORIGIN_SSO = 'sso';

    protected $fillable = [
        'name',
        'email',
        'password',
        'email_verified_at',
        'origin',
    ];

    protected $hidden = [
        'password',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
        ];
    }

    /** @return Attribute<string, string> */
    protected function email(): Attribute
    {
        return Attribute::make(
            set: fn (mixed $value): string => IdentityEmail::normalize($value),
        );
    }
}
