<?php

namespace App\Services\Integration\Vault\Vendor\Aws;

use App\Contracts\Integration\Vault\VaultDriverInterface;
use App\DTO\Integration\IntegrationValidationResult;
use App\DTO\Integration\Vault\AwsSecretsManagerConfig;
use App\DTO\Integration\Vault\VaultConfig;
use App\Enums\Integration\IntegrationVaultProviderEnum;
use App\Services\Integration\Vault\Concerns\HandlesVaultValues;
use Aws\Exception\AwsException;
use Aws\SecretsManager\SecretsManagerClient;

class AwsSecretsManagerDriver implements VaultDriverInterface
{
    use HandlesVaultValues;

    public function supports(IntegrationVaultProviderEnum $provider): bool
    {
        return $provider === IntegrationVaultProviderEnum::AWS_SECRETS_MANAGER;
    }

    public function validateCredentials(VaultConfig $config): IntegrationValidationResult
    {
        $config = $this->values($config);
        if (empty($config['region']) || empty($config['access_key_id']) || empty($config['secret_access_key'])) {
            return IntegrationValidationResult::failure('Region, access key ID and secret access key are required.');
        }

        try {
            $this->client($config)->listSecrets(['MaxResults' => 1]);

            return IntegrationValidationResult::success();
        } catch (\Throwable $e) {
            return IntegrationValidationResult::failure($e instanceof AwsException ? ($e->getAwsErrorMessage() ?? $e->getMessage()) : $e->getMessage());
        }
    }

    public function listVaults(VaultConfig $config): array
    {
        $config = $this->values($config);
        $region = $this->configString($config, 'region');

        return [[
            'id' => $this->encodeVaultId($region),
            'name' => $region,
        ]];
    }

    public function listItems(VaultConfig $config, string $vaultId): array
    {
        $config = $this->values($config);
        $client = $this->client($config);
        $items = [];
        $nextToken = null;

        do {
            $args = ['MaxResults' => 100];
            if ($nextToken) {
                $args['NextToken'] = $nextToken;
            }

            $result = $client->listSecrets($args);

            $secretList = $result['SecretList'] ?? [];
            foreach (is_iterable($secretList) ? $secretList : [] as $secret) {
                if (! is_array($secret)) {
                    continue;
                }

                $name = $secret['Name'] ?? null;
                if (! is_string($name) || $name === '') {
                    continue;
                }

                $items[] = [
                    'id' => $this->encodeVaultId($name),
                    'title' => $name,
                    'category' => 'Secret',
                ];
            }

            $resultNextToken = $result['NextToken'] ?? null;
            $nextToken = is_string($resultNextToken) && $resultNextToken !== '' ? $resultNextToken : null;
        } while ($nextToken);

        return $items;
    }

    public function listItemFields(VaultConfig $config, string $vaultId, string $itemId): array
    {
        $config = $this->values($config);
        $secret = $this->getSecretPayload($config, $this->decodeVaultId($itemId));
        $decoded = $this->decodeJsonObject($secret);

        if ($decoded === null) {
            return [[
                'id' => 'value',
                'label' => 'value',
                'type' => $this->fieldType($secret),
            ]];
        }

        return array_map(fn (string $key) => [
            'id' => $key,
            'label' => $key,
            'type' => $this->fieldType($decoded[$key] ?? null),
        ], array_keys($decoded));
    }

    public function getSecret(VaultConfig $config, string $vaultId, string $itemId, string $fieldLabel, bool $raw = false): ?string
    {
        $config = $this->values($config);
        $secret = $this->getSecretPayload($config, $this->decodeVaultId($itemId));
        $decoded = $this->decodeJsonObject($secret);

        if ($decoded === null) {
            return $fieldLabel === 'value' ? $this->secretValue($secret, $raw) : null;
        }

        return array_key_exists($fieldLabel, $decoded)
            ? $this->secretValue($decoded[$fieldLabel], $raw)
            : null;
    }

    /**
     * @param  array<string, mixed>  $config
     */
    private function client(array $config): SecretsManagerClient
    {
        $credentials = [
            'key' => $this->configString($config, 'access_key_id'),
            'secret' => $this->configString($config, 'secret_access_key'),
        ];

        if (! empty($config['session_token'])) {
            $credentials['token'] = $this->configString($config, 'session_token');
        }

        return new SecretsManagerClient([
            'version' => 'latest',
            'region' => $this->configString($config, 'region'),
            'credentials' => $credentials,
        ]);
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
        if (! $config instanceof AwsSecretsManagerConfig) {
            throw new \InvalidArgumentException('AWS driver requires AWS Secrets Manager configuration.');
        }

        return $config->toArray();
    }

    /**
     * @param  array<string, mixed>  $config
     */
    private function getSecretPayload(array $config, string $secretId): ?string
    {
        try {
            $result = $this->client($config)->getSecretValue(['SecretId' => $secretId]);

            if (isset($result['SecretString']) && is_string($result['SecretString'])) {
                return $result['SecretString'];
            }

            if (isset($result['SecretBinary']) && is_string($result['SecretBinary'])) {
                return base64_decode($result['SecretBinary'], true) ?: null;
            }
        } catch (\Throwable) {
            return null;
        }

        return null;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function decodeJsonObject(?string $value): ?array
    {
        if ($value === null) {
            return null;
        }

        $decoded = json_decode($value, true);

        if (! is_array($decoded) || array_is_list($decoded)) {
            return null;
        }

        /** @var array<string, mixed> $decoded */
        return $decoded;
    }
}
