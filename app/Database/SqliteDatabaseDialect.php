<?php

namespace App\Database;

use Illuminate\Database\Eloquent\Builder;

final class SqliteDatabaseDialect extends AbstractDatabaseDialect
{
    public function acquireIdentityMutex(array $keys): void
    {
        // SQLite transactions use BEGIN IMMEDIATE. The transaction already
        // owns the database-wide writer reservation needed by this mutex.
    }

    public function lockMailboxClaim(Builder $query): void
    {
        // SQLite has no row-level SKIP LOCKED equivalent. BEGIN IMMEDIATE
        // serializes the complete claim transaction in mono-instance mode.
    }

    public function jsonObjectIsNotEmpty(string $column): SqlExpression
    {
        $column = $this->wrap($column);

        return new SqlExpression(
            "CASE WHEN json_valid({$column})"
            ." THEN json_type({$column}) = 'object' AND json({$column}) <> json('{}')"
            .' ELSE 0 END',
        );
    }

    public function jsonScalar(string $column, string $key): SqlExpression
    {
        $column = $this->wrap($column);

        return new SqlExpression(
            "CASE WHEN json_valid({$column}) THEN CAST({$column} ->> ? AS TEXT) END",
            [$key],
        );
    }
}
