<?php

namespace App\DTO\Library;

final readonly class LibrarySnippetItem extends LibraryChildItem
{
    /**
     * @param  array{nodes: list<array<string, mixed>>, edges: list<array<string, mixed>>}|null  $nodalGraph
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
        public string $args,
        public string $snippetType,
        public ?array $nodalGraph,
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
            args: self::string($values, 'args'),
            snippetType: self::string($values, 'snippet_type', 'code'),
            nodalGraph: self::nodalGraph($values['nodal_graph'] ?? null),
        );
    }

    public function type(): string
    {
        return 'snippet';
    }

    /**
     * @param  array{nodes: list<array<string, mixed>>, edges: list<array<string, mixed>>}|null  $nodalGraph
     */
    public function withCode(string $code, ?array $nodalGraph = null): self
    {
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
            $this->args,
            $this->snippetType,
            $nodalGraph,
        );
    }

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return [
            ...parent::toArray(),
            'args' => $this->args,
            'snippet_type' => $this->snippetType,
            'nodal_graph' => $this->nodalGraph,
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
}
