<?php

namespace App\Services\Integration\Vault\Concerns;

trait HandlesVaultValues
{
    private function encodeVaultId(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }

    private function decodeVaultId(string $value): string
    {
        $padded = str_pad(strtr($value, '-_', '+/'), strlen($value) % 4 === 0 ? strlen($value) : strlen($value) + 4 - strlen($value) % 4, '=', STR_PAD_RIGHT);

        return base64_decode($padded, true) ?: $value;
    }

    private function fieldType(mixed $value): string
    {
        if (is_string($value) && str_starts_with($value, 'otpauth://')) {
            return 'OTP';
        }

        if (is_array($value) || is_object($value)) {
            return 'JSON';
        }

        if (is_bool($value)) {
            return 'BOOLEAN';
        }

        if (is_int($value) || is_float($value)) {
            return 'NUMBER';
        }

        return 'STRING';
    }

    private function secretValue(mixed $value, bool $raw = false): ?string
    {
        if ($value === null) {
            return null;
        }

        if (is_array($value) || is_object($value)) {
            $stringValue = json_encode($value);
        } elseif (is_scalar($value)) {
            $stringValue = (string) $value;
        } else {
            return null;
        }

        if ($stringValue === false) {
            return null;
        }

        if (! $raw && str_starts_with($stringValue, 'otpauth://')) {
            return $this->computeTotp($stringValue);
        }

        return $stringValue;
    }

    private function computeTotp(string $otpauthUri): ?string
    {
        $query = parse_url($otpauthUri, PHP_URL_QUERY);
        if (! $query) {
            return null;
        }

        parse_str($query, $params);
        $secret = $params['secret'] ?? null;
        if (! is_string($secret) || $secret === '') {
            return null;
        }

        $key = $this->base32Decode($secret);
        if ($key === null) {
            return null;
        }

        $digits = (int) ($params['digits'] ?? 6);
        $period = (int) ($params['period'] ?? 30);
        $configuredAlgorithm = $params['algorithm'] ?? 'sha1';
        $algorithm = strtolower(is_string($configuredAlgorithm) ? $configuredAlgorithm : 'sha1');
        $counter = pack('J', intdiv(time(), $period));
        $hash = hash_hmac($algorithm === 'sha256' ? 'sha256' : ($algorithm === 'sha512' ? 'sha512' : 'sha1'), $counter, $key, true);
        $offset = ord($hash[strlen($hash) - 1]) & 0x0F;
        $code = (
            ((ord($hash[$offset]) & 0x7F) << 24) |
            ((ord($hash[$offset + 1]) & 0xFF) << 16) |
            ((ord($hash[$offset + 2]) & 0xFF) << 8) |
            (ord($hash[$offset + 3]) & 0xFF)
        ) % (10 ** $digits);

        return str_pad((string) $code, $digits, '0', STR_PAD_LEFT);
    }

    private function base32Decode(string $input): ?string
    {
        $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $input = strtoupper(rtrim($input, '='));
        $buffer = 0;
        $bitsLeft = 0;
        $output = '';

        for ($i = 0, $len = strlen($input); $i < $len; $i++) {
            $val = strpos($alphabet, $input[$i]);
            if ($val === false) {
                return null;
            }

            $buffer = ($buffer << 5) | $val;
            $bitsLeft += 5;

            if ($bitsLeft >= 8) {
                $bitsLeft -= 8;
                $output .= chr(($buffer >> $bitsLeft) & 0xFF);
            }
        }

        return $output;
    }
}
