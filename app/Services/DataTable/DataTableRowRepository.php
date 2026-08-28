<?php

namespace App\Services\DataTable;

use App\Enums\DataTableColumnType;
use App\Models\DataTable;
use App\Models\DataTableColumn;
use Illuminate\Database\Query\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\LazyCollection;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class DataTableRowRepository
{
    public function __construct(private readonly DataTableRowValidator $validator) {}

    /**
     * @param  list<array{column_id: string, operator: string, value?: string|null}>  $filters
     * @return LengthAwarePaginator<int|string, array<string, mixed>>
     */
    public function paginate(DataTable $table, int $perPage, array $filters = []): LengthAwarePaginator
    {
        $query = DB::table($table->physical_name);
        $this->applyFilters($query, $table, $filters);
        $paginator = $query
            ->orderByDesc('created_at')
            ->orderBy('id')
            ->paginate($perPage);

        $paginator->through(function (mixed $row) use ($table): array {
            /** @var array<string, mixed> $values */
            $values = (array) $row;

            return $this->serialize($table, $values);
        });

        return $paginator;
    }

    /**
     * Counts the rows of every table in a single UNION ALL query, instead of
     * one COUNT(*) per physical table.
     *
     * @param  Collection<int, DataTable>  $tables
     * @return array<string, int> keyed by data table ID
     */
    public function countRowsByTable(Collection $tables): array
    {
        if ($tables->isEmpty()) {
            return [];
        }

        $queries = $tables->map(
            // cast() keeps Postgres from rejecting an untyped select parameter.
            fn (DataTable $table): Builder => DB::table($table->physical_name)
                ->selectRaw('cast(? as text) as data_table_id, count(*) as total', [$table->id]),
        );
        /** @var Builder $query */
        $query = $queries->first();
        foreach ($queries->slice(1) as $union) {
            $query->unionAll($union);
        }

        return $query->get()
            ->mapWithKeys(fn (object $row): array => [
                (string) $row->data_table_id => (int) $row->total,
            ])
            ->all();
    }

    /**
     * @param  list<array{column_id: string, operator: string, value?: string|null}>  $filters
     * @param  list<int>|null  $rowIds
     * @return LazyCollection<int, array<string, mixed>>
     */
    public function exportRows(
        DataTable $table,
        array $filters = [],
        ?array $rowIds = null,
    ): LazyCollection {
        $query = DB::table($table->physical_name);
        $this->applyFilters($query, $table, $filters);
        if ($rowIds !== null) {
            $query->whereIn('id', $rowIds);
        }

        return $query
            ->orderByDesc('created_at')
            ->orderBy('id')
            ->cursor()
            ->map(fn (object $row): array => $this->serialize($table, (array) $row));
    }

    /**
     * @param  list<array{keyName: string, condition: string, keyValue?: mixed}>  $filters
     * @return list<array<string, mixed>>
     */
    public function runtimeRows(
        DataTable $table,
        array $filters,
        string $matchType,
        ?int $limit,
        ?string $orderBy,
        string $direction,
    ): array {
        $query = $this->runtimeQuery($table, $filters, $matchType);
        if ($orderBy !== null && $orderBy !== '') {
            $column = $this->runtimeColumn($table, $orderBy);
            $query->orderBy($column['name'], strtolower($direction) === 'asc' ? 'asc' : 'desc');
            if ($column['name'] !== 'id') {
                $query->orderBy('id');
            }
        } else {
            $query->orderByDesc('updated_at')->orderBy('id');
        }
        if ($limit !== null) {
            $query->limit(max(1, $limit));
        }

        return array_values($query->get()
            ->map(fn (mixed $row): array => $this->serializeNamed($table, (array) $row))
            ->values()
            ->all());
    }

    /** @param list<array{keyName: string, condition: string, keyValue?: mixed}> $filters */
    public function runtimeExists(DataTable $table, array $filters, string $matchType): bool
    {
        $this->assertRuntimeFiltersPresent($filters);

        return $this->runtimeQuery($table, $filters, $matchType)->exists();
    }

    /**
     * @param  list<array{keyName: string, condition: string, keyValue?: mixed}>  $filters
     * @param  array<string, mixed>  $values
     * @return list<array<string, mixed>>
     */
    public function runtimeUpdate(
        DataTable $table,
        array $filters,
        string $matchType,
        array $values,
        bool $dryRun = false,
        bool $allowAll = false,
    ): array {
        if (! $allowAll) {
            $this->assertRuntimeFiltersPresent($filters);
        }

        return DB::transaction(function () use ($table, $filters, $matchType, $values, $dryRun): array {
            $rows = $this->runtimeQuery($table, $filters, $matchType)->lockForUpdate()->get();
            if ($rows->isEmpty()) {
                return [];
            }
            $updates = $this->validator->validate($table, $values, partial: true);
            if ($updates === []) {
                throw ValidationException::withMessages(['values' => 'At least one value is required.']);
            }
            $updatedAt = now();
            $updates['updated_at'] = $updatedAt;
            if ($dryRun) {
                return array_values($rows->flatMap(function (mixed $row) use ($table, $updates): array {
                    $before = (array) $row;
                    $after = array_merge($before, $updates);

                    return [
                        [...$this->serializeNamed($table, $before), 'dry_run_state' => 'before'],
                        [...$this->serializeNamed($table, $after), 'dry_run_state' => 'after'],
                    ];
                })->values()->all());
            }

            $ids = $this->runtimeRowIds($rows);
            $updated = [];
            foreach (array_chunk($ids, 500) as $chunk) {
                DB::table($table->physical_name)->whereIn('id', $chunk)->update($updates);
                foreach (DB::table($table->physical_name)->whereIn('id', $chunk)->orderBy('id')->get() as $row) {
                    $updated[] = $this->serializeNamed($table, (array) $row);
                }
            }

            return $updated;
        }, 3);
    }

    /**
     * @param  list<array{keyName: string, condition: string, keyValue?: mixed}>  $filters
     * @param  array<string, mixed>  $values
     * @return list<array<string, mixed>>
     */
    public function runtimeUpsert(
        DataTable $table,
        array $filters,
        string $matchType,
        array $values,
        bool $dryRun = false,
    ): array {
        $this->assertRuntimeFiltersPresent($filters);

        return DB::transaction(function () use ($table, $filters, $matchType, $values, $dryRun): array {
            DataTable::query()->whereKey($table->id)->lockForUpdate()->firstOrFail();
            if ($this->runtimeQuery($table, $filters, $matchType)->exists()) {
                return $this->runtimeUpdate($table, $filters, $matchType, $values, $dryRun);
            }
            $normalized = $this->validator->validate($table, $values);
            if ($dryRun) {
                $empty = ['id' => null, ...array_fill_keys(
                    $table->columns()->pluck('name')->all(),
                    null,
                ), 'created_at' => null, 'updated_at' => null];
                $now = now()->toIso8601String();
                $after = ['id' => 0, ...$normalized, 'created_at' => $now, 'updated_at' => $now];

                return [
                    [...$empty, 'dry_run_state' => 'before'],
                    [...$after, 'dry_run_state' => 'after'],
                ];
            }

            return [$this->serializeNamed($table, $this->insertNormalized($table, $normalized))];
        }, 3);
    }

    /**
     * @param  list<array{keyName: string, condition: string, keyValue?: mixed}>  $filters
     * @return list<array<string, mixed>>
     */
    public function runtimeDelete(
        DataTable $table,
        array $filters,
        string $matchType,
        bool $dryRun = false,
    ): array {
        $this->assertRuntimeFiltersPresent($filters);

        return DB::transaction(function () use ($table, $filters, $matchType, $dryRun): array {
            $rows = $this->runtimeQuery($table, $filters, $matchType)->lockForUpdate()->get();
            $before = $rows
                ->map(fn (mixed $row): array => $this->serializeNamed($table, (array) $row))
                ->values();
            if ($dryRun) {
                return array_values($before->flatMap(function (array $row): array {
                    return [
                        [...$row, 'dry_run_state' => 'before'],
                        [...array_fill_keys(array_keys($row), null), 'dry_run_state' => 'after'],
                    ];
                })->values()->all());
            }
            if ($rows->isNotEmpty()) {
                $ids = $this->runtimeRowIds($rows);
                foreach (array_chunk($ids, 500) as $chunk) {
                    DB::table($table->physical_name)->whereIn('id', $chunk)->delete();
                }
            }

            return array_values($before->all());
        }, 3);
    }

    /** @param list<array{column_id: string, operator: string, value?: string|null}> $filters */
    private function applyFilters(Builder $query, DataTable $table, array $filters): void
    {
        if ($filters === []) {
            return;
        }

        $columns = $table->columns()->get()->keyBy(fn (DataTableColumn $column): string => (string) $column->id);
        foreach ($filters as $filter) {
            /** @var DataTableColumn|null $column */
            $column = $columns->get((string) $filter['column_id']);
            if ($column === null) {
                $this->invalidFilter('The selected data table column does not exist.');
            }

            $operator = $filter['operator'];
            $allowed = $this->filterOperators($column->type);
            if (! in_array($operator, $allowed, true)) {
                $this->invalidFilter("The {$operator} operator is not valid for {$column->type->value} columns.");
            }

            $this->applyFilter(
                $query,
                $column,
                $operator,
                $filter['value'] ?? null,
            );
        }
    }

    /**
     * UI operator vocabulary. Mirrors FILTER_OPERATORS in
     * resources/js/Domains/DataTable/Pages/DataTableColumnFilter.tsx; keep both in sync.
     *
     * @return list<string>
     */
    private function filterOperators(DataTableColumnType $type): array
    {
        $base = ['exists', 'doesNotExist', 'isEmpty', 'isNotEmpty'];

        return match ($type) {
            DataTableColumnType::STRING => [
                ...$base,
                'equals',
                'notEquals',
                'contains',
                'notContains',
                'startsWith',
                'notStartsWith',
                'endsWith',
                'notEndsWith',
            ],
            DataTableColumnType::NUMBER => [
                ...$base,
                'equals',
                'notEquals',
                'greaterThan',
                'lessThan',
                'greaterThanOrEqual',
                'lessThanOrEqual',
            ],
            DataTableColumnType::DATETIME => [
                ...$base,
                'equals',
                'notEquals',
                'after',
                'before',
                'afterOrEqual',
                'beforeOrEqual',
            ],
            DataTableColumnType::BOOLEAN => [
                ...$base,
                'isTrue',
                'isFalse',
                'equals',
                'notEquals',
            ],
        };
    }

    private function applyFilter(
        Builder $query,
        DataTableColumn $column,
        string $operator,
        ?string $value,
    ): void {
        $name = $column->name;
        if ($operator === 'exists') {
            $query->whereNotNull($name);

            return;
        }
        if ($operator === 'doesNotExist') {
            $query->whereNull($name);

            return;
        }
        if ($operator === 'isEmpty' || $operator === 'isNotEmpty') {
            $this->applyEmptinessCondition($query, $name, $column->type, $operator === 'isEmpty');

            return;
        }
        if ($operator === 'isTrue' || $operator === 'isFalse') {
            $query->where($name, $operator === 'isTrue');

            return;
        }
        if ($value === null || $value === '') {
            $this->invalidFilter('This filter operator requires a comparison value.');
        }

        $normalized = match ($column->type) {
            DataTableColumnType::STRING => $value,
            DataTableColumnType::NUMBER => is_numeric($value)
                ? (float) $value
                : $this->invalidFilter('The filter value must be a number.'),
            DataTableColumnType::DATETIME => $this->dateFilterValue($value),
            DataTableColumnType::BOOLEAN => match ($value) {
                'true' => true,
                'false' => false,
                default => $this->invalidFilter('The filter value must be true or false.'),
            },
        };

        match ($operator) {
            'equals' => $query->where($name, '=', $normalized),
            'notEquals' => $query->where($name, '!=', $normalized),
            'contains' => $query->where($name, 'like', "%{$normalized}%"),
            'notContains' => $query->where($name, 'not like', "%{$normalized}%"),
            'startsWith' => $query->where($name, 'like', "{$normalized}%"),
            'notStartsWith' => $query->where($name, 'not like', "{$normalized}%"),
            'endsWith' => $query->where($name, 'like', "%{$normalized}"),
            'notEndsWith' => $query->where($name, 'not like', "%{$normalized}"),
            'greaterThan', 'after' => $query->where($name, '>', $normalized),
            'lessThan', 'before' => $query->where($name, '<', $normalized),
            'greaterThanOrEqual', 'afterOrEqual' => $query->where($name, '>=', $normalized),
            'lessThanOrEqual', 'beforeOrEqual' => $query->where($name, '<=', $normalized),
            default => $this->invalidFilter('The data table filter operator is invalid.'),
        };
    }

    private function applyEmptinessCondition(
        Builder $query,
        string $name,
        DataTableColumnType $type,
        bool $isEmpty,
    ): void {
        if ($isEmpty) {
            $query->where(function (Builder $nested) use ($name, $type): void {
                $nested->whereNull($name);
                if ($type === DataTableColumnType::STRING) {
                    $nested->orWhere($name, '');
                }
            });

            return;
        }

        $query->whereNotNull($name);
        if ($type === DataTableColumnType::STRING) {
            $query->where($name, '!=', '');
        }
    }

    private function dateFilterValue(string $value, bool $databaseFormat = false): string
    {
        try {
            $date = Carbon::parse($value)->utc();

            return $databaseFormat ? $date->toDateTimeString() : $date->toIso8601String();
        } catch (\Throwable) {
            $this->invalidFilter('The filter value must be a valid date and time.');
        }
    }

    private function invalidFilter(string $message): never
    {
        throw ValidationException::withMessages(['filters' => $message]);
    }

    /**
     * @param  list<array{keyName: string, condition: string, keyValue?: mixed}>  $filters
     */
    private function runtimeQuery(DataTable $table, array $filters, string $matchType): Builder
    {
        if (! in_array($matchType, ['allConditions', 'anyCondition'], true)) {
            $this->invalidFilter('The filter match type must be allConditions or anyCondition.');
        }

        $query = DB::table($table->physical_name);
        if ($filters === []) {
            return $query;
        }

        $query->where(function (Builder $group) use ($table, $filters, $matchType): void {
            foreach ($filters as $filter) {
                $method = $matchType === 'anyCondition' ? 'orWhere' : 'where';
                $group->{$method}(function (Builder $condition) use ($table, $filter): void {
                    $column = $this->runtimeColumn($table, $filter['keyName']);
                    $this->applyRuntimeCondition(
                        $condition,
                        $column['name'],
                        $column['type'],
                        $column['system'],
                        $filter['condition'],
                        $filter['keyValue'] ?? null,
                    );
                });
            }
        });

        return $query;
    }

    /** @return array{name: string, type: DataTableColumnType, system: bool} */
    private function runtimeColumn(DataTable $table, string $name): array
    {
        $systemColumn = match (strtolower($name)) {
            'id' => ['name' => 'id', 'type' => DataTableColumnType::NUMBER, 'system' => true],
            'created_at' => ['name' => 'created_at', 'type' => DataTableColumnType::DATETIME, 'system' => true],
            'updated_at' => ['name' => 'updated_at', 'type' => DataTableColumnType::DATETIME, 'system' => true],
            default => null,
        };
        if ($systemColumn !== null) {
            return $systemColumn;
        }

        $table->loadMissing('columns');
        /** @var DataTableColumn|null $column */
        $column = $table->columns->filter(
            fn (DataTableColumn $candidate): bool => strtolower($candidate->name) === strtolower($name),
        )->first();
        if ($column === null) {
            $this->invalidFilter("The {$name} data table column does not exist.");
        }

        return ['name' => $column->name, 'type' => $column->type, 'system' => false];
    }

    /**
     * Runtime operator vocabulary. Mirrors FILTER_OPERATORS in
     * resources/js/.../NodeConfigModal/components/DataTableStructuredInput/DataTableStructuredInput.tsx;
     * keep both in sync.
     */
    private function applyRuntimeCondition(
        Builder $query,
        string $name,
        DataTableColumnType $type,
        bool $system,
        string $operator,
        mixed $value,
    ): void {
        if ($operator === 'isEmpty' || $operator === 'isNotEmpty') {
            $this->applyEmptinessCondition($query, $name, $type, $operator === 'isEmpty');

            return;
        }
        if ($operator === 'isTrue' || $operator === 'isFalse') {
            if ($type !== DataTableColumnType::BOOLEAN) {
                $this->invalidFilter("The {$operator} operator is only valid for boolean columns.");
            }
            $query->where($name, $operator === 'isTrue');

            return;
        }
        if (! in_array($operator, ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike'], true)) {
            $this->invalidFilter("The {$operator} data table filter operator is invalid.");
        }
        if (in_array($operator, ['like', 'ilike'], true) && $type !== DataTableColumnType::STRING) {
            $this->invalidFilter("The {$operator} operator is only valid for string columns.");
        }

        $normalized = $this->runtimeFilterValue($type, $value, $system);
        if ($operator === 'eq' && $normalized === null) {
            $query->whereNull($name);

            return;
        }
        if ($operator === 'neq' && $normalized === null) {
            $query->whereNotNull($name);

            return;
        }
        if ($normalized === null) {
            $this->invalidFilter("The {$operator} operator requires a comparison value.");
        }

        if ($operator === 'like' || $operator === 'ilike') {
            if (! is_string($normalized)) {
                $this->invalidFilter("The {$operator} operator requires a string value.");
            }
            $wrapped = $query->getGrammar()->wrap($name);
            if (DB::connection()->getDriverName() === 'sqlite') {
                $query->whereRaw(
                    $operator === 'like'
                        ? "instr({$wrapped}, ?) > 0"
                        : "instr(LOWER({$wrapped}), LOWER(?)) > 0",
                    [$normalized],
                );
            } else {
                $pattern = $this->runtimeLikePattern($normalized);
                $query->whereRaw(
                    $operator === 'like'
                        ? "{$wrapped} LIKE ? ESCAPE '!'"
                        : "LOWER({$wrapped}) LIKE LOWER(?) ESCAPE '!'",
                    [$pattern],
                );
            }

            return;
        }

        match ($operator) {
            'eq' => $query->where($name, '=', $normalized),
            'neq' => $query->where(function (Builder $notEqual) use ($name, $normalized): void {
                $notEqual->where($name, '!=', $normalized)->orWhereNull($name);
            }),
            'gt' => $query->where($name, '>', $normalized),
            'gte' => $query->where($name, '>=', $normalized),
            'lt' => $query->where($name, '<', $normalized),
            'lte' => $query->where($name, '<=', $normalized),
        };
    }

    private function runtimeFilterValue(DataTableColumnType $type, mixed $value, bool $system): mixed
    {
        if ($value === null) {
            return null;
        }

        return match ($type) {
            DataTableColumnType::STRING => is_string($value)
                ? $value
                : $this->invalidFilter('The filter value must be a string.'),
            DataTableColumnType::NUMBER => $this->runtimeNumberFilterValue($value),
            DataTableColumnType::DATETIME => is_string($value)
                ? $this->dateFilterValue($value, $system)
                : $this->invalidFilter('The filter value must be a valid date and time.'),
            DataTableColumnType::BOOLEAN => match ($value) {
                true, 1, '1', 'true' => true,
                false, 0, '0', 'false' => false,
                default => $this->invalidFilter('The filter value must be true or false.'),
            },
        };
    }

    private function runtimeNumberFilterValue(mixed $value): int|float
    {
        if (is_int($value) || is_float($value)) {
            return $value;
        }
        if (! is_string($value) || ! is_numeric($value)) {
            $this->invalidFilter('The filter value must be a number.');
        }

        return str_contains(strtolower($value), '.')
            || str_contains(strtolower($value), 'e')
            ? (float) $value
            : (int) $value;
    }

    private function runtimeLikePattern(string $value): string
    {
        return '%'.str_replace(['!', '%', '_'], ['!!', '!%', '!_'], $value).'%';
    }

    /** @param list<array{keyName: string, condition: string, keyValue?: mixed}> $filters */
    private function assertRuntimeFiltersPresent(array $filters): void
    {
        if ($filters === []) {
            throw ValidationException::withMessages([
                'filters' => 'At least one filter is required for this operation.',
            ]);
        }
    }

    /**
     * @param  iterable<mixed>  $rows
     * @return list<int>
     */
    private function runtimeRowIds(iterable $rows): array
    {
        $ids = [];
        foreach ($rows as $row) {
            $id = ((array) $row)['id'] ?? null;
            if (is_int($id)) {
                $ids[] = $id;
            } elseif (is_string($id) && ctype_digit($id)) {
                $ids[] = (int) $id;
            } else {
                throw new \UnexpectedValueException('The data table row ID is invalid.');
            }
        }
        sort($ids);

        return $ids;
    }

    /**
     * @param  array<string, mixed>  $values
     * @return array<string, mixed>
     */
    public function runtimeInsert(DataTable $table, array $values): array
    {
        $normalized = $this->validator->validate($table, $values);

        return $this->serializeNamed($table, $this->insertNormalized($table, $normalized));
    }

    /**
     * @param  array<string, mixed>  $values
     * @return array<string, mixed>
     */
    public function create(DataTable $table, array $values): array
    {
        $row = $this->validator->validate($table, $values);

        return $this->serialize($table, $this->insertNormalized($table, $row));
    }

    /**
     * @param  list<array<string, mixed>>  $rows
     */
    public function createMany(DataTable $table, array $rows): int
    {
        $normalizedRows = $this->validator->validateMany($table, $rows);
        $columnCount = max(1, count($normalizedRows[0] ?? []) + 2);
        $chunkSize = max(1, min(500, intdiv(900, $columnCount)));

        return DB::transaction(function () use ($table, $normalizedRows, $chunkSize): int {
            $timestamp = now();
            $insertRows = array_map(
                fn (array $row): array => [
                    ...$row,
                    'created_at' => $timestamp,
                    'updated_at' => $timestamp,
                ],
                $normalizedRows,
            );

            foreach (array_chunk($insertRows, $chunkSize) as $chunk) {
                DB::table($table->physical_name)->insert($chunk);
            }

            return count($insertRows);
        }, 3);
    }

    /**
     * @param  array<string, mixed>  $values
     * @return array<string, mixed>
     */
    public function update(DataTable $table, int $rowId, array $values): array
    {
        return DB::transaction(function () use ($table, $rowId, $values): array {
            $exists = DB::table($table->physical_name)->where('id', $rowId)->lockForUpdate()->exists();
            if (! $exists) {
                throw new NotFoundHttpException;
            }

            $updates = $this->validator->validate($table, $values, partial: true);
            $updates['updated_at'] = now();
            DB::table($table->physical_name)->where('id', $rowId)->update($updates);

            return $this->find($table, $rowId);
        }, 3);
    }

    public function delete(DataTable $table, int $rowId): void
    {
        if (DB::table($table->physical_name)->where('id', $rowId)->delete() === 0) {
            throw new NotFoundHttpException;
        }
    }

    /** @param list<int> $rowIds */
    public function deleteMany(DataTable $table, array $rowIds): int
    {
        return DB::table($table->physical_name)->whereIn('id', $rowIds)->delete();
    }

    /** @return array<string, mixed> */
    private function find(DataTable $table, int $rowId): array
    {
        $row = DB::table($table->physical_name)->where('id', $rowId)->first();
        if ($row === null) {
            throw new NotFoundHttpException;
        }

        return $this->serialize($table, (array) $row);
    }

    /**
     * @param  array<string, mixed>  $row
     * @return array<string, mixed>
     */
    private function insertNormalized(DataTable $table, array $row): array
    {
        $row['created_at'] = now();
        $row['updated_at'] = now();
        $rowId = DB::table($table->physical_name)->insertGetId($row);
        $inserted = DB::table($table->physical_name)->where('id', $rowId)->first();
        if ($inserted === null) {
            throw new \UnexpectedValueException('The inserted data table row could not be loaded.');
        }

        return (array) $inserted;
    }

    /** Normalizes driver-specific boolean representations (1, '1', 't', 'true'). */
    private function castColumnValue(DataTableColumn $column, mixed $value): mixed
    {
        if ($value === null || $column->type !== DataTableColumnType::BOOLEAN) {
            return $value;
        }

        return is_bool($value) ? $value : in_array($value, [1, '1', 't', 'true'], true);
    }

    /**
     * @param  array<string, mixed>  $row
     * @return array<string, mixed>
     */
    private function serializeNamed(DataTable $table, array $row): array
    {
        $serialized = [
            'id' => $row['id'] ?? null,
        ];
        foreach ($table->columns as $column) {
            $serialized[$column->name] = $this->castColumnValue($column, $row[$column->name] ?? null);
        }
        $serialized['created_at'] = $row['created_at'] ?? null;
        $serialized['updated_at'] = $row['updated_at'] ?? null;

        return $serialized;
    }

    /**
     * @param  array<string, mixed>  $row
     * @return array<string, mixed>
     */
    private function serialize(DataTable $table, array $row): array
    {
        $rowId = $row['id'] ?? null;
        if (! is_int($rowId) && (! is_string($rowId) || ! ctype_digit($rowId))) {
            throw new \UnexpectedValueException('The data table row ID is invalid.');
        }

        $values = [];
        foreach ($table->columns as $column) {
            $values[$column->id] = $this->castColumnValue($column, $row[$column->name] ?? null);
        }

        return [
            'id' => (int) $rowId,
            'values' => $values,
            'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at'],
        ];
    }
}
