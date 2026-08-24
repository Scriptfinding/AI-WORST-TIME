<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class ValidDraftNodalGraph implements ValidationRule
{
    private const MAX_NODES = 2000;

    private const MAX_EDGES = 5000;

    private const MAX_PAYLOAD_BYTES = 5 * 1024 * 1024;

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_array($value)) {
            return;
        }

        $nodes = $value['nodes'] ?? [];
        $edges = $value['edges'] ?? [];
        if (! is_array($nodes) || ! array_is_list($nodes)) {
            $fail('The nodal graph nodes must be a list.');

            return;
        }
        if (! is_array($edges) || ! array_is_list($edges)) {
            $fail('The nodal graph edges must be a list.');

            return;
        }
        if (count($nodes) > self::MAX_NODES || count($edges) > self::MAX_EDGES) {
            $fail('The nodal graph is too large to save.');

            return;
        }
        if (array_filter($nodes, fn (mixed $node): bool => ! is_array($node)) !== []) {
            $fail('Every nodal graph node must be an object.');

            return;
        }
        if (array_filter($edges, fn (mixed $edge): bool => ! is_array($edge)) !== []) {
            $fail('Every nodal graph edge must be an object.');

            return;
        }

        $encoded = json_encode($value);
        if ($encoded === false || strlen($encoded) > self::MAX_PAYLOAD_BYTES) {
            $fail('The nodal graph payload exceeds the maximum size.');
        }
    }
}
