<?php

namespace App\Services\Integration\Vault\Vendor\OnePassword;

use App\Contracts\Integration\Vault\VaultDriverInterface;
use App\DTO\Integration\IntegrationValidationResult;
use App\DTO\Integration\Vault\OnePasswordVaultConfig;
use App\DTO\Integration\Vault\VaultConfig;
use App\Enums\Integration\IntegrationVaultProviderEnum;
use App\Services\Integration\Http\IntegrationHttpClientFactory;
use Illuminate\Http\Client\PendingRequest;

class OnePasswordDriver implements VaultDriverInterface
{
    public function __construct(
        private readonly IntegrationHttpClientFactory $httpClients,
    ) {}

    public function supports(IntegrationVaultProviderEnum $provider): bool
    {
        return $provider === IntegrationVaultProviderEnum::ONEPASSWORD;
    }

    /**
     * @param  array<string, mixed>  $config
     */
    private function client(array $config): PendingRequest
    {
        $serverUrl = $this->configString($config, 'server_url');

        return $this->httpClients->for($serverUrl)
            ->withToken($this->configString($config, 'token'))
            ->baseUrl(rtrim($serverUrl, '/').'/v1');
    }

    public function validateCredentials(VaultConfig $config): IntegrationValidationResult
    {
        $config = $this->values($config);
        if (empty($config['server_url']) || empty($config['token'])) {
            return IntegrationValidationResult::failure('Server URL and token are required.');
        }

        try {
            $response = $this->client($config)->get('/vaults');

            if ($response->successful()) {
                return IntegrationValidationResult::success();
            }

            return IntegrationValidationResult::failure('Invalid credentials or server unreachable.');
        } catch (\Throwable $e) {
            return IntegrationValidationResult::failure($e->getMessage());
        }
    }

    public function listVaults(VaultConfig $config): array
    {
        $config = $this->values($config);
        $response = $this->client($config)->get('/vaults');
        $vaults = $response->json();
        $result = [];

        foreach (is_iterable($vaults) ? $vaults : [] as $vault) {
            if (! is_array($vault) || ! is_string($vault['id'] ?? null) || ! is_string($vault['name'] ?? null)) {
                continue;
            }

            $result[] = ['id' => $vault['id'], 'name' => $vault['name']];
        }

        return $result;
    }

    public function listItems(VaultConfig $config, string $vaultId): array
    {
        $config = $this->values($config);
        $response = $this->client($config)->get("/vaults/{$vaultId}/items");
        $items = $response->json();
        $result = [];

        foreach (is_iterable($items) ? $items : [] as $item) {
            if (! is_array($item) || ! is_string($item['id'] ?? null) || ! is_string($item['title'] ?? null)) {
                continue;
            }

            $category = $item['category'] ?? 'LOGIN';
            $result[] = [
                'id' => $item['id'],
                'title' => $item['title'],
                'category' => is_string($category) ? $category : 'LOGIN',
            ];
        }

        return $result;
    }

    public function listItemFields(VaultConfig $config, string $vaultId, string $itemId): array
    {
        $config = $this->values($config);
        $response = $this->client($config)->get("/vaults/{$vaultId}/items/{$itemId}");

        if (! $response->successful()) {
            return [];
        }

        $item = $response->json();
        $fields = is_array($item) ? ($item['fields'] ?? []) : [];
        $result = [];

        foreach (is_iterable($fields) ? $fields : [] as $field) {
            if (! is_array($field)) {
                continue;
            }

            $id = is_string($field['id'] ?? null) ? $field['id'] : '';
            $label = is_string($field['label'] ?? null) ? $field['label'] : $id;
            $type = is_string($field['type'] ?? null) ? $field['type'] : 'STRING';
            if ($label === '' || $id === 'notesPlain' || $label === 'notesPlain') {
                continue;
            }

            $result[] = ['id' => $id, 'label' => $label, 'type' => $type];
        }

        return $result;
    }

    public function getSecret(VaultConfig $config, string $vaultId, string $itemId, string $fieldLabel, bool $raw = false): ?string
    {
        $config = $this->values($config);
        $response = $this->client($config)->get("/vaults/{$vaultId}/items/{$itemId}");

        if (! $response->successful()) {
            return null;
        }

        $item = $response->json();
        $fields = is_array($item) ? ($item['fields'] ?? []) : [];

        foreach (is_iterable($fields) ? $fields : [] as $field) {
            if (! is_array($field)) {
                continue;
            }

            if (($field['label'] ?? '') === $fieldLabel || ($field['id'] ?? '') === $fieldLabel) {
                $value = $field['value'] ?? null;

                if (! is_string($value)) {
                    return null;
                }

                if (! $raw && $value !== '' && (($field['type'] ?? '') === 'OTP' || str_starts_with($value, 'otpauth://'))) {
                    return $this->computeTotp($value);
                }

                return $value;
            }
        }

        return null;
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

        $digits = (int) ($params['digits'] ?? 6);
        $period = (int) ($params['period'] ?? 30);
        $configuredAlgorithm = $params['algorithm'] ?? 'sha1';
        $algorithm = strtolower(is_string($configuredAlgorithm) ? $configuredAlgorithm : 'sha1');

        $key = $this->base32Decode($secret);
        if ($key === null) {
            return null;
        }

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

    /**
     * @param  array<string, mixed>  $config
     */
    private function configString(array $config, string $key): string
    {
        $value = $config[$key] ?? '';

        return is_scalar($value) ? (string) $value : '';
    }

    /** @return array<string, mixed> */
    private function values(VaultConfig $config): array
    {
        if (! $config instanceof OnePasswordVaultConfig) {
            throw new \InvalidArgumentException('1Password driver requires 1Password configuration.');
        }

        return $config->toArray();
    }
}
