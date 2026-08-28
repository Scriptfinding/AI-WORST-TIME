<?php

namespace App\Database;

use App\Enums\DataTableColumnType;
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

    public function createDataTable(string $table): void
    {
        $table = $this->identifier($table);
        $this->statement(
            "CREATE TABLE {$table} ("
            .'id INTEGER PRIMARY KEY AUTOINCREMENT, '
            .'created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, '
            .'updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP'
            .')',
        );
    }

    public function dropDataTable(string $table): void
    {
        $this->statement('DROP TABLE IF EXISTS '.$this->identifier($table));
    }

    public function addDataTableColumn(string $table, string $column, DataTableColumnType $type): void
    {
        $sqlType = match ($type) {
            DataTableColumnType::STRING => 'TEXT',
            DataTableColumnType::NUMBER => 'REAL',
            DataTableColumnType::BOOLEAN => 'INTEGER',
            DataTableColumnType::DATETIME => 'DATETIME',
        };

        $this->statement(
            'ALTER TABLE '.$this->identifier($table)
            .' ADD COLUMN '.$this->identifier($column)." {$sqlType} NULL",
        );
    }

    public function renameDataTableColumn(string $table, string $from, string $to): void
    {
        $table = $this->identifier($table);
        if ($from !== $to && strtolower($from) === strtolower($to)) {
            $temporary = 'pf_temp_'.substr(hash('sha256', $from.$to), 0, 32);
            $this->statement(
                "ALTER TABLE {$table} RENAME COLUMN ".$this->identifier($from)
                .' TO '.$this->identifier($temporary),
            );
            $from = $temporary;
        }

        $this->statement(
            "ALTER TABLE {$table} RENAME COLUMN ".$this->identifier($from)
            .' TO '.$this->identifier($to),
        );
    }

    public function dropDataTableColumn(string $table, string $column): void
    {
        $this->statement(
            'ALTER TABLE '.$this->identifier($table)
            .' DROP COLUMN '.$this->identifier($column),
        );
    }
}
