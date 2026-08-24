<?php

namespace App\Database;

use Illuminate\Database\Eloquent\Builder;

interface DatabaseDialect
{
    /**
     * @param  list<string>  $keys
     */
    public function acquireIdentityMutex(array $keys): void;

    /**
     * @param  Builder<\App\Models\MailboxRunMessage>  $query
     */
    public function lockMailboxClaim(Builder $query): void;

    public function jsonObjectIsNotEmpty(string $column): SqlExpression;

    public function jsonScalar(string $column, string $key): SqlExpression;
}
