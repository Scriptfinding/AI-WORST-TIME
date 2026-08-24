<?php

namespace App\DTO\Library;

final readonly class LibraryMetadata
{
    /**
     * @param  array<string, mixed>  $values
     */
    private function __construct(
        public array $values,
        public ?string $namespace,
        public ?string $title,
        public ?string $description,
        public ?string $category,
        public ?string $color,
        public ?string $icon,
        public ?LibraryAuthor $author,
    ) {}

    /** @param array<string, mixed> $values */
    public static function fromArray(array $values): self
    {
        return new self(
            values: $values,
            namespace: self::optionalString($values, 'namespace'),
            title: self::optionalString($values, 'title'),
            description: self::optionalString($values, 'description'),
            category: self::optionalString($values, 'category'),
            color: self::optionalString($values, 'color'),
            icon: self::optionalString($values, 'icon'),
            author: LibraryAuthor::fromValue($values['author'] ?? null),
        );
    }

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return $this->values;
    }

    /** @param array<string, mixed> $values */
    private static function optionalString(array $values, string $key): ?string
    {
        return is_string($values[$key] ?? null) ? $values[$key] : null;
    }
}
