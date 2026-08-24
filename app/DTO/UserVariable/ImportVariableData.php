<?php

namespace App\DTO\UserVariable;

final readonly class ImportVariableData
{
    public function __construct(
        public string $key,
        public ?string $value,
        public string $type,
    ) {}
}
