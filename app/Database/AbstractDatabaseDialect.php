<?php

namespace App\Database;

use App\Support\DataTablePhysicalTableName;
use Illuminate\Database\Connection;

abstract class AbstractDatabaseDialect implements DatabaseDialect
{
    public function __construct(protected readonly Connection $connection) {}

    protected function wrap(string $column): string
    {
        return $this->connection->getQueryGrammar()->wrap($column);
    }

    protected function identifier(string $identifier): string
    {
        DataTablePhysicalTableName::assertValidIdentifier($identifier);

        return $this->connection->getQueryGrammar()->wrap($identifier);
    }

    protected function statement(string $sql): void
    {
        $this->connection->statement($sql);
    }
}
