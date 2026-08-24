<?php

namespace App\Database;

use Illuminate\Database\Connection;

abstract class AbstractDatabaseDialect implements DatabaseDialect
{
    public function __construct(protected readonly Connection $connection) {}

    protected function wrap(string $column): string
    {
        return $this->connection->getQueryGrammar()->wrap($column);
    }
}
