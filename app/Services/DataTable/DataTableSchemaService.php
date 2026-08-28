<?php

namespace App\Services\DataTable;

use App\Database\DatabaseDialect;
use App\Enums\DataTableColumnType;
use App\Models\DataTable;
use App\Models\DataTableColumn;
use App\Support\DataTablePhysicalTableName;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class DataTableSchemaService
{
    public function __construct(private readonly DatabaseDialect $dialect) {}

    /**
     * @param  array{
     *     workspace_id: string,
     *     user_id: string,
     *     team_id: string|null,
     *     name: string,
     *     description: string|null,
     *     visibility: string
     * }  $attributes
     */
    public function createDataTable(array $attributes): DataTable
    {
        return DB::transaction(function () use ($attributes): DataTable {
            $this->assertTableNameAvailable($attributes['workspace_id'], $attributes['name']);

            $table = new DataTable($attributes);
            $tableId = DataTable::generateId();
            $table->setAttribute('id', $tableId);
            $table->physical_name = DataTablePhysicalTableName::fromId($tableId);
            $table->save();
            $this->dialect->createDataTable($table->physical_name);

            return $table;
        }, 3);
    }

    /** @param array<string, mixed> $attributes */
    public function updateDataTable(DataTable $table, array $attributes): DataTable
    {
        return DB::transaction(function () use ($table, $attributes): DataTable {
            $locked = DataTable::query()->whereKey($table->id)->lockForUpdate()->firstOrFail();
            if (isset($attributes['name']) && is_string($attributes['name'])) {
                $this->assertTableNameAvailable($locked->workspace_id, $attributes['name'], $locked->id);
            }
            $locked->update($attributes);

            return $locked;
        }, 3);
    }

    public function deleteDataTable(DataTable $table): void
    {
        DB::transaction(function () use ($table): void {
            $locked = DataTable::query()->whereKey($table->id)->lockForUpdate()->firstOrFail();
            $locked->delete();
        }, 3);
    }

    /** @param list<string> $dataTableIds */
    public function deleteDataTables(string $workspaceId, array $dataTableIds): int
    {
        return DB::transaction(function () use ($workspaceId, $dataTableIds): int {
            $tables = DataTable::query()
                ->where('workspace_id', $workspaceId)
                ->whereKey($dataTableIds)
                ->lockForUpdate()
                ->get();

            if ($tables->count() !== count($dataTableIds)) {
                throw ValidationException::withMessages([
                    'ids' => 'One or more selected data tables do not exist.',
                ]);
            }

            foreach ($tables as $table) {
                $table->delete();
            }

            return $tables->count();
        }, 3);
    }

    public function addColumn(
        DataTable $table,
        string $name,
        DataTableColumnType $type,
        ?int $position = null,
    ): DataTableColumn {
        $this->assertUserColumnName($name);

        return DB::transaction(function () use ($table, $name, $type, $position): DataTableColumn {
            $locked = DataTable::query()->whereKey($table->id)->lockForUpdate()->firstOrFail();
            $this->assertColumnNameAvailable($locked, $name);
            $count = $locked->columns()->count();
            $target = min(max($position ?? $count, 0), $count);

            $this->movePositionsOutOfRange($locked);
            $columns = $locked->columns()->get();
            foreach ($columns as $column) {
                $original = $column->position - 1000000;
                $column->update(['position' => $original >= $target ? $original + 1 : $original]);
            }

            $this->dialect->addDataTableColumn($locked->physical_name, $name, $type);

            return $locked->columns()->create([
                'name' => $name,
                'type' => $type,
                'position' => $target,
            ]);
        }, 3);
    }

    public function updateColumn(
        DataTableColumn $column,
        ?string $name = null,
        ?int $position = null,
    ): DataTableColumn {
        if ($name !== null) {
            $this->assertUserColumnName($name);
        }

        return DB::transaction(function () use ($column, $name, $position): DataTableColumn {
            $locked = DataTableColumn::query()->whereKey($column->id)->lockForUpdate()->firstOrFail();
            $table = DataTable::query()->whereKey($locked->data_table_id)->lockForUpdate()->firstOrFail();

            if ($name !== null && $name !== $locked->name) {
                $this->assertColumnNameAvailable($table, $name, $locked->id);
                $this->dialect->renameDataTableColumn($table->physical_name, $locked->name, $name);
                $locked->name = $name;
            }

            if ($position !== null && $position !== $locked->position) {
                $columns = $table->columns()->get();
                $target = min(max($position, 0), max($columns->count() - 1, 0));
                $orderedColumns = $columns
                    ->reject(fn (DataTableColumn $item) => $item->is($locked))
                    ->values();
                $orderedColumns->splice($target, 0, [$locked]);
                $this->movePositionsOutOfRange($table);
                foreach ($orderedColumns as $index => $item) {
                    DataTableColumn::query()->whereKey($item->getKey())->update(['position' => $index]);
                }
                $locked->position = $target;
            }

            $locked->save();

            return $locked->refresh();
        }, 3);
    }

    public function deleteColumn(DataTableColumn $column): void
    {
        DB::transaction(function () use ($column): void {
            $locked = DataTableColumn::query()->whereKey($column->id)->lockForUpdate()->firstOrFail();
            $table = DataTable::query()->whereKey($locked->data_table_id)->lockForUpdate()->firstOrFail();
            $position = $locked->position;

            $this->dialect->dropDataTableColumn($table->physical_name, $locked->name);
            $locked->delete();
            $table->columns()->where('position', '>', $position)->decrement('position');
        }, 3);
    }

    /**
     * @param  list<string>  $columnIds
     * @return list<DataTableColumn>
     */
    public function reorderColumns(DataTable $table, array $columnIds): array
    {
        return DB::transaction(function () use ($table, $columnIds): array {
            $locked = DataTable::query()->whereKey($table->id)->lockForUpdate()->firstOrFail();
            $columns = $locked->columns()->get()->keyBy(fn (DataTableColumn $column) => $column->id);

            if (
                count($columnIds) !== $columns->count()
                || count(array_unique($columnIds)) !== count($columnIds)
                || array_diff($columnIds, $columns->keys()->all()) !== []
            ) {
                throw ValidationException::withMessages([
                    'ids' => 'The column order must contain every table column exactly once.',
                ]);
            }

            $this->movePositionsOutOfRange($locked);
            foreach ($columnIds as $position => $columnId) {
                DataTableColumn::query()->whereKey($columnId)->update(['position' => $position]);
            }

            return array_values($locked->columns()->get()->all());
        }, 3);
    }

    public function assertUserColumnName(string $name): void
    {
        try {
            DataTablePhysicalTableName::assertValidIdentifier($name);
        } catch (\InvalidArgumentException) {
            throw ValidationException::withMessages([
                'name' => 'Column names must start with a letter and contain only letters, numbers, and underscores.',
            ]);
        }

        if (in_array(strtolower($name), ['id', 'created_at', 'updated_at'], true)) {
            throw ValidationException::withMessages([
                'name' => 'This column name is reserved.',
            ]);
        }
    }

    private function assertTableNameAvailable(string $workspaceId, string $name, ?string $exceptId = null): void
    {
        if (trim($name) === '' || mb_strlen($name) > 128) {
            throw ValidationException::withMessages([
                'name' => 'Table names must contain between 1 and 128 characters.',
            ]);
        }

        $query = DataTable::query()
            ->where('workspace_id', $workspaceId)
            ->where('name', $name);
        if ($exceptId !== null) {
            $query->where('id', '!=', $exceptId);
        }
        if ($query->exists()) {
            throw ValidationException::withMessages([
                'name' => 'A data table with this name already exists in the workspace.',
            ]);
        }
    }

    private function movePositionsOutOfRange(DataTable $table): void
    {
        $table->columns()->increment('position', 1000000);
    }

    private function assertColumnNameAvailable(
        DataTable $table,
        string $name,
        ?string $exceptId = null,
    ): void {
        $query = $table->columns()->whereRaw('LOWER(name) = ?', [strtolower($name)]);
        if ($exceptId !== null) {
            $query->where('data_table_columns.id', '!=', $exceptId);
        }

        if ($query->exists()) {
            throw ValidationException::withMessages([
                'name' => 'A column with this name already exists.',
            ]);
        }
    }
}
