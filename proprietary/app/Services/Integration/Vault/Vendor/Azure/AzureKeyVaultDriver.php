<?php

namespace App\Services\Integration\Vault\Vendor\Azure;

use App\Contracts\Integration\Vault\VaultDriverInterface;
use App\DTO\Integration\IntegrationValidationResult;
use App\DTO\Integration\Vault\AzureKeyVaultConfig;
use App\DTO\Integration\Vault\VaultConfig;
use App\Enums\Integration\IntegrationVaultProviderEnum;
use App\Services\Integration\Vault\Concerns\HandlesVaultValues;
use App\Services\Security\PublicHttpTargetGuard;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;

class AzureKeyVaultDriver implements VaultDriverInterface
{
    use HandlesVaultValues;

    private const API_VERSION = '7.4';

    public function __construct(
        private readonly PublicHttpTargetGuard $httpTargets,
    ) {}

    public function supports(IntegrationVaultProviderEnum $provider): bool
    {
        return $provider === IntegrationVaultProviderEnum::AZURE_KEY_VAULT;
    }

    public function validateCredentials(VaultConfig $config): IntegrationValidationResult
    {
        $config = $this->values($config);
        if (empty($config['vault_url']) || empty($config['tenant_id']) || empty($config['client_id']) || empty($config['client_secret'])) {
            return IntegrationValidationResult::failure('Vault URL, tenant ID, client ID and client secret are required.');
        }

        if (parse_url($this->configString($config, 'vault_url'), PHP_URL_SCHEME) !== 'https') {
            return IntegrationValidationResult::failure('Vault URL must use https.');
        }

        try {
            $response = $this->client($config)->get('/secrets', [
                'api-version' => self::API_VERSION,
                'maxresults' => 1,
            ]);

            $error = $response->json('error.message');

            return $response->successful()
                ? IntegrationValidationResult::success()
                : IntegrationValidationResult::failure(is_string($error) ? $error : 'Invalid Azure Key Vault credentials.');
        } catch (\Throwable $e) {
            return IntegrationValidationResult::failure($e->getMessage());
        }
    }

    public function listVaults(VaultConfig $config): array
    {
        $config = $this->values($config);

        return [[
            'id' => 'default',
            'name' => parse_url($this->vaultUrl($config), PHP_URL_HOST) ?: $this->vaultUrl($config),
        ]];
    }

    public function listItems(VaultConfig $config, string $vaultId): array
    {
        $config = $this->values($config);
        $items = [];
        $nextUrl = '/secrets';
        $query = ['api-version' => self::API_VERSION];

        while ($nextUrl) {
            if (str_starts_with($nextUrl, 'http') && ! $this->isSameVaultHost($config, $nextUrl)) {
                break;
            }

            $response = str_starts_with($nextUrl, 'http')
                ? Http::withToken($this->accessToken($config))->acceptJson()->get($nextUrl)
                : $this->client($config)->get($nextUrl, $query);

            if (! $response->successful()) {
                break;
            }

            $secrets = $response->json('value');
            foreach (is_iterable($secrets) ? $secrets : [] as $secret) {
                if (! is_array($secret)) {
                    continue;
                }

                $id = $secret['id'] ?? '';
                $name = $this->secretNameFromId(is_string($id) ? $id : '');
                if (! $name) {
                    continue;
                }

                $items[] = [
                    'id' => $this->encodeVaultId($name),
                    'title' => $name,
                    'category' => 'Secret',
                ];
            }

            $nextLink = $response->json('nextLink');
            $nextUrl = is_string($nextLink) && $nextLink !== '' ? $nextLink : null;
        }

        return $items;
    }

    public function listItemFields(VaultConfig $config, string $vaultId, string $itemId): array
    {
        $config = $this->values($config);
        $secretName = rawurlencode($this->decodeVaultId($itemId));
        $fields = [[
            'id' => 'latest',
            'label' => 'latest',
            'type' => 'STRING',
        ]];

        $response = $this->client($config)->get("/secrets/{$secretName}/versions", [
            'api-version' => self::API_VERSION,
        ]);

        if (! $response->successful()) {
            return $fields;
        }

        $versions = $response->json('value');
        foreach (is_iterable($versions) ? $versions : [] as $version) {
            if (! is_array($version)) {
                continue;
            }

            $id = $version['id'] ?? '';
            $versionId = basename(parse_url(is_string($id) ? $id : '', PHP_URL_PATH) ?: '');
            if (! $versionId) {
                continue;
            }

            $fields[] = [
                'id' => $versionId,
                'label' => $versionId,
                'type' => 'STRING',
            ];
        }

        return $fields;
    }

    public function getSecret(VaultConfig $config, string $vaultId, string $itemId, string $fieldLabel, bool $raw = false): ?string
    {
        $config = $this->values($config);
        $secretName = rawurlencode($this->decodeVaultId($itemId));
        $path = $fieldLabel === 'latest'
            ? "/secrets/{$secretName}"
            : "/secrets/{$secretName}/".rawurlencode($fieldLabel);
        $response = $this->client($config)->get($path, ['api-version' => self::API_VERSION]);

        return $response->successful()
            ? $this->secretValue($response->json('value'), $raw)
            : null;
    }

    /**
     * @param  array<string, mixed>  $config
     */
    private function client(array $config): PendingRequest
    {
        $vaultUrl = $this->vaultUrl($config);

        return Http::withToken($this->accessToken($config))
            ->acceptJson()
            ->withOptions($this->httpTargets->requestOptions($vaultUrl))
            ->baseUrl($vaultUrl);
    }

    /**
     * @param  array<string, mixed>  $config
     */
    private function accessToken(array $config): string
    {
        $tenantId = $this->configString($config, 'tenant_id');
        $response = Http::asForm()->post("https://login.microsoftonline.com/{$tenantId}/oauth2/v2.0/token", [
            'client_id' => $this->configString($config, 'client_id'),
            'client_secret' => $this->configString($config, 'client_secret'),
            'grant_type' => 'client_credentials',
            'scope' => 'https://vault.azure.net/.default',
        ]);

        if (! $response->successful()) {
            $error = $response->json('error_description');
            throw new \RuntimeException(is_string($error) ? $error : 'Unable to obtain Azure access token.');
        }

        $accessToken = $response->json('access_token');
        if (! is_string($accessToken) || $accessToken === '') {
            throw new \RuntimeException('Azure returned an invalid access token.');
        }

        return $accessToken;
    }

    /**
     * @param  array<string, mixed>  $config
     */
    private function vaultUrl(array $config): string
    {
        $url = rtrim($this->configString($config, 'vault_url'), '/');
        $host = strtolower((string) parse_url($url, PHP_URL_HOST));
        $trustedSuffixes = [
            '.vault.azure.net',
            '.vault.azure.cn',
            '.vault.usgovcloudapi.net',
        ];
        $trustedHost = false;
        foreach ($trustedSuffixes as $suffix) {
            if (str_ends_with($host, $suffix)) {
                $trustedHost = true;
                break;
            }
        }
        if (! $trustedHost) {
            throw new \InvalidArgumentException('Azure Key Vault URL hostname is not trusted.');
        }

        return $url;
    }

    /**
     * @param  array<string, mixed>  $config
     */
    private function isSameVaultHost(array $config, string $url): bool
    {
        $vaultHost = parse_url($this->vaultUrl($config), PHP_URL_HOST);
        $urlHost = parse_url($url, PHP_URL_HOST);

        return is_string($vaultHost) && is_string($urlHost) && strcasecmp($vaultHost, $urlHost) === 0;
    }

    private function secretNameFromId(string $id): ?string
    {
        $parts = explode('/', trim(parse_url($id, PHP_URL_PATH) ?: '', '/'));

        return count($parts) >= 2 && $parts[0] === 'secrets' ? $parts[1] : null;
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
        if (! $config instanceof AzureKeyVaultConfig) {
            throw new \InvalidArgumentException('Azure driver requires Azure Key Vault configuration.');
        }

        return $config->toArray();
    }
}
