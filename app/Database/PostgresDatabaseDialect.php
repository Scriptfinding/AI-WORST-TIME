<?php

namespace App\Database;

use Illuminate\Database\Eloquent\Builder;

final class PostgresDatabaseDialect extends AbstractDatabaseDialect
{
    public function acquireIdentityMutex(array $keys): void
    {
        foreach ($keys as $key) {
            $this->connection->select(
                'SELECT pg_advisory_xact_lock(hashtext(?), hashtext(?))',
                ['puppetflow:identity', $key],
            );
        }
    }

    public function lockMailboxClaim(Builder $query): void
    {
        $query->lock('FOR UPDATE SKIP LOCKED');
    }

    public function jsonObjectIsNotEmpty(string $column): SqlExpression
    {
        $column = $this->wrap($column);

        return new SqlExpression(
            "jsonb_typeof(COALESCE({$column}::jsonb, '{}'::jsonb)) = 'object'"
            ." AND COALESCE({$column}::jsonb, '{}'::jsonb) <> '{}'::jsonb",
        );
    }

    public function jsonScalar(string $column, string $key): SqlExpression
    {
        return new SqlExpression(
            $this->wrap($column).'::jsonb ->> ?',
            [$key],
        );
    }
}
