<?php

namespace App\Rules;

use App\Services\Flow\NodalCatalogService;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class ValidNodalGraph implements ValidationRule
{
    private const MAX_NODES = 2000;

    private const MAX_EDGES = 5000;

    private const MAX_PAYLOAD_BYTES = 5 * 1024 * 1024;

    private const RESERVED_IDENTIFIERS = [
        'await', 'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger',
        'default', 'delete', 'do', 'else', 'enum', 'export', 'extends', 'false',
        'finally', 'for', 'function', 'if', 'import', 'in', 'instanceof', 'let',
        'new', 'null', 'return', 'static', 'super', 'switch', 'this', 'throw',
        'true', 'try', 'typeof', 'var', 'void', 'while', 'with', 'yield',
    ];

    private const RUNTIME_IDENTIFIERS = [
        '$page', '$input', '$nodes', '$run', '$output', '$context', '$json',
        '$vars', '$userOutput', '$renderExpression', '$keyboardSpeed',
        '$viewportWidth', '$viewportHeight',
    ];

    public function __construct(private readonly string $context = 'flow') {}

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

        if (count($nodes) > self::MAX_NODES) {
            $fail('The nodal graph exceeds the maximum of '.self::MAX_NODES.' nodes.');

            return;
        }

        if (count($edges) > self::MAX_EDGES) {
            $fail('The nodal graph exceeds the maximum of '.self::MAX_EDGES.' edges.');

            return;
        }

        $catalog = collect(app(NodalCatalogService::class)->entries($this->context))->keyBy('name');
        $nodeIds = [];
        $nodeLabels = [];
        $nodeScopes = [];
        $nodeDeactivated = [];
        $functionRoots = 0;
        $localFunctionRoots = [];
        $localFunctionCalls = [];
        $localFunctionNames = [];
        $nodeOutputPorts = [];
        $requiredFlowParameters = [];
        foreach ($nodes as $index => $node) {
            if (! is_array($node)) {
                $fail("The nodal graph node at index {$index} must be an object.");

                return;
            }

            $nodeLabel = $this->nodeLabel($node, $index);
            $id = $node['id'] ?? null;
            $entry = $node['entry'] ?? null;
            $name = is_array($entry) ? ($entry['name'] ?? null) : ($node['name'] ?? null);
            if (! is_string($id) || $id === '' || strlen($id) > 255) {
                $fail("The nodal graph node at index {$index} has an invalid ID.");

                return;
            }
            if (isset($nodeIds[$id])) {
                $existingNodeLabel = $nodeLabels[$id] ?? 'another node';
                $fail("The {$existingNodeLabel} and {$nodeLabel} nodes use the same internal identifier.");

                return;
            }
            $nodeIds[$id] = true;
            $nodeLabels[$id] = $nodeLabel;
            $deactivated = $node['deactivated'] ?? false;
            if (array_key_exists('deactivated', $node) && ! is_bool($node['deactivated'])) {
                $fail("The {$nodeLabel} node has an invalid deactivated state.");

                return;
            }
            $nodeDeactivated[$id] = $deactivated;

            $system = $node['system'] ?? null;
            $scopeId = $node['scopeId'] ?? null;
            $localFunctionId = $node['localFunctionId'] ?? null;
            if ($scopeId !== null && (! is_string($scopeId) || $scopeId === '')) {
                $fail("The {$nodeLabel} node has an invalid function scope.");

                return;
            }
            $nodeScopes[$id] = $scopeId;
            $isLocalFunctionSystem = is_string($scopeId) && $system === 'function';
            $isSystem = $this->context === 'function'
                ? $system === 'function'
                : in_array($system, ['run', 'terminate'], true) || $isLocalFunctionSystem;
            if ($system !== null && ! $isSystem) {
                $fail("The {$nodeLabel} node is not a valid system node for this graph.");

                return;
            }
            if ($system === 'function') {
                if ($name !== 'FUNCTION') {
                    $fail('Function entry nodes must use the FUNCTION name.');

                    return;
                }
                if ($isLocalFunctionSystem) {
                    if ($id !== $scopeId || isset($localFunctionRoots[$scopeId])) {
                        $fail('Each private function must have its own valid scope.');

                        return;
                    }
                    $localFunctionRoots[$scopeId] = $id;
                    $functionName = $this->parameterValue($node['values'] ?? [], 'name');
                    if (! preg_match('/^[A-Za-z_$][A-Za-z0-9_$]*$/', $functionName) || in_array($functionName, self::RESERVED_IDENTIFIERS, true)) {
                        $fail("The {$nodeLabel} private function must use a valid JavaScript identifier.");

                        return;
                    }
                    if ($catalog->has($functionName) || in_array($functionName, ['Function', 'FUNCTION', 'RUN', 'TERMINATE'], true)) {
                        $fail("The private function name {$functionName} is reserved.");

                        return;
                    }
                    if (isset($localFunctionNames[$functionName])) {
                        $fail("The private function name {$functionName} is already used.");

                        return;
                    }
                    $localFunctionNames[$functionName] = true;
                    $arguments = $this->functionArguments($node['values'] ?? []);
                    if (count($arguments) !== count(array_unique($arguments))) {
                        $fail("The private function {$functionName} contains duplicate arguments.");

                        return;
                    }
                    foreach ($arguments as $argument) {
                        if (
                            ! preg_match('/^[A-Za-z_$][A-Za-z0-9_$]*$/', $argument)
                            || in_array($argument, self::RESERVED_IDENTIFIERS, true)
                            || in_array($argument, self::RUNTIME_IDENTIFIERS, true)
                            || str_starts_with($argument, '__pf')
                            || str_starts_with($argument, 'nodeResult')
                        ) {
                            $fail("The private function {$functionName} contains an invalid argument.");

                            return;
                        }
                    }
                } else {
                    if ($id !== '__system_function') {
                        $fail('The function graph must use the canonical FUNCTION entry node.');

                        return;
                    }
                    $functionRoots++;
                }
            }
            $isSticky = ($node['kind'] ?? null) === 'stickyNote' || $name === '__sticky_note';
            $isSnippet = is_string($name) && preg_match('/^\$\$[A-Za-z_$][\w$]*$/', $name) === 1;
            $isLocalCall = is_string($localFunctionId) && $localFunctionId !== '';
            if ($isLocalCall) {
                $localFunctionCalls[$id] = $localFunctionId;
            }
            if (! is_string($name) || (! $isSystem && ! $isSticky && ! $isSnippet && ! $isLocalCall && ! $catalog->has($name))) {
                $fail("The {$nodeLabel} node has an unknown type.");

                return;
            }
            if ($deactivated && ($isSystem || $isSticky)) {
                $fail("The {$nodeLabel} node cannot be deactivated.");

                return;
            }

            if (! is_numeric($node['x'] ?? null) || ! is_numeric($node['y'] ?? null)) {
                $fail("The {$nodeLabel} node must have numeric coordinates.");

                return;
            }

            $values = $node['values'] ?? [];
            if (! is_array($values)) {
                $fail("The {$nodeLabel} node values must be an object.");

                return;
            }

            $catalogEntry = $catalog->get($name);
            $parameters = is_array($catalogEntry) && is_array($catalogEntry['parameters'] ?? null)
                ? $catalogEntry['parameters']
                : [];
            if (is_array($catalogEntry)) {
                $ports = is_array($catalogEntry['ports'] ?? null) ? $catalogEntry['ports'] : [];
                $nodeOutputPorts[$id] = is_array($ports['output'] ?? null) ? $ports['output'] : ['output'];
                $requiredFlowParameters[$id] = array_values(array_filter(
                    is_array($catalogEntry['flowParameters'] ?? null) ? $catalogEntry['flowParameters'] : [],
                    fn (mixed $definition): bool => is_array($definition) && ($definition['required'] ?? false),
                ));
            }
            if ($deactivated) {
                continue;
            }
            foreach ($parameters as $parameter => $definition) {
                if (
                    is_array($definition)
                    && ($definition['required'] ?? false)
                    && ($definition['valueType'] ?? null) !== 'flow'
                    && ! array_key_exists($parameter, $values)
                ) {
                    $parameterLabel = is_string($definition['label'] ?? null)
                        ? $definition['label']
                        : $parameter;
                    $fail("{$parameterLabel} is required for the {$nodeLabel} node.");

                    return;
                }
            }
        }

        if ($this->context === 'function' && $functionRoots !== 1) {
            $fail('The function graph must contain exactly one FUNCTION entry node.');

            return;
        }
        foreach ($nodeScopes as $nodeId => $scopeId) {
            if ($scopeId !== null && ! isset($localFunctionRoots[$scopeId])) {
                $nodeLabel = $nodeLabels[$nodeId] ?? 'Unknown';
                $fail("The {$nodeLabel} node belongs to an unknown function scope.");

                return;
            }
        }
        foreach ($localFunctionCalls as $nodeId => $functionId) {
            if (! isset($localFunctionRoots[$functionId])) {
                $nodeLabel = $nodeLabels[$nodeId] ?? 'Unknown function call';
                $fail("The {$nodeLabel} node references an unknown private function.");

                return;
            }
        }

        $edgeIds = [];
        $connectedOutputPorts = [];
        foreach ($edges as $index => $edge) {
            if (! is_array($edge)) {
                $fail("The nodal graph edge at index {$index} must be an object.");

                return;
            }

            $id = $edge['id'] ?? null;
            $source = $edge['sourceNodeId'] ?? null;
            $target = $edge['targetNodeId'] ?? null;
            if (! is_string($id) || $id === '' || isset($edgeIds[$id])) {
                $fail("The nodal graph edge at index {$index} has an invalid or duplicate ID.");

                return;
            }
            $edgeIds[$id] = true;

            if (! is_string($source) || ! isset($nodeIds[$source]) || ! is_string($target) || ! isset($nodeIds[$target])) {
                $fail('A nodal graph connection references an unknown node.');

                return;
            }
            $sourceLabel = $nodeLabels[$source];
            $targetLabel = $nodeLabels[$target];
            if (($nodeScopes[$source] ?? null) !== ($nodeScopes[$target] ?? null)) {
                $fail("The connection from {$sourceLabel} to {$targetLabel} cannot cross function scopes.");

                return;
            }
            foreach (['sourcePort', 'targetPort'] as $portKey) {
                if (isset($edge[$portKey]) && (! is_string($edge[$portKey]) || ! preg_match('/^[A-Za-z0-9_-]{1,64}$/', $edge[$portKey]))) {
                    $fail("The connection from {$sourceLabel} to {$targetLabel} has an invalid port.");

                    return;
                }
            }
            $sourcePort = $edge['sourcePort'] ?? 'output';
            if (
                str_starts_with($sourcePort, 'flow-')
                && isset($nodeOutputPorts[$source])
                && ! in_array($sourcePort, $nodeOutputPorts[$source], true)
            ) {
                $fail("The connection from {$sourceLabel} to {$targetLabel} uses an unknown output port.");

                return;
            }
            $connectedOutputPorts[$source][$sourcePort] = true;
        }

        foreach ($nodes as $node) {
            if (! is_array($node) || ! is_string($node['id'] ?? null)) {
                continue;
            }
            $nodeId = $node['id'];
            if ($nodeDeactivated[$nodeId] ?? false) {
                continue;
            }
            $nodeValues = is_array($node['values'] ?? null) ? $node['values'] : [];
            foreach ($requiredFlowParameters[$nodeId] ?? [] as $definition) {
                $portId = $definition['portId'] ?? null;
                if (is_string($portId) && ($connectedOutputPorts[$nodeId][$portId] ?? false)) {
                    continue;
                }
                $path = array_values(array_filter(
                    is_array($definition['path'] ?? null) ? $definition['path'] : [],
                    'is_string',
                ));
                if ($this->hasLegacyFlowParameterValue($nodeValues, $path)) {
                    continue;
                }

                $label = is_string($definition['label'] ?? null) ? $definition['label'] : 'flow';
                $nodeLabel = $nodeLabels[$nodeId] ?? 'Unknown';
                $fail("The {$nodeLabel} node must connect {$label}.");

                return;
            }
        }

        $encoded = json_encode($value);
        if ($encoded === false || strlen($encoded) > self::MAX_PAYLOAD_BYTES) {
            $fail('The nodal graph payload is too large.');
        }
    }

    /** @param array<array-key, mixed> $node */
    private function nodeLabel(array $node, int $index): string
    {
        $label = $node['label'] ?? null;
        if (is_string($label) && trim($label) !== '') {
            return $this->sanitizeNodeLabel($label);
        }

        $system = $node['system'] ?? null;
        if ($system === 'run') {
            return 'Run';
        }
        if ($system === 'terminate') {
            return 'Finally';
        }
        if ($system === 'function') {
            $functionName = $this->parameterValue(
                is_array($node['values'] ?? null) ? $node['values'] : [],
                'name',
            );

            return $functionName !== '' ? $this->sanitizeNodeLabel($functionName) : 'Function';
        }
        if (($node['kind'] ?? null) === 'stickyNote') {
            return 'Sticky note';
        }

        $entry = $node['entry'] ?? null;
        $name = is_array($entry) ? ($entry['name'] ?? null) : ($node['name'] ?? null);
        if (is_string($name) && trim($name) !== '') {
            $humanized = ltrim(trim($name), '$');
            $humanized = preg_replace('/([a-z0-9])([A-Z])/', '$1 $2', $humanized) ?? $humanized;
            $humanized = preg_replace('/[_-]+/', ' ', $humanized) ?? $humanized;

            return $this->sanitizeNodeLabel(ucfirst($humanized));
        }

        return 'Node '.($index + 1);
    }

    private function sanitizeNodeLabel(string $label): string
    {
        $sanitized = preg_replace('/[\x00-\x1F\x7F]+/u', ' ', trim($label)) ?? '';
        $sanitized = preg_replace('/\s+/u', ' ', $sanitized) ?? $sanitized;
        if ($sanitized === '') {
            return 'Unknown';
        }

        return mb_strlen($sanitized) > 80
            ? mb_substr($sanitized, 0, 77).'...'
            : $sanitized;
    }

    /** @param array<string, mixed> $values */
    private function parameterValue(array $values, string $key): string
    {
        $value = $values[$key] ?? '';
        if (is_array($value)) {
            $value = $value['value'] ?? '';
        }

        return is_string($value) ? trim($value) : '';
    }

    /** @param array<string, mixed> $values
     * @return list<string>
     */
    private function functionArguments(array $values): array
    {
        $arguments = $values['arguments'] ?? null;
        if (is_array($arguments) && ($arguments['mode'] ?? null) === 'object') {
            if (($arguments['inputMode'] ?? null) === 'form') {
                return array_values(array_filter(array_map(
                    fn (mixed $field): string => is_array($field) && is_string($field['key'] ?? null)
                        ? trim($field['key'])
                        : '',
                    is_array($arguments['fields'] ?? null) ? $arguments['fields'] : [],
                )));
            }

            $decoded = json_decode(is_string($arguments['value'] ?? null) ? $arguments['value'] : '{}', true);

            return is_array($decoded) && ! array_is_list($decoded)
                ? array_map('strval', array_keys($decoded))
                : [];
        }

        return array_values(array_filter(array_map(
            'trim',
            explode(',', $this->parameterValue($values, 'arguments')),
        )));
    }

    /**
     * Graphs saved before dedicated flow output ports existed configured flow
     * parameters inline (e.g. a login recipe stored as a function value). The
     * compiler still honors those values, so they satisfy the connection
     * requirement. Mirrored by hasLegacyFlowParameterValue() in
     * resources/js/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/validation.ts.
     *
     * @param  array<string, mixed>  $values
     * @param  list<string>  $path
     */
    private function hasLegacyFlowParameterValue(array $values, array $path): bool
    {
        $key = $path[0] ?? null;
        if (! is_string($key) || ! array_key_exists($key, $values)) {
            return false;
        }

        $current = $values[$key];
        foreach (array_slice($path, 1) as $segment) {
            if (! is_array($current)) {
                return false;
            }

            if (($current['mode'] ?? null) === 'object') {
                if (($current['inputMode'] ?? null) === 'json') {
                    if (($current['jsonMode'] ?? null) === 'expression') {
                        return true;
                    }
                    $decoded = json_decode(is_string($current['value'] ?? null) ? $current['value'] : '', true);
                    $current = is_array($decoded) ? ($decoded[$segment] ?? null) : null;

                    continue;
                }

                $fieldValue = null;
                foreach (is_array($current['fields'] ?? null) ? $current['fields'] : [] as $field) {
                    if (is_array($field) && ($field['key'] ?? null) === $segment) {
                        $fieldValue = $field['value'] ?? null;
                        break;
                    }
                }
                $current = $fieldValue;

                continue;
            }

            if (isset($current['mode'])) {
                // A scalar expression covers the whole object; it cannot be
                // inspected, so assume it provides the nested value.
                return is_string($current['value'] ?? null) && trim($current['value']) !== '';
            }

            // Plain decoded JSON from a parent segment.
            $current = $current[$segment] ?? null;
        }

        return $this->isNonEmptyParameterLeaf($current);
    }

    private function isNonEmptyParameterLeaf(mixed $value): bool
    {
        if (is_array($value)) {
            if (isset($value['mode'])) {
                $inner = $value['value'] ?? null;

                return is_string($inner)
                    ? trim($inner) !== ''
                    : ($inner !== null && $inner !== []) || ($value['fields'] ?? []) !== [];
            }

            return $value !== [];
        }
        if (is_string($value)) {
            return trim($value) !== '';
        }

        return $value !== null;
    }
}
