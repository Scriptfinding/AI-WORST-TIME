<?php

namespace App\DTO\Library;

abstract readonly class LibraryChildItem
{
    public function __construct(
        public string $key,
        public string $namespace,
        public string $reference,
        public string $label,
        public ?string $description,
        public ?string $category,
        public string $sourcePath,
        public string $sourceSha,
        public string $sourceUrl,
        public string $cachePath,
        public string $sourceKind,
        public ?int $privateLibraryId,
        public ?string $code,
    ) {}

    abstract public function type(): string;

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return [
            'key' => $this->key,
            'type' => $this->type(),
            'namespace' => $this->namespace,
            'reference' => $this->reference,
            'label' => $this->label,
            'description' => $this->description,
            'category' => $this->category,
            'source_path' => $this->sourcePath,
            'source_sha' => $this->sourceSha,
            'source_url' => $this->sourceUrl,
            'cache_path' => $this->cachePath,
            'source_kind' => $this->sourceKind,
            'private_library_id' => $this->privateLibraryId,
            'code' => $this->code,
        ];
    }

    /** @param array<string, mixed> $values */
    protected static function string(array $values, string $key, string $default = ''): string
    {
        return is_string($values[$key] ?? null) ? $values[$key] : $default;
    }

    /** @param array<string, mixed> $values */
    protected static function optionalString(array $values, string $key): ?string
    {
        return is_string($values[$key] ?? null) ? $values[$key] : null;
    }

    /** @param array<string, mixed> $values */
    protected static function optionalInt(array $values, string $key): ?int
    {
        return is_int($values[$key] ?? null) ? $values[$key] : null;
    }
}
