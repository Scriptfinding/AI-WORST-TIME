<?php

namespace App\Database;

use App\Enums\DataTableColumnType;
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

    public function createDataTable(string $table): void;

    public function dropDataTable(string $table): void;

    public function addDataTableColumn(string $table, string $column, DataTableColumnType $type): void;

    public function renameDataTableColumn(string $table, string $from, string $to): void;

    public function dropDataTableColumn(string $table, string $column): void;
}
