<?php

namespace App\Services\Integration\Vault\Vendor\Hashicorp;

use App\Contracts\Integration\Vault\VaultDriverInterface;
use App\DTO\Integration\IntegrationValidationResult;
use App\DTO\Integration\Vault\HashicorpVaultConfig;
use App\DTO\Integration\Vault\VaultConfig;
use App\Enums\Integration\IntegrationVaultProviderEnum;
use App\Services\Integration\Http\IntegrationHttpClientFactory;
use App\Services\Integration\Vault\Concerns\HandlesVaultValues;
use Illuminate\Http\Client\PendingRequest;

class HashicorpVaultDriver implements VaultDriverInterface
{
    use HandlesVaultValues;

    private const DEFAULT_MOUNT = 'secret';

    private const MAX_LISTED_SECRETS = 200;

    private const MAX_DEPTH = 5;

    public function __construct(
        private readonly IntegrationHttpClientFactory $httpClients,
    ) {}

    public function supports(IntegrationVaultProviderEnum $provider): bool
    {
        return $provider === IntegrationVaultProviderEnum::HASHICORP_VAULT;
    }

    public function validateCredentials(VaultConfig $config): IntegrationValidationResult
    {
        $config = $this->values($config);
        if (empty($config['server_url']) || empty($config['token'])) {
            return IntegrationValidationResult::failure('Server URL and token are required.');
        }

        if (! in_array(parse_url($this->configString($config, 'server_url'), PHP_URL_SCHEME), ['http', 'https'], true)) {
            return IntegrationValidationResult::failure('Server URL must use http or https.');
        }

        try {
            $response = $this->client($config)->get('/auth/token/lookup-self');

            return $response->successful()
                ? IntegrationValidationResult::success()
                : IntegrationValidationResult::failure('Invalid Vault token or server unreachable.');
        } catch (\Throwable $e) {
            return IntegrationValidationResult::failure($e->getMessage());
        }
    }

    public function listVaults(VaultConfig $config): array
    {
        $config = $this->values($config);
        $mount = $this->mount($config);

        return [[
            'id' => $this->encodeVaultId($mount),
            'name' => $mount,
        ]];
    }

    public function listItems(VaultConfig $config, string $vaultId): array
    {
        $config = $this->values($config);
        $mount = $this->decodeVaultId($vaultId);
        $paths = $this->listSecretPaths($config, $mount);

        return array_map(fn (string $path) => [
            'id' => $this->encodeVaultId($path),
            'title' => $path,
            'category' => 'KV v2',
        ], $paths);
    }

    public function listItemFields(VaultConfig $config, string $vaultId, string $itemId): array
    {
        $config = $this->values($config);
        $data = $this->readSecretData($config, $this->decodeVaultId($vaultId), $this->decodeVaultId($itemId));

        return array_map(fn (string $key) => [
            'id' => $key,
            'label' => $key,
            'type' => $this->fieldType($data[$key] ?? null),
        ], array_keys($data));
    }

    public function getSecret(VaultConfig $config, string $vaultId, string $itemId, string $fieldLabel, bool $raw = false): ?string
    {
        $config = $this->values($config);
        $data = $this->readSecretData($config, $this->decodeVaultId($vaultId), $this->decodeVaultId($itemId));

        return array_key_exists($fieldLabel, $data)
            ? $this->secretValue($data[$fieldLabel], $raw)
            : null;
    }

    /**
     * @param  array<string, mixed>  $config
     */
    private function client(array $config): PendingRequest
    {
        $serverUrl = $this->configString($config, 'server_url');
        $client = $this->httpClients->for($serverUrl)
            ->withToken($this->configString($config, 'token'))
            ->acceptJson()
            ->baseUrl(rtrim($serverUrl, '/').'/v1');

        if (! empty($config['namespace'])) {
            $client = $client->withHeaders(['X-Vault-Namespace' => $this->configString($config, 'namespace')]);
        }

        return $client;
    }

    /**
     * @param  array<string, mixed>  $config
     */
    private function mount(array $config): string
    {
        $mount = $this->configString($config, 'mount');

        return trim($mount !== '' ? $mount : self::DEFAULT_MOUNT, '/');
    }

    /**
     * @param  array<string, mixed>  $config
     * @return list<string>
     */
    private function listSecretPaths(array $config, string $mount): array
    {
        $paths = [];
        $this->collectSecretPaths($config, $mount, '', $paths, 0);

        return $paths;
    }

    /**
     * @param  array<string, mixed>  $config
     * @param  list<string>  $paths
     */
    private function collectSecretPaths(array $config, string $mount, string $prefix, array &$paths, int $depth): void
    {
        if (count($paths) >= self::MAX_LISTED_SECRETS || $depth > self::MAX_DEPTH) {
            return;
        }

        $response = $this->client($config)->get($this->metadataPath($mount, $prefix), ['list' => 'true']);

        if (! $response->successful()) {
            return;
        }

        $keys = $response->json('data.keys');
        foreach (is_iterable($keys) ? $keys : [] as $key) {
            if (! is_string($key)) {
                continue;
            }

            $path = $prefix.$key;

            if (str_ends_with($key, '/')) {
                $this->collectSecretPaths($config, $mount, rtrim($path, '/').'/', $paths, $depth + 1);

                continue;
            }

            $paths[] = $path;

            if (count($paths) >= self::MAX_LISTED_SECRETS) {
                return;
            }
        }
    }

    /**
     * @param  array<string, mixed>  $config
     * @return array<string, mixed>
     */
    private function readSecretData(array $config, string $mount, string $path): array
    {
        $response = $this->client($config)->get($this->dataPath($mount, $path));

        if (! $response->successful()) {
            return [];
        }

        $data = $response->json('data.data');
        if (! is_array($data) || array_is_list($data)) {
            return [];
        }

        /** @var array<string, mixed> $data */
        return $data;
    }

    private function metadataPath(string $mount, string $path): string
    {
        return $this->vaultApiPath($mount, 'metadata', $path);
    }

    private function dataPath(string $mount, string $path): string
    {
        return $this->vaultApiPath($mount, 'data', $path);
    }

    private function vaultApiPath(string $mount, string $section, string $path): string
    {
        $encodedPath = collect(explode('/', trim($path, '/')))
            ->filter(fn (string $segment) => $segment !== '')
            ->map(fn (string $segment) => rawurlencode($segment))
            ->implode('/');

        return '/'.rawurlencode($mount)."/{$section}".($encodedPath !== '' ? "/{$encodedPath}" : '');
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
        if (! $config instanceof HashicorpVaultConfig) {
            throw new \InvalidArgumentException('HashiCorp driver requires HashiCorp Vault configuration.');
        }

        return $config->toArray();
    }
}
