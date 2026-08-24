<?php

namespace App\DTO\Library;

use App\Services\Library\BlueprintInputSchemaService;

final readonly class LibraryFlowItem extends LibraryChildItem
{
    /**
     * @param  array{nodes: list<array<string, mixed>>, edges: list<array<string, mixed>>}|null  $nodalGraph
     * @param  array<string, mixed>  $defaultInputs
     * @param  list<array{name: string, type: string, default: mixed}>  $inputDefinitions
     */
    public function __construct(
        string $key,
        string $namespace,
        string $reference,
        string $label,
        ?string $description,
        ?string $category,
        string $sourcePath,
        string $sourceSha,
        string $sourceUrl,
        string $cachePath,
        string $sourceKind,
        ?int $privateLibraryId,
        ?string $code,
        public string $flowType,
        public ?array $nodalGraph,
        public array $defaultInputs = [],
        public array $inputDefinitions = [],
    ) {
        parent::__construct(
            $key,
            $namespace,
            $reference,
            $label,
            $description,
            $category,
            $sourcePath,
            $sourceSha,
            $sourceUrl,
            $cachePath,
            $sourceKind,
            $privateLibraryId,
            $code,
        );
    }

    /** @param array<string, mixed> $values */
    public static function fromArray(array $values): self
    {
        $nodalGraph = self::nodalGraph($values['nodal_graph'] ?? null);

        return new self(
            key: self::string($values, 'key'),
            namespace: self::string($values, 'namespace'),
            reference: self::string($values, 'reference'),
            label: self::string($values, 'label', self::string($values, 'reference')),
            description: self::optionalString($values, 'description'),
            category: self::optionalString($values, 'category'),
            sourcePath: self::string($values, 'source_path'),
            sourceSha: self::string($values, 'source_sha'),
            sourceUrl: self::string($values, 'source_url'),
            cachePath: self::string($values, 'cache_path'),
            sourceKind: self::string($values, 'source_kind', 'public'),
            privateLibraryId: self::optionalInt($values, 'private_library_id'),
            code: self::optionalString($values, 'code'),
            flowType: self::string($values, 'flow_type', 'code'),
            nodalGraph: $nodalGraph,
            defaultInputs: is_array($values['default_inputs'] ?? null) ? $values['default_inputs'] : [],
            inputDefinitions: self::inputDefinitions($values['input_definitions'] ?? null),
        );
    }

    public function type(): string
    {
        return 'flow';
    }

    /**
     * @param  array{nodes: list<array<string, mixed>>, edges: list<array<string, mixed>>}|null  $nodalGraph
     * @param  array<string, mixed>|null  $defaultInputs
     * @param  list<array{name: string, type: string, default: mixed}>|null  $inputDefinitions
     */
    public function withCode(
        string $code,
        ?array $nodalGraph = null,
        ?array $defaultInputs = null,
        ?array $inputDefinitions = null,
    ): self {
        return new self(
            $this->key,
            $this->namespace,
            $this->reference,
            $this->label,
            $this->description,
            $this->category,
            $this->sourcePath,
            $this->sourceSha,
            $this->sourceUrl,
            $this->cachePath,
            $this->sourceKind,
            $this->privateLibraryId,
            $code,
            $this->flowType,
            $nodalGraph,
            $defaultInputs ?? $this->defaultInputs,
            $inputDefinitions ?? $this->inputDefinitions,
        );
    }

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return [
            ...parent::toArray(),
            'flow_type' => $this->flowType,
            'nodal_graph' => $this->nodalGraph,
            'default_inputs' => $this->defaultInputs,
            'input_definitions' => $this->inputDefinitions,
        ];
    }

    /** @return array{nodes: list<array<string, mixed>>, edges: list<array<string, mixed>>}|null */
    private static function nodalGraph(mixed $value): ?array
    {
        if (! is_array($value) || ! is_array($value['nodes'] ?? null) || ! is_array($value['edges'] ?? null)) {
            return null;
        }

        /** @var list<array<string, mixed>> $nodes */
        $nodes = array_values($value['nodes']);
        /** @var list<array<string, mixed>> $edges */
        $edges = array_values($value['edges']);

        return ['nodes' => $nodes, 'edges' => $edges];
    }

    /** @return list<array{name: string, type: string, default: mixed}> */
    private static function inputDefinitions(mixed $value): array
    {
        if (! is_array($value)) {
            return [];
        }

        $definitions = [];
        foreach ($value as $definition) {
            if (
                ! is_array($definition)
                || ! is_string($definition['name'] ?? null)
                || ! preg_match('/^[a-zA-Z_$][a-zA-Z0-9_$]*$/', $definition['name'])
                || ! is_string($definition['type'] ?? null)
                || ! in_array($definition['type'], BlueprintInputSchemaService::TYPES, true)
                || ! array_key_exists('default', $definition)
            ) {
                continue;
            }
            $definitions[] = [
                'name' => $definition['name'],
                'type' => $definition['type'],
                'default' => $definition['default'],
            ];
        }

        return $definitions;
    }
}
