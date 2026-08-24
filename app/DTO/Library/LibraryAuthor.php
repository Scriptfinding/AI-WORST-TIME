<?php

namespace App\DTO\Library;

final readonly class LibraryAuthor
{
    public function __construct(
        public ?string $name,
        public ?string $homepage,
    ) {}

    public static function fromValue(mixed $value): ?self
    {
        if (is_string($value)) {
            return new self($value, null);
        }

        if (! is_array($value)) {
            return null;
        }

        return new self(
            name: is_string($value['name'] ?? null) ? $value['name'] : null,
            homepage: is_string($value['homepage'] ?? null) ? $value['homepage'] : null,
        );
    }

    /** @return array{name: string|null, homepage: string|null} */
    public function toArray(): array
    {
        return [
            'name' => $this->name,
            'homepage' => $this->homepage,
        ];
    }
}
