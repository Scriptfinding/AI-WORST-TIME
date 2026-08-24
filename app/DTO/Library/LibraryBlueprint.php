<?php

namespace App\DTO\Library;

final readonly class LibraryBlueprint
{
    /**
     * @param  list<LibraryFlowItem>  $flows
     * @param  list<LibrarySnippetItem>  $snippets
     */
    public function __construct(
        public string $key,
        public string $namespace,
        public string $reference,
        public string $title,
        public string $label,
        public ?string $description,
        public ?string $category,
        public string $color,
        public ?string $iconUrl,
        public string $sourcePath,
        public ?string $sourceSha,
        public string $sourceUrl,
        public string $sourceKind,
        public ?int $privateLibraryId,
        public ?string $privateLibraryLabel,
        public LibraryMetadata $metadata,
        public array $flows,
        public array $snippets,
        public LibraryStats $stats,
    ) {}

    /** @param array<string, mixed> $values */
    public static function fromArray(array $values): self
    {
        $metadataValues = is_array($values['metadata'] ?? null) ? $values['metadata'] : [];
        /** @var array<string, mixed> $metadataValues */
        if (! array_key_exists('author', $metadataValues) && is_string($values['author_name'] ?? null)) {
            $metadataValues['author'] = [
                'name' => $values['author_name'],
                'homepage' => is_string($values['author_url'] ?? null) ? $values['author_url'] : null,
            ];
        }
        $metadata = LibraryMetadata::fromArray($metadataValues);
        $flows = [];
        if (is_array($values['flows'] ?? null)) {
            foreach ($values['flows'] as $flow) {
                if (is_array($flow)) {
                    /** @var array<string, mixed> $flow */
                    $flows[] = LibraryFlowItem::fromArray($flow);
                }
            }
        }
        $snippets = [];
        if (is_array($values['snippets'] ?? null)) {
            foreach ($values['snippets'] as $snippet) {
                if (is_array($snippet)) {
                    /** @var array<string, mixed> $snippet */
                    $snippets[] = LibrarySnippetItem::fromArray($snippet);
                }
            }
        }

        $namespace = self::string($values, 'namespace');
        $title = self::string($values, 'title', self::string($values, 'label', $namespace));

        return new self(
            key: self::string($values, 'key', "blueprint:{$namespace}"),
            namespace: $namespace,
            reference: self::string($values, 'reference', $namespace),
            title: $title,
            label: self::string($values, 'label', $title),
            description: self::optionalString($values, 'description'),
            category: self::optionalString($values, 'category'),
            color: self::string($values, 'color', 'green'),
            iconUrl: self::optionalString($values, 'icon_url'),
            sourcePath: self::string($values, 'source_path'),
            sourceSha: self::optionalString($values, 'source_sha'),
            sourceUrl: self::string($values, 'source_url'),
            sourceKind: self::string($values, 'source_kind', 'public'),
            privateLibraryId: self::optionalInt($values, 'private_library_id'),
            privateLibraryLabel: self::optionalString($values, 'private_library_label'),
            metadata: $metadata,
            flows: $flows,
            snippets: $snippets,
            stats: LibraryStats::fromValue($values['stats'] ?? null),
        );
    }

    public function withStats(LibraryStats $stats): self
    {
        return new self(
            $this->key,
            $this->namespace,
            $this->reference,
            $this->title,
            $this->label,
            $this->description,
            $this->category,
            $this->color,
            $this->iconUrl,
            $this->sourcePath,
            $this->sourceSha,
            $this->sourceUrl,
            $this->sourceKind,
            $this->privateLibraryId,
            $this->privateLibraryLabel,
            $this->metadata,
            $this->flows,
            $this->snippets,
            $stats,
        );
    }

    /**
     * @param  list<LibraryFlowItem>  $flows
     * @param  list<LibrarySnippetItem>  $snippets
     */
    public function withChildren(array $flows, array $snippets, ?string $sourceSha = null): self
    {
        return new self(
            $this->key,
            $this->namespace,
            $this->reference,
            $this->title,
            $this->label,
            $this->description,
            $this->category,
            $this->color,
            $this->iconUrl,
            $this->sourcePath,
            $sourceSha ?? $this->sourceSha,
            $this->sourceUrl,
            $this->sourceKind,
            $this->privateLibraryId,
            $this->privateLibraryLabel,
            $this->metadata,
            $flows,
            $snippets,
            $this->stats,
        );
    }

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return [
            'key' => $this->key,
            'type' => 'blueprint',
            'namespace' => $this->namespace,
            'reference' => $this->reference,
            'title' => $this->title,
            'label' => $this->label,
            'description' => $this->description,
            'category' => $this->category,
            'color' => $this->color,
            'author_name' => $this->metadata->author?->name,
            'author_url' => $this->metadata->author?->homepage,
            'icon_url' => $this->iconUrl,
            'source_path' => $this->sourcePath,
            'source_sha' => $this->sourceSha,
            'source_url' => $this->sourceUrl,
            'source_kind' => $this->sourceKind,
            'private_library_id' => $this->privateLibraryId,
            'private_library_label' => $this->privateLibraryLabel,
            'metadata' => $this->metadata->toArray(),
            'flows' => array_map(static fn (LibraryFlowItem $flow): array => $flow->toArray(), $this->flows),
            'snippets' => array_map(static fn (LibrarySnippetItem $snippet): array => $snippet->toArray(), $this->snippets),
            'stats' => $this->stats->toArray(),
        ];
    }

    /** @param array<string, mixed> $values */
    private static function string(array $values, string $key, string $default = ''): string
    {
        return is_string($values[$key] ?? null) ? $values[$key] : $default;
    }

    /** @param array<string, mixed> $values */
    private static function optionalString(array $values, string $key): ?string
    {
        return is_string($values[$key] ?? null) ? $values[$key] : null;
    }

    /** @param array<string, mixed> $values */
    private static function optionalInt(array $values, string $key): ?int
    {
        return is_int($values[$key] ?? null) ? $values[$key] : null;
    }
}
