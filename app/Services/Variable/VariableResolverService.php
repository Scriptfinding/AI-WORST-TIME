<?php

/*
 * Explicit proprietary scope: the vault-backed variable resolution and paid shared scopes in this file implement paid
 * Puppetflow features and are licensed under the Puppetflow Proprietary License.
 * See LICENSE_PROPRIETARY.md.
 */

namespace App\Services\Variable;

use App\Authorization\AuthorizationContextFactory;
use App\Authorization\Visibility\SharedResourceVisibility;
use App\Models\User;
use App\Models\UserVariable;
use App\Services\FeatureFlags\FeatureFlagService;
use App\Services\Variable\TypeResolver\VariableTypeResolverChain;

class VariableResolverService
{
    public function __construct(
        private readonly VariableTypeResolverChain $typeResolverChain,
        private readonly AuthorizationContextFactory $contexts,
        private readonly SharedResourceVisibility $visibility,
    ) {}

    /**
     * @param  array<array-key, mixed>  $input
     * @param  list<string>|null  $secretValues
     * @return array<array-key, mixed>
     */
    public function resolve(
        array $input,
        ?string $userId,
        string $workspaceId,
        ?array &$secretValues = null,
        bool $allAccess = false,
    ): array {
        if (! $allAccess && ! app(FeatureFlagService::class)->enabled('variables_enabled')) {
            return $input;
        }

        $variables = $this->variableQuery($userId, $workspaceId, $allAccess)
            ->where('stale', false)
            ->get(['id', 'key', 'value', 'type', 'scope', 'user_id', 'vault_integration_id', 'vault_field_type'])
            ->all();

        if ($secretValues !== null) {
            foreach ($variables as $var) {
                /** @var UserVariable $var */
                if ($var->type === 'secret' || $this->typeResolverChain->isSecret($var->type)) {
                    $secretValues[] = $var->value;
                }
            }
            $secretValues = array_values(array_unique($secretValues));
        }

        $scalarMap = [];
        foreach ($variables as $var) {
            /** @var UserVariable $var */
            if ($this->typeResolverChain->supports($var->type)) {
                $resolved = $this->typeResolverChain->resolveValue($var, $workspaceId);
                if ($resolved !== null) {
                    $scalarMap[$var->id] = $resolved;
                    if ($secretValues !== null) {
                        $secretValues[] = $resolved;
                        $secretValues = array_values(array_unique($secretValues));
                    }
                }
            } elseif (! in_array($var->type, ['object', 'array', 'json'], true)) {
                $scalarMap[$var->id] = $var->value;
            }
        }

        $flat = $scalarMap;

        foreach ($variables as $var) {
            /** @var UserVariable $var */
            if (in_array($var->type, ['object', 'array', 'json'], true)) {
                $resolvedJson = $this->resolveStringVars($var->value, $scalarMap);
                $decoded = json_decode($resolvedJson, true);
                if (is_array($decoded)) {
                    $this->flattenValue($decoded, $var->id, $flat);
                    $flat[$var->id] = $decoded;
                } else {
                    $flat[$var->id] = $resolvedJson;
                }
            }
        }

        $resolved = $this->resolveRecursive($input, $flat);

        return is_array($resolved) ? $resolved : $input;
    }

    /** @return array<string, array{value: string|null, vault_field_type: string|null, label: string}> */
    public function buildVarsEnv(?string $userId, string $workspaceId, bool $allAccess = false): array
    {
        if (! $allAccess && ! app(FeatureFlagService::class)->enabled('variables_enabled')) {
            return [];
        }

        $variables = $this->variableQuery($userId, $workspaceId, $allAccess)
            ->where('stale', false)
            ->get(['id', 'key', 'value', 'type', 'scope', 'user_id', 'vault_integration_id', 'vault_field_type'])
            ->all();

        $map = [];
        foreach ($variables as $var) {
            /** @var UserVariable $var */
            $entry = $this->typeResolverChain->supports($var->type)
                ? $this->typeResolverChain->buildEnvEntry($var, $workspaceId)
                : ['value' => $var->value, 'vault_field_type' => null];
            $map[$var->id] = array_merge($entry, ['label' => $var->key]);
        }

        return $map;
    }

    /** @param array<array-key, mixed> $input */
    public function assertNoReferences(array $input): void
    {
        $this->walkStrings($input, function (string $value): void {
            if (preg_match('/\$\{vars\.([^}]+)\}/', $value, $matches) === 1) {
                throw new UnresolvedVariableException($matches[1]);
            }
        });
    }

    public function resolveVariable(UserVariable $var, string $workspaceId): ?string
    {
        if ((bool) $var->getAttribute('stale') || ! app(FeatureFlagService::class)->enabled('variables_enabled')) {
            return null;
        }

        if ($this->typeResolverChain->supports($var->type)) {
            return $this->typeResolverChain->resolveValue($var, $workspaceId);
        }

        return null;
    }

    /** @return \Illuminate\Database\Eloquent\Builder<UserVariable> */
    private function variableQuery(?string $userId, string $workspaceId, bool $allAccess): \Illuminate\Database\Eloquent\Builder
    {
        if ($allAccess) {
            return UserVariable::query()->where('workspace_id', $workspaceId);
        }

        return $userId === null
            ? UserVariable::query()->whereRaw('1 = 0')
            : $this->variablesForUser($userId, $workspaceId);
    }

    /** @return \Illuminate\Database\Eloquent\Builder<UserVariable> */
    private function variablesForUser(string $userId, string $workspaceId): \Illuminate\Database\Eloquent\Builder
    {
        $user = User::find($userId);
        if (! $user) {
            return UserVariable::query()->whereRaw('1 = 0');
        }

        $context = $this->contexts->for($user, $workspaceId);
        $query = $this->visibility->applyUse(UserVariable::query(), $context);

        return $query->where(function ($variables) use ($context) {
            $variables->whereNull('vault_integration_id')
                ->orWhereHas('vaultIntegration', function ($integration) use ($context) {
                    $this->visibility->applyUse($integration, $context);
                });
        });
    }

    /** @param array<string, mixed> $flat */
    private function flattenValue(mixed $data, string $prefix, array &$flat): void
    {
        if (is_array($data)) {
            foreach ($data as $k => $v) {
                $fullKey = "{$prefix}.{$k}";
                $flat[$fullKey] = $v;
                if (is_array($v)) {
                    $this->flattenValue($v, $fullKey, $flat);
                }
            }
        }
    }

    /** @param array<string, mixed> $variables */
    private function resolveStringVars(string $value, array $variables): string
    {
        return preg_replace_callback('/\$\{vars\.([^}]+)\}/', function (array $matches) use ($variables) {
            return $this->stringifyReference($this->resolveReference($matches[1], $variables));
        }, $value) ?? $value;
    }

    /** @param array<string, mixed> $variables */
    private function resolveRecursive(mixed $data, array $variables): mixed
    {
        if (is_string($data)) {
            if (preg_match('/^\$\{vars\.([^}]+)\}$/', $data, $matches) === 1) {
                return $this->resolveReference($matches[1], $variables);
            }

            return preg_replace_callback('/\$\{vars\.([^}]+)\}/', function (array $matches) use ($variables) {
                return $this->stringifyReference($this->resolveReference($matches[1], $variables));
            }, $data) ?? $data;
        }

        if (is_array($data)) {
            $result = [];
            foreach ($data as $key => $value) {
                $result[$key] = $this->resolveRecursive($value, $variables);
            }

            return $result;
        }

        return $data;
    }

    /** @param array<string, mixed> $variables */
    private function resolveReference(string $key, array $variables): mixed
    {
        if (! array_key_exists($key, $variables)) {
            throw new UnresolvedVariableException($key);
        }

        return $variables[$key];
    }

    private function stringifyReference(mixed $value): string
    {
        if (is_array($value)) {
            return json_encode($value) ?: '';
        }

        return is_scalar($value) || $value === null ? (string) $value : '';
    }

    /** @param callable(string): void $callback */
    private function walkStrings(mixed $data, callable $callback): void
    {
        if (is_string($data)) {
            $callback($data);

            return;
        }

        if (! is_array($data)) {
            return;
        }

        foreach ($data as $value) {
            $this->walkStrings($value, $callback);
        }
    }
}
