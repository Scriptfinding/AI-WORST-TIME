<?php

namespace App\Models;

use App\Casts\SafeEncrypted;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property string $type
 * @property string $name
 * @property array<string, mixed> $config
 * @property bool $is_enabled
 * @property bool $jit_enabled
 * @property \Illuminate\Support\Carbon|null $validated_at
 */
class IdentityProvider extends Model
{
    public const TYPE_SAML = 'saml';

    public const TYPE_LDAP = 'ldap';

    protected $fillable = [
        'type',
        'name',
        'config',
        'is_enabled',
        'jit_enabled',
        'validated_at',
    ];

    protected $hidden = ['config'];

    protected function casts(): array
    {
        return [
            'config' => SafeEncrypted::class.':true',
            'is_enabled' => 'boolean',
            'jit_enabled' => 'boolean',
            'validated_at' => 'datetime',
        ];
    }

    /** @return HasMany<UserExternalIdentity, $this> */
    public function identities(): HasMany
    {
        return $this->hasMany(UserExternalIdentity::class);
    }

    public function isReady(): bool
    {
        return $this->is_enabled && $this->validated_at !== null;
    }

    /** @return array<string, mixed> */
    public function configArray(): array
    {
        $config = $this->getAttribute('config');

        return is_array($config) ? $config : [];
    }

    public function configString(string $key, string $default = ''): string
    {
        $value = $this->configArray()[$key] ?? null;

        return is_scalar($value) ? (string) $value : $default;
    }

    public function configInt(string $key, int $default): int
    {
        $value = $this->configArray()[$key] ?? null;

        return is_numeric($value) ? (int) $value : $default;
    }
}
