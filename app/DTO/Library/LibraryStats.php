<?php

namespace App\DTO\Library;

final readonly class LibraryStats
{
    public function __construct(
        public ?int $id,
        public int $downloadsCount,
        public int $upvotesCount,
    ) {}

    public static function empty(): self
    {
        return new self(null, 0, 0);
    }

    public static function fromValue(mixed $value): self
    {
        if (! is_array($value)) {
            return self::empty();
        }

        return new self(
            id: is_int($value['id'] ?? null) ? $value['id'] : null,
            downloadsCount: is_int($value['downloads_count'] ?? null) ? $value['downloads_count'] : 0,
            upvotesCount: is_int($value['upvotes_count'] ?? null) ? $value['upvotes_count'] : 0,
        );
    }

    /** @return array{id: int|null, downloads_count: int, upvotes_count: int} */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'downloads_count' => $this->downloadsCount,
            'upvotes_count' => $this->upvotesCount,
        ];
    }
}
