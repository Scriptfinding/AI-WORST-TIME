<?php

namespace App\Services\Flow;

/**
 * Detects fixed resource ID values inside nodal graph parameters.
 */
class NodalGraphParameterMatcher
{
    /**
     * @param  array<string, mixed>|null  $graph
     * @param  array<int, array{node: string, parameter: string, value: string}>  $matches
     */
    public function hasFixedNodeParameter(?array $graph, array $matches): bool
    {
        if ($graph === null || $matches === [] || ! isset($graph['nodes']) || ! is_array($graph['nodes'])) {
            return false;
        }

        foreach ($graph['nodes'] as $node) {
            if (
                ! is_array($node)
                || ($node['deactivated'] ?? false) === true
                || ! isset($node['name'], $node['values'])
                || ! is_array($node['values'])
            ) {
                continue;
            }

            foreach ($matches as $match) {
                if ($node['name'] !== $match['node']) {
                    continue;
                }

                $parameter = $match['parameter'];
                if (
                    array_key_exists($parameter, $node['values'])
                    && $this->fixedParameterValueEquals($node['values'][$parameter], $match['value'])
                ) {
                    return true;
                }
            }
        }

        return false;
    }

    private function fixedParameterValueEquals(mixed $value, string $expected): bool
    {
        if (is_string($value)) {
            return $value === $expected;
        }

        if (! is_array($value)) {
            return false;
        }

        return ($value['mode'] ?? null) === 'fixed' && ($value['value'] ?? null) === $expected;
    }
}
