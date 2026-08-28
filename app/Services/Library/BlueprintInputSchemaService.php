<?php

namespace App\Services\Library;

use App\DTO\Library\LibraryFlowItem;
use App\Models\Flow;

class BlueprintInputSchemaService
{
    private const REFERENCE_TYPES = ['channel', 'mailbox-watcher', 'ai-model', 'datatable'];

    public const TYPES = ['string', 'number', 'boolean', 'array', 'object', 'null', 'channel', 'mailbox-watcher', 'ai-model', 'datatable'];

    public static function defaultValueForType(string $type): mixed
    {
        return self::isStringBackedType($type) ? '' : null;
    }

    /** @return list<array{name: string, type: string, default: mixed}> */
    public function currentDefinitions(Flow $flow, ?LibraryFlowItem $latest = null): array
    {
        if (is_array($flow->blueprint_input_definitions)) {
            return $this->normalize($flow->blueprint_input_definitions);
        }

        if ($flow->flow_type === 'code') {
            return $this->fromCode((string) $flow->code);
        }

        if (
            $latest instanceof LibraryFlowItem
            && $flow->library_source_sha
            && $flow->library_source_sha === $latest->sourceSha
        ) {
            return $latest->inputDefinitions;
        }

        return [];
    }

    /**
     * @param  list<array{name: string, type: string, default: mixed}>  $oldDefinitions
     * @param  list<array{name: string, type: string, default: mixed}>  $newDefinitions
     * @param  array<string, mixed>  $currentValues
     * @return array<string, mixed>
     */
    public function reconcile(array $oldDefinitions, array $newDefinitions, array $currentValues): array
    {
        $oldByName = [];
        foreach ($oldDefinitions as $definition) {
            $oldByName[$definition['name']] = $definition;
        }

        $values = [];
        foreach ($newDefinitions as $definition) {
            $name = $definition['name'];
            $old = $oldByName[$name] ?? null;
            $values[$name] = $old !== null
                && $old['type'] === $definition['type']
                && array_key_exists($name, $currentValues)
                    ? $currentValues[$name]
                    : $definition['default'];
        }

        return $values;
    }

    /**
     * Keeps only values matching the schema, filling missing ones with defaults.
     *
     * @param  list<array{name: string, type: string, default: mixed}>  $definitions
     * @param  array<string, mixed>  $values
     * @return array<string, mixed>
     */
    public function sanitize(array $definitions, array $values): array
    {
        return $this->reconcile($definitions, $definitions, $values);
    }

    /**
     * @param  list<array{name: string, type: string, default: mixed}>  $oldDefinitions
     * @param  list<array{name: string, type: string, default: mixed}>  $newDefinitions
     * @return array{
     *     added: list<array{name: string, type: string}>,
     *     removed: list<array{name: string, type: string}>,
     *     type_changed: list<array{name: string, before: string, after: string}>,
     *     has_changes: bool
     * }
     */
    public function diff(array $oldDefinitions, array $newDefinitions): array
    {
        $oldByName = $this->byName($oldDefinitions);
        $newByName = $this->byName($newDefinitions);
        $added = [];
        $removed = [];
        $typeChanged = [];

        foreach ($newByName as $name => $definition) {
            if (! isset($oldByName[$name])) {
                $added[] = ['name' => $name, 'type' => $definition['type']];
            } elseif ($oldByName[$name]['type'] !== $definition['type']) {
                $typeChanged[] = [
                    'name' => $name,
                    'before' => $oldByName[$name]['type'],
                    'after' => $definition['type'],
                ];
            }
        }
        foreach ($oldByName as $name => $definition) {
            if (! isset($newByName[$name])) {
                $removed[] = ['name' => $name, 'type' => $definition['type']];
            }
        }

        return [
            'added' => $added,
            'removed' => $removed,
            'type_changed' => $typeChanged,
            'has_changes' => $added !== [] || $removed !== [] || $typeChanged !== [],
        ];
    }

    /** @return list<array{name: string, type: string, default: mixed}> */
    public function fromCode(string $code): array
    {
        $definitions = [];
        foreach (preg_split('/\R/', $code) ?: [] as $line) {
            $line = trim($line);
            if ($line === '') {
                continue;
            }
            if (! str_starts_with($line, '//')) {
                break;
            }
            if (! preg_match('/^\/\/\s*@input\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s+\[([a-z-]+)\](?:\s*:\s*(.*))?$/i', $line, $matches)) {
                continue;
            }

            $type = strtolower($matches[2]);
            $parsed = $this->parseDefault($type, $matches[3] ?? '');
            if ($parsed['valid']) {
                $definitions[] = ['name' => $matches[1], 'type' => $type, 'default' => $parsed['value']];
            }
        }

        return $definitions;
    }

    /**
     * @param  list<array{name: string, type: string, default: mixed}>  $definitions
     * @return array<string, array{name: string, type: string, default: mixed}>
     */
    private function byName(array $definitions): array
    {
        $byName = [];
        foreach ($definitions as $definition) {
            $byName[$definition['name']] = $definition;
        }

        return $byName;
    }

    /**
     * @param  array<array-key, mixed>  $definitions
     * @return list<array{name: string, type: string, default: mixed}>
     */
    private function normalize(array $definitions): array
    {
        $normalized = [];
        foreach ($definitions as $definition) {
            if (
                ! is_array($definition)
                || ! is_string($definition['name'] ?? null)
                || ! is_string($definition['type'] ?? null)
                || ! in_array($definition['type'], self::TYPES, true)
                || ! array_key_exists('default', $definition)
            ) {
                continue;
            }
            $normalized[] = [
                'name' => $definition['name'],
                'type' => $definition['type'],
                'default' => $definition['default'],
            ];
        }

        return $normalized;
    }

    /** @return array{valid: bool, value: mixed} */
    private function parseDefault(string $type, string $source): array
    {
        if (! in_array($type, self::TYPES, true)) {
            return ['valid' => false, 'value' => null];
        }

        $source = trim($source);
        if ($source === '') {
            return ['valid' => true, 'value' => self::defaultValueForType($type)];
        }
        if (self::isStringBackedType($type)) {
            $decoded = json_decode($source, true);

            return ['valid' => true, 'value' => is_string($decoded) ? $decoded : $source];
        }
        if ($type === 'number' && is_numeric($source)) {
            return ['valid' => true, 'value' => str_contains($source, '.') ? (float) $source : (int) $source];
        }
        if ($type === 'boolean' && in_array($source, ['true', 'false'], true)) {
            return ['valid' => true, 'value' => $source === 'true'];
        }
        if ($type === 'null' && $source === 'null') {
            return ['valid' => true, 'value' => null];
        }
        if (in_array($type, ['array', 'object'], true)) {
            try {
                $shape = json_decode($source, false, flags: JSON_THROW_ON_ERROR);
                $decoded = json_decode($source, true, flags: JSON_THROW_ON_ERROR);

                return [
                    'valid' => ($type === 'array' && is_array($shape)) || ($type === 'object' && is_object($shape)),
                    'value' => $decoded,
                ];
            } catch (\JsonException) {
                return ['valid' => false, 'value' => null];
            }
        }

        return ['valid' => false, 'value' => null];
    }

    private static function isStringBackedType(string $type): bool
    {
        return $type === 'string' || in_array($type, self::REFERENCE_TYPES, true);
    }
}
