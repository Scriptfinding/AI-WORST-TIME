<?php

namespace App\Services\Mcp\Tools;

interface McpToolHandler
{
    /** @return list<array{name: string, description: string, inputSchema: array<string, mixed>}> */
    public function definitions(): array;

    public function handles(string $name): bool;

    /**
     * @param  array<string, mixed>  $arguments
     * @return array<string, mixed>
     */
    public function call(string $name, array $arguments, McpToolContext $context): array;
}
