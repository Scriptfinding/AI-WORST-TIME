<?php

namespace App\Services\Flow;

final class InputResourceReferenceResolver
{
    /**
     * @param  array<array-key, mixed>  $input
     * @return array<array-key, mixed>
     */
    public function resolve(array $input): array
    {
        return array_map($this->resolveValue(...), $input);
    }

    private function resolveValue(mixed $value): mixed
    {
        if (is_string($value) && preg_match(
            '/^\$\{(?:channels|mailboxWatchers|aiModels)\.([a-zA-Z0-9_.-]+)\}$/',
            $value,
            $matches,
        )) {
            return $matches[1];
        }

        return is_array($value) ? array_map($this->resolveValue(...), $value) : $value;
    }
}
