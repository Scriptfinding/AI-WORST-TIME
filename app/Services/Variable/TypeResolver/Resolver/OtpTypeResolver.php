<?php

namespace App\Services\Variable\TypeResolver\Resolver;

use App\Contracts\Variable\TypeResolver\VariableTypeResolverInterface;
use App\Models\UserVariable;

class OtpTypeResolver implements VariableTypeResolverInterface
{
    public function supports(string $type): bool
    {
        return $type === 'otp';
    }

    public function isSecret(): bool
    {
        return true;
    }

    public function resolveValue(UserVariable $var, string $workspaceId): ?string
    {
        return $this->computeTotp($var->value);
    }

    public function buildEnvEntry(UserVariable $var, string $workspaceId): array
    {
        return [
            // The runtime recomputes a fresh code from the otpauth URI on every
            // $vars() call; a precomputed code would expire after ~30 seconds.
            'value' => $this->otpauthUri($var->value),
            'vault_field_type' => 'OTP',
        ];
    }

    private function otpauthUri(string $seed): string
    {
        $seed = trim($seed);
        if (str_starts_with($seed, 'otpauth://')) {
            return $seed;
        }

        $normalized = preg_replace('/\s+/u', '', strtoupper($seed)) ?? '';

        return 'otpauth://totp/variable?secret='.rawurlencode($normalized);
    }

    private function computeTotp(string $seed): ?string
    {
        $seed = trim($seed);
        $period = 30;
        $digits = 6;
        $algorithm = 'sha1';
        if (str_starts_with($seed, 'otpauth://')) {
            $query = parse_url($seed, PHP_URL_QUERY);
            $query = is_string($query) ? $query : '';
            $otpParams = [
                'secret' => [],
                'period' => [],
                'digits' => [],
                'algorithm' => [],
            ];
            foreach (explode('&', $query) as $pair) {
                [$key, $value] = array_pad(explode('=', $pair, 2), 2, '');
                $key = urldecode($key);
                if (array_key_exists($key, $otpParams)) {
                    $otpParams[$key][] = urldecode($value);
                }
            }
            if (count($otpParams['secret']) !== 1
                || count($otpParams['period']) > 1
                || count($otpParams['digits']) > 1
                || count($otpParams['algorithm']) > 1) {
                return null;
            }
            $seed = $otpParams['secret'][0];
            $periodValue = $otpParams['period'][0] ?? null;
            if (is_string($periodValue) && preg_match('/^[1-9]\d*$/', $periodValue) === 1) {
                $period = (int) $periodValue;
            }
            $digitsValue = $otpParams['digits'][0] ?? null;
            if (is_string($digitsValue) && preg_match('/^[1-9]\d*$/', $digitsValue) === 1) {
                $digits = min((int) $digitsValue, 10);
            }
            $algorithmValue = $otpParams['algorithm'][0] ?? null;
            $requestedAlgorithm = strtolower(is_string($algorithmValue) ? $algorithmValue : '');
            if (in_array($requestedAlgorithm, ['sha1', 'sha256', 'sha512'], true)) {
                $algorithm = $requestedAlgorithm;
            }
        }

        $seed = preg_replace('/\s+/u', '', strtoupper($seed)) ?? '';

        $key = $this->base32Decode($seed);
        if ($key === null || $key === '') {
            return null;
        }

        $counter = pack('J', intdiv(time(), $period));
        $hash = hash_hmac($algorithm, $counter, $key, true);
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
