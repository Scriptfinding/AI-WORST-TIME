<?php

namespace App\Database;

final readonly class SqlExpression
{
    /**
     * @param  list<mixed>  $bindings
     */
    public function __construct(
        public string $sql,
        public array $bindings = [],
    ) {}
}
