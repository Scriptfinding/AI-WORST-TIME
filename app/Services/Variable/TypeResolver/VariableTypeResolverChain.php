<?php

namespace App\Services\Variable\TypeResolver;

use App\Contracts\Variable\TypeResolver\VariableTypeResolverInterface;
use App\Models\UserVariable;

class VariableTypeResolverChain
{
    /** @var VariableTypeResolverInterface[] */
    private array $resolvers;

    public function __construct(VariableTypeResolverInterface ...$resolvers)
    {
        $this->resolvers = $resolvers;
    }

    public function supports(string $type): bool
    {
        foreach ($this->resolvers as $resolver) {
            if ($resolver->supports($type)) {
                return true;
            }
        }

        return false;
    }

    public function isSecret(string $type): bool
    {
        foreach ($this->resolvers as $resolver) {
            if ($resolver->supports($type)) {
                return $resolver->isSecret();
            }
        }

        return false;
    }

    public function resolveValue(UserVariable $var, string $workspaceId): ?string
    {
        foreach ($this->resolvers as $resolver) {
            if ($resolver->supports($var->type)) {
                return $resolver->resolveValue($var, $workspaceId);
            }
        }

        return null;
    }

    /** @return array{value: string|null, vault_field_type: string|null} */
    public function buildEnvEntry(UserVariable $var, string $workspaceId): array
    {
        foreach ($this->resolvers as $resolver) {
            if ($resolver->supports($var->type)) {
                return $resolver->buildEnvEntry($var, $workspaceId);
            }
        }

        return ['value' => $var->value, 'vault_field_type' => null];
    }
}
