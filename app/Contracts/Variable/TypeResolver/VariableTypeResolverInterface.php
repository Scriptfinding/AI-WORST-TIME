<?php

namespace App\Contracts\Variable\TypeResolver;

use App\Models\UserVariable;

interface VariableTypeResolverInterface
{
    public function supports(string $type): bool;

    /**
     * Whether resolved values are secrets (masked in logs/output).
     */
    public function isSecret(): bool;

    /**
     * Resolve the stored value to its runtime value.
     */
    public function resolveValue(UserVariable $var, string $workspaceId): ?string;

    /**
     * Build the $vars env entry.
     *
     * @return array{value: ?string, vault_field_type: ?string}
     */
    public function buildEnvEntry(UserVariable $var, string $workspaceId): array;
}
