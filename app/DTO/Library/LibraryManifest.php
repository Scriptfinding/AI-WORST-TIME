<?php

namespace App\DTO\Library;

final readonly class LibraryManifest
{
    /** @param list<LibraryBlueprint> $items */
    public function __construct(
        public ?int $version,
        public ?string $externalVersion,
        public ?string $cachedAt,
        public ?string $repo,
        public ?string $branch,
        public ?string $sourceKind,
        public ?int $privateLibraryId,
        public array $items,
    ) {}

    public static function empty(): self
    {
        return new self(null, null, null, null, null, null, null, []);
    }

    /** @param array<string, mixed> $values */
    public static function fromArray(array $values): self
    {
        $items = [];
        if (is_array($values['items'] ?? null)) {
            foreach ($values['items'] as $item) {
                if (is_array($item)) {
                    /** @var array<string, mixed> $item */
                    $items[] = LibraryBlueprint::fromArray($item);
                }
            }
        }

        return new self(
            version: is_int($values['version'] ?? null) ? $values['version'] : null,
            externalVersion: self::optionalString($values, 'external_version'),
            cachedAt: self::optionalString($values, 'cached_at'),
            repo: self::optionalString($values, 'repo'),
            branch: self::optionalString($values, 'branch'),
            sourceKind: self::optionalString($values, 'source_kind'),
            privateLibraryId: is_int($values['private_library_id'] ?? null) ? $values['private_library_id'] : null,
            items: $items,
        );
    }

    /** @param list<LibraryBlueprint> $items */
    public function withItems(array $items): self
    {
        return new self(
            $this->version,
            $this->externalVersion,
            $this->cachedAt,
            $this->repo,
            $this->branch,
            $this->sourceKind,
            $this->privateLibraryId,
            $items,
        );
    }

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return [
            'version' => $this->version,
            'external_version' => $this->externalVersion,
            'cached_at' => $this->cachedAt,
            'repo' => $this->repo,
            'branch' => $this->branch,
            'source_kind' => $this->sourceKind,
            'private_library_id' => $this->privateLibraryId,
            'items' => array_map(static fn (LibraryBlueprint $item): array => $item->toArray(), $this->items),
        ];
    }

    /** @param array<string, mixed> $values */
    private static function optionalString(array $values, string $key): ?string
    {
        return is_string($values[$key] ?? null) ? $values[$key] : null;
    }
}
