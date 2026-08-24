<?php

namespace App\Services\Mcp\Tools;

final class McpToolArguments
{
    /** @param array<string, mixed> $arguments */
    public static function string(array $arguments, string $key, string $default = ''): string
    {
        $value = $arguments[$key] ?? $default;

        return is_string($value) || is_numeric($value) ? (string) $value : $default;
    }

    /** @param array<string, mixed> $arguments */
    public static function integer(array $arguments, string $key, int $default = 0): int
    {
        $value = $arguments[$key] ?? $default;

        return is_int($value) || is_numeric($value) ? (int) $value : $default;
    }
}
