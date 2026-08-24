<?php

namespace App\Services\Flow;

use Illuminate\Support\Facades\File;

final class NodalCatalogService
{
    private const CONTROL_NODES = [
        ['name' => 'Code', 'signature' => 'Code(code)', 'description' => 'Run custom JavaScript.', 'category' => 'Code', 'parameters' => ['code' => ['required' => true]]],
        ['name' => 'If / Else', 'signature' => 'If / Else(condition)', 'description' => 'Branch on a condition.', 'category' => 'Control', 'parameters' => ['condition' => ['required' => true]], 'ports' => ['input' => ['input'], 'output' => ['true', 'false']]],
        ['name' => 'Loop', 'signature' => 'Loop(mode, items, iterations, condition, maxIterations)', 'description' => 'Repeat a branch.', 'category' => 'Control', 'parameters' => ['mode' => ['required' => true]], 'ports' => ['input' => ['input'], 'output' => ['loop', 'done']]],
        ['name' => 'Merge', 'signature' => 'Merge(strategy)', 'description' => 'Merge branch results.', 'category' => 'Control', 'parameters' => []],
        ['name' => 'No-op', 'signature' => 'No-op()', 'description' => 'Connect steps without executing an action.', 'category' => 'Control', 'parameters' => []],
        ['name' => 'Filter', 'signature' => 'Filter(array, predicate)', 'description' => 'Filter an array.', 'category' => 'Data', 'parameters' => []],
        ['name' => 'Limit', 'signature' => 'Limit(array, offset, count)', 'description' => 'Limit array items.', 'category' => 'Data', 'parameters' => []],
        ['name' => 'Set', 'signature' => 'Set(variables)', 'description' => 'Set run variables.', 'category' => 'Data', 'parameters' => []],
        ['name' => '$setOutput', 'signature' => '$setOutput(variables)', 'description' => 'Set flow output values.', 'category' => 'Data', 'parameters' => []],
        ['name' => '$meta', 'signature' => '$meta(metadata)', 'description' => 'Set run metadata.', 'category' => 'Data', 'parameters' => []],
    ];

    /** @return list<array<string, mixed>> */
    public function entries(string $context = 'flow'): array
    {
        $path = base_path('src/sandbox/run-header.js');
        $raw = File::exists($path) ? File::get($path) : '';
        $entries = self::CONTROL_NODES;

        preg_match_all('/\/\*\s*@help\s+(.+?)\n([\s\S]*?)\*\//', $raw, $blocks, PREG_SET_ORDER);
        foreach ($blocks as $block) {
            $body = $block[2];
            $signature = $this->tag($body, 'sig');
            $name = preg_replace('/\(.*$/', '', $signature) ?: '';
            if ($name === '' || collect($entries)->contains(fn (array $entry) => $entry['name'] === $name)) {
                continue;
            }
            $availability = strtolower($this->tag($body, 'availability') ?: 'both');
            if (! in_array($availability, ['nodal', 'code', 'both'], true)) {
                $availability = 'both';
            }
            if ($availability === 'code') {
                continue;
            }

            $flowParameters = $this->flowParameters($body);
            $entries[] = [
                'name' => $name,
                'signature' => $signature,
                'description' => $this->tag($body, 'nodal-desc') ?: $this->tag($body, 'desc'),
                'category' => trim($block[1]),
                'availability' => $availability,
                'parameters' => $this->parameters($body, $signature),
                'flowParameters' => $flowParameters,
                'ports' => [
                    'input' => ['input'],
                    'output' => ['output', ...array_column($flowParameters, 'portId')],
                ],
            ];
        }

        return array_map(fn (array $entry): array => [
            ...$entry,
            'availability' => $entry['availability'] ?? 'nodal',
            'ports' => $entry['ports'] ?? ['input' => ['input'], 'output' => ['output']],
        ], $entries);
    }

    /** @return list<string> */
    public function names(): array
    {
        return array_map(
            fn (array $entry): string => is_string($entry['name'] ?? null) ? $entry['name'] : '',
            $this->entries(),
        );
    }

    private function tag(string $body, string $tag): string
    {
        return preg_match('/@'.preg_quote($tag, '/').'\s+(.+)/', $body, $match)
            ? trim($match[1])
            : '';
    }

    /** @return list<array{path: non-empty-list<string>, tokens: list<string>, description: string}> */
    private function nodalParamTags(string $body): array
    {
        preg_match_all('/@nodal-param\s+([a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)*)(?:\s+\[([a-zA-Z,\s-]+)\])?\s*[:-]\s*(.+)/', $body, $matches, PREG_SET_ORDER);

        return array_map(fn (array $match): array => [
            'path' => explode('.', $match[1]),
            'tokens' => array_values(array_filter(array_map(
                fn (string $token): string => strtolower(trim($token)),
                explode(',', $match[2]),
            ))),
            'description' => trim($match[3]),
        ], $matches);
    }

    /** @return array<string, array<string, mixed>> */
    private function parameters(string $body, string $signature): array
    {
        $parameters = [];
        foreach ($this->nodalParamTags($body) as $tag) {
            $parameter = $tag['path'][0];
            // Sub-field hints (e.g. options.loginUrl) describe nested object
            // fields handled by the editor. They must not make the top-level
            // parameter required here, or graphs saved before the sub-field
            // requirements existed would fail validation.
            $isTopLevel = count($tag['path']) === 1;
            $parameters[$parameter] = [
                'description' => $parameters[$parameter]['description'] ?? $tag['description'],
                'required' => ($parameters[$parameter]['required'] ?? false)
                    || ($isTopLevel && in_array('required', $tag['tokens'], true)),
                'valueType' => $parameters[$parameter]['valueType']
                    ?? ($isTopLevel ? $this->valueTypeToken($tag['tokens']) : null),
            ];
        }

        if (preg_match('/\((.*)\)/', $signature, $args)) {
            foreach (array_filter(array_map('trim', explode(',', $args[1]))) as $argument) {
                $name = ltrim(rtrim($argument, '?'), '.');
                $parameters[$name] ??= ['description' => '', 'required' => false];
            }
        }

        return $parameters;
    }

    /** @param list<string> $tokens */
    private function valueTypeToken(array $tokens): ?string
    {
        foreach ($tokens as $token) {
            if ($token !== 'required') {
                return $token;
            }
        }

        return null;
    }

    /** @return list<array{argument: string, path: list<string>, portId: string, label: string, required: bool}> */
    private function flowParameters(string $body): array
    {
        $parameters = [];
        foreach ($this->nodalParamTags($body) as $tag) {
            if (! in_array('flow', $tag['tokens'], true)) {
                continue;
            }

            $path = $tag['path'];
            $fieldName = (string) end($path);
            $label = ucfirst(preg_replace('/([a-z0-9])([A-Z])/', '$1 $2', str_replace(['_', '-'], ' ', $fieldName)) ?: $fieldName);
            $parameters[] = [
                'argument' => $path[0],
                'path' => $path,
                'portId' => $this->flowPortId($path),
                'label' => $label,
                'required' => in_array('required', $tag['tokens'], true),
            ];
        }

        return $parameters;
    }

    /**
     * Mirrors getFlowParameterPortId() in
     * resources/js/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/flowParameters.ts.
     * Both implementations must produce identical port ids.
     *
     * @param  list<string>  $path
     */
    private function flowPortId(array $path): string
    {
        $slug = preg_replace('/[^A-Za-z0-9_-]+/', '-', implode('-', $path)) ?: 'callback';
        $slug = trim(preg_replace('/-+/', '-', $slug) ?: $slug, '-');
        $base = 'flow-'.($slug !== '' ? $slug : 'callback');
        if (strlen($base) <= 64) {
            return $base;
        }

        $hash = 2166136261;
        foreach (str_split($base) as $character) {
            $hash ^= ord($character);
            $hash = ($hash * 16777619) & 0xFFFFFFFF;
        }
        $suffix = base_convert((string) $hash, 10, 36);

        return substr($base, 0, 63 - strlen($suffix)).'-'.$suffix;
    }
}
