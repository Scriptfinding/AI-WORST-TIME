<?php

namespace App\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

/**
 * @implements CastsAttributes<mixed, array<array-key, mixed>|string|null>
 */
class SafeEncrypted implements CastsAttributes
{
    public function __construct(
        protected bool $asArray = false,
        protected bool $jsonEnvelope = false,
    ) {}

    public function get(Model $model, string $key, mixed $value, array $attributes): mixed
    {
        if ($value === null) {
            return $this->asArray ? [] : null;
        }
        if (is_array($value)) {
            return $this->asArray ? $value : null;
        }
        if (! is_string($value)) {
            return $this->asArray ? [] : $value;
        }

        $encrypted = $value;
        if ($this->jsonEnvelope) {
            $decoded = json_decode($value, true);
            if (is_array($decoded)) {
                return $this->asArray ? $decoded : $value;
            }
            if (is_string($decoded)) {
                $encrypted = $decoded;
            }
        }

        try {
            $decrypted = Crypt::decryptString($encrypted);
            return $this->asArray ? json_decode($decrypted, true) ?? [] : $decrypted;
        } catch (DecryptException $exception) {
            if ($this->jsonEnvelope) {
                throw $exception;
            }

            if ($this->asArray) {
                $decoded = json_decode($value, true);

                return is_array($decoded) ? $decoded : [];
            }

            return $value;
        }
    }

    public function set(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        if ($value === null) {
            return null;
        }

        $raw = $this->asArray ? json_encode($value) : $value;

        if (! is_string($raw)) {
            throw new \TypeError('Encrypted value must be a string or JSON-encodable array.');
        }

        $encrypted = Crypt::encryptString($raw);

        if (! $this->jsonEnvelope) {
            return $encrypted;
        }

        $encoded = json_encode($encrypted);

        if ($encoded === false) {
            throw new \RuntimeException('Unable to encode the encrypted value.');
        }

        return $encoded;
    }
}
