<?php

namespace App\Services\Licensing;

use RuntimeException;

class LicensePublicKey
{
    /**
     * Official Puppetflow license public key (Ed25519, base64 encoded).
     *
     * This value is pinned in code on purpose and cannot be overridden: loading
     * it from a configurable path would let a self-hosted operator swap it for
     * their own key and forge license files or fake license server responses.
     * Update it only when rotating the official signing keypair.
     */
    private const OFFICIAL_KEY = 'FuYZzYy5OnVdJeSTKkgl7CaZdAbSpILkKMtAxPc4eZU=';

    /**
     * @return non-empty-string
     */
    public function material(): string
    {
        $decoded = base64_decode(self::OFFICIAL_KEY, true);
        if ($decoded === false || strlen($decoded) !== SODIUM_CRYPTO_SIGN_PUBLICKEYBYTES) {
            throw new RuntimeException('Invalid license public key.');
        }

        return $decoded;
    }

    /**
     * Fingerprint of the key actually in use, reported to the license server
     * so tampered installations can be detected remotely.
     */
    public function fingerprint(): string
    {
        return hash('sha256', self::OFFICIAL_KEY);
    }
}
