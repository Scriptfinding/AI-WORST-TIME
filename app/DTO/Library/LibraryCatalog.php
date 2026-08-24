<?php

namespace App\DTO\Library;

final readonly class LibraryCatalog
{
    /**
     * @param  list<LibraryBlueprint>  $items
     * @param  list<string>  $categories
     * @param  array<string, int>  $categoryCounts
     */
    public function __construct(
        public array $items,
        public array $categories,
        public array $categoryCounts,
        public int $totalCount,
        public ?string $cachedAt,
    ) {}

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return [
            'items' => array_map(static fn (LibraryBlueprint $item): array => $item->toArray(), $this->items),
            'categories' => $this->categories,
            'category_counts' => $this->categoryCounts,
            'total_count' => $this->totalCount,
            'cached_at' => $this->cachedAt,
        ];
    }
}
