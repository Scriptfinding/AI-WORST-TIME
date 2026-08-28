<?php

namespace App\Services\Runtime;

use App\Authorization\AuthorizationContextFactory;
use App\Authorization\ResourceAssignmentValidator;
use App\Authorization\Visibility\SharedResourceVisibility;
use App\Enums\Authorization\Ability;
use App\Enums\DataTableColumnType;
use App\Models\DataTable;
use App\Models\DataTableColumn;
use App\Models\FlowRun;
use App\Models\User;
use App\Services\DataTable\DataTableRowRepository;
use App\Services\DataTable\DataTableSchemaService;
use App\Services\FeatureFlags\FeatureFlagService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

final class DataTableRuntimeService
{
    public const READ_OPERATIONS = ['getRows', 'rowExists', 'rowDoesNotExist', 'list'];

    public const WRITE_OPERATIONS = ['insertRow', 'updateRows', 'upsertRows', 'deleteRows'];

    public const SCHEMA_OPERATIONS = ['create', 'delete', 'update'];

    public function __construct(
        private readonly DataTableRowRepository $rows,
        private readonly DataTableSchemaService $schema,
        private readonly AuthorizationContextFactory $authorizationContexts,
        private readonly SharedResourceVisibility $visibility,
        private readonly ResourceAssignmentValidator $assignments,
        private readonly FeatureFlagService $features,
    ) {}

    /** @param array<string, mixed> $payload */
    public function read(FlowRun $run, array $payload): mixed
    {
        $operation = $this->operation($payload, self::READ_OPERATIONS);
        [$actor, $workspaceId] = $this->actorContext($run);
        if ($operation === 'list') {
            return $this->list($actor, $workspaceId, $payload);
        }
        $table = $this->table($actor, $workspaceId, $payload, Ability::VIEW);

        return match ($operation) {
            'getRows' => $this->rows->runtimeRows(
                $table,
                $this->filters($payload),
                $this->matchType($payload),
                ($payload['returnAll'] ?? false) === true ? null : $this->limit($payload),
                $this->optionalString($payload, 'orderBy'),
                $this->direction($payload),
            ),
            'rowExists' => $this->rows->runtimeExists(
                $table,
                $this->filters($payload),
                $this->matchType($payload),
            ),
            'rowDoesNotExist' => ! $this->rows->runtimeExists(
                $table,
                $this->filters($payload),
                $this->matchType($payload),
            ),
            default => throw new \LogicException('Unsupported Data Table read operation.'),
        };
    }

    /** @param array<string, mixed> $payload */
    public function write(FlowRun $run, array $payload): mixed
    {
        $operation = $this->operation($payload, self::WRITE_OPERATIONS);
        [$actor, $workspaceId] = $this->actorContext($run);
        $table = $this->table($actor, $workspaceId, $payload, Ability::UPDATE);
        $values = $operation === 'deleteRows'
            ? []
            : $this->valuesByColumnId($table, $this->values($payload));

        return match ($operation) {
            'insertRow' => $this->rows->runtimeInsert($table, $values),
            'updateRows' => $this->rows->runtimeUpdate(
                $table,
                $this->filters($payload),
                $this->matchType($payload),
                $values,
                ($payload['dryRun'] ?? false) === true,
                ($payload['updateAll'] ?? false) === true,
            ),
            'upsertRows' => $this->rows->runtimeUpsert(
                $table,
                $this->filters($payload),
                $this->matchType($payload),
                $values,
                ($payload['dryRun'] ?? false) === true,
            ),
            'deleteRows' => $this->rows->runtimeDelete(
                $table,
                $this->filters($payload),
                $this->matchType($payload),
                ($payload['dryRun'] ?? false) === true,
            ),
            default => throw new \LogicException('Unsupported Data Table write operation.'),
        };
    }

    /** @param array<string, mixed> $payload */
    public function schema(FlowRun $run, array $payload): mixed
    {
        $operation = $this->operation($payload, self::SCHEMA_OPERATIONS);
        [$actor, $workspaceId] = $this->actorContext($run);

        return match ($operation) {
            'create' => $this->create($actor, $workspaceId, $payload),
            'delete' => $this->delete(
                $this->table($actor, $workspaceId, $payload, Ability::DELETE),
            ),
            'update' => $this->update(
                $actor,
                $this->table($actor, $workspaceId, $payload, Ability::UPDATE),
                $payload,
            ),
            default => throw new \LogicException('Unsupported Data Table schema operation.'),
        };
    }

    /**
     * @return array{0: User, 1: string}
     */
    private function actorContext(FlowRun $run): array
    {
        $flow = $run->flow()->firstOrFail();
        $actor = $run->triggeredBy()->first();
        if (! $actor instanceof User) {
            abort(403, 'The Data Table operation has no authorized actor.');
        }

        return [$actor, $flow->workspace_id];
    }

    /** @param array<string, mixed> $payload */
    private function table(
        User $actor,
        string $workspaceId,
        array $payload,
        Ability $ability,
    ): DataTable {
        $table = DataTable::query()
            ->where('workspace_id', $workspaceId)
            ->with('columns')
            ->findOrFail($this->requiredString($payload, 'tableId'));
        Gate::forUser($actor)->authorize($ability->value, $table);

        return $table;
    }

    /**
     * @param array<string, mixed> $payload
     * @return list<array<string, mixed>>
     */
    private function list(User $actor, string $workspaceId, array $payload): array
    {
        $query = DataTable::query()->with('columns');
        $this->visibility->applyView(
            $query,
            $this->authorizationContexts->for($actor, $workspaceId),
            scopeColumn: 'visibility',
        );
        foreach (['visibility' => 'visibility', 'ownerId' => 'user_id', 'teamId' => 'team_id'] as $key => $column) {
            $value = $this->optionalString($payload, $key);
            if ($value !== null) {
                $query->where($column, $value);
            }
        }

        return array_values($query->orderBy('name')->get()
            ->map(fn (DataTable $table): array => $this->serializeTable($table))
            ->values()
            ->all());
    }

    /**
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    private function create(User $actor, string $workspaceId, array $payload): array
    {
        Gate::forUser($actor)->authorize(Ability::CREATE->value, DataTable::class);
        $columns = $this->columns($payload);
        $visibility = $this->visibilityValue($payload, 'visibility', 'owner');
        $ownerId = $this->optionalString($payload, 'ownerId') ?? $actor->id;
        $teamId = $visibility === 'team' ? $this->optionalString($payload, 'teamId') : null;
        $this->assignments->validate($workspaceId, $ownerId, $visibility, $teamId);

        return DB::transaction(function () use (
            $workspaceId,
            $ownerId,
            $teamId,
            $visibility,
            $payload,
            $columns,
        ): array {
            $table = $this->schema->createDataTable([
                'workspace_id' => $workspaceId,
                'user_id' => $ownerId,
                'team_id' => $teamId,
                'name' => $this->requiredString($payload, 'name'),
                'description' => $this->nullableString($payload, 'description'),
                'visibility' => $visibility,
            ]);
            foreach ($columns as $position => $definition) {
                $this->schema->addColumn(
                    $table,
                    $definition['name'],
                    DataTableColumnType::from($definition['type']),
                    $position,
                );
            }

            return $this->serializeTable($table->load('columns'));
        }, 3);
    }

    /** @return array{deleted: bool, tableId: string} */
    private function delete(DataTable $table): array
    {
        $id = $table->id;
        $this->schema->deleteDataTable($table);

        return ['deleted' => true, 'tableId' => $id];
    }

    /**
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    private function update(User $actor, DataTable $table, array $payload): array
    {
        $changes = $payload['changes'] ?? null;
        if (! is_array($changes) || ($changes !== [] && array_is_list($changes))) {
            throw ValidationException::withMessages(['changes' => 'Data Table changes must be an object.']);
        }
        $allowed = ['name', 'description', 'visibility', 'ownerId', 'teamId'];
        if (array_diff(array_keys($changes), $allowed) !== []) {
            throw ValidationException::withMessages(['changes' => 'Data Table changes contain unsupported fields.']);
        }
        if ($changes === []) {
            throw ValidationException::withMessages(['changes' => 'Provide at least one Data Table change.']);
        }

        $visibility = array_key_exists('visibility', $changes)
            ? $this->visibilityValue($changes, 'visibility')
            : $table->visibility;
        $ownerId = array_key_exists('ownerId', $changes)
            ? $this->requiredString($changes, 'ownerId')
            : $table->user_id;
        $teamId = $visibility === 'team'
            ? (array_key_exists('teamId', $changes)
                ? $this->nullableString($changes, 'teamId')
                : $table->team_id)
            : null;
        if ($ownerId !== $table->user_id) {
            Gate::forUser($actor)->authorize(Ability::TRANSFER_OWNERSHIP->value, $table);
        }
        if ($visibility !== $table->visibility || $teamId !== $table->team_id) {
            Gate::forUser($actor)->authorize(Ability::MANAGE_SCOPE->value, $table);
        }
        $this->assignments->validate($table->workspace_id, $ownerId, $visibility, $teamId);

        $attributes = [
            'user_id' => $ownerId,
            'team_id' => $teamId,
            'visibility' => $visibility,
        ];
        if (array_key_exists('name', $changes)) {
            $attributes['name'] = $this->requiredString($changes, 'name');
        }
        if (array_key_exists('description', $changes)) {
            $attributes['description'] = $this->nullableString($changes, 'description');
        }

        return $this->serializeTable($this->schema->updateDataTable($table, $attributes)->load('columns'));
    }

    /**
     * @param array<string, mixed> $payload
     * @return list<array{name: string, type: string}>
     */
    private function columns(array $payload): array
    {
        $columns = $payload['columns'] ?? [];
        if (! is_array($columns) || ! array_is_list($columns)) {
            throw ValidationException::withMessages(['columns' => 'Data Table columns must be a list.']);
        }

        return array_map(function (mixed $definition): array {
            if (
                ! is_array($definition)
                || ! is_string($definition['name'] ?? null)
                || ! is_string($definition['type'] ?? null)
                || DataTableColumnType::tryFrom($definition['type']) === null
            ) {
                throw ValidationException::withMessages([
                    'columns' => 'Each Data Table column requires a valid name and type.',
                ]);
            }

            return ['name' => trim($definition['name']), 'type' => $definition['type']];
        }, $columns);
    }

    /**
     * @param array<string, mixed> $values
     * @return array<string, mixed>
     */
    private function valuesByColumnId(DataTable $table, array $values): array
    {
        $byName = $table->columns->keyBy(fn (DataTableColumn $column): string => strtolower($column->name));
        $mapped = [];
        foreach ($values as $name => $value) {
            /** @var DataTableColumn|null $column */
            $column = $byName->get(strtolower($name));
            if ($column === null) {
                throw ValidationException::withMessages(["values.{$name}" => "The {$name} Data Table column does not exist."]);
            }
            $mapped[$column->id] = $value;
        }

        return $mapped;
    }

    /**
     * @param array<string, mixed> $payload
     * @return list<array{keyName: string, condition: string, keyValue?: mixed}>
     */
    private function filters(array $payload): array
    {
        $filters = $payload['filters'] ?? [];
        if (! is_array($filters) || ! array_is_list($filters)) {
            throw ValidationException::withMessages(['filters' => 'Data Table filters must be a list.']);
        }
        foreach ($filters as $filter) {
            if (
                ! is_array($filter)
                || ! is_string($filter['keyName'] ?? null)
                || ! is_string($filter['condition'] ?? null)
            ) {
                throw ValidationException::withMessages([
                    'filters' => 'Each Data Table filter requires a column and condition.',
                ]);
            }
        }

        /** @var list<array{keyName: string, condition: string, keyValue?: mixed}> $filters */
        return $filters;
    }

    /**
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    private function values(array $payload): array
    {
        $values = $payload['values'] ?? null;
        if (
            ! is_array($values)
            || ($values !== [] && array_is_list($values))
            || array_filter(array_keys($values), fn (mixed $key): bool => ! is_string($key)) !== []
        ) {
            throw ValidationException::withMessages(['values' => 'Data Table row values must be an object.']);
        }

        /** @var array<string, mixed> $values */
        return $values;
    }

    /**
     * @param array<string, mixed> $payload
     * @param list<string> $allowed
     */
    private function operation(array $payload, array $allowed): string
    {
        $operation = $this->requiredString($payload, 'operation');
        if (! in_array($operation, $allowed, true)) {
            throw ValidationException::withMessages([
                'operation' => 'The Data Table operation is invalid for this endpoint.',
            ]);
        }

        return $operation;
    }

    /** @param array<string, mixed> $payload */
    private function matchType(array $payload): string
    {
        $matchType = $this->optionalString($payload, 'matchType') ?? 'allConditions';
        if (! in_array($matchType, ['allConditions', 'anyCondition'], true)) {
            throw ValidationException::withMessages([
                'matchType' => 'The Data Table match type must be allConditions or anyCondition.',
            ]);
        }

        return $matchType;
    }

    /** @param array<string, mixed> $payload */
    private function limit(array $payload): int
    {
        $limit = $payload['limit'] ?? 50;
        if (! is_int($limit) || $limit < 1 || $limit > 10000) {
            throw ValidationException::withMessages([
                'limit' => 'The Data Table row limit must be between 1 and 10000.',
            ]);
        }

        return $limit;
    }

    /** @param array<string, mixed> $payload */
    private function direction(array $payload): string
    {
        $direction = strtolower($this->optionalString($payload, 'direction') ?? 'desc');
        if (! in_array($direction, ['asc', 'desc'], true)) {
            throw ValidationException::withMessages([
                'direction' => 'The Data Table sort direction must be asc or desc.',
            ]);
        }

        return $direction;
    }

    /** @param array<string, mixed> $payload */
    private function visibilityValue(array $payload, string $key, ?string $default = null): string
    {
        $visibility = $this->optionalString($payload, $key) ?? $default;
        if ($visibility === null || ! in_array($visibility, $this->features->allowedScopes(), true)) {
            throw ValidationException::withMessages([
                $key => 'The selected Data Table visibility is not available.',
            ]);
        }

        return $visibility;
    }

    /** @param array<string, mixed> $payload */
    private function requiredString(array $payload, string $key): string
    {
        $value = $this->optionalString($payload, $key);
        if ($value === null) {
            throw ValidationException::withMessages([$key => "The {$key} field is required."]);
        }

        return $value;
    }

    /** @param array<string, mixed> $payload */
    private function optionalString(array $payload, string $key): ?string
    {
        $value = $payload[$key] ?? null;

        return is_string($value) && trim($value) !== '' ? trim($value) : null;
    }

    /** @param array<string, mixed> $payload */
    private function nullableString(array $payload, string $key): ?string
    {
        if (($payload[$key] ?? null) === null) {
            return null;
        }
        if (! is_string($payload[$key])) {
            throw ValidationException::withMessages([$key => "The {$key} field must be a string or null."]);
        }

        return trim($payload[$key]);
    }

    /** @return array<string, mixed> */
    private function serializeTable(DataTable $table): array
    {
        $table->loadMissing('columns');

        return [
            'id' => $table->id,
            'name' => $table->name,
            'description' => $table->description,
            'visibility' => $table->visibility,
            'ownerId' => $table->user_id,
            'teamId' => $table->team_id,
            'columns' => $table->columns->map(fn (DataTableColumn $column): array => [
                'id' => $column->id,
                'name' => $column->name,
                'type' => $column->type->value,
                'position' => $column->position,
            ])->values()->all(),
        ];
    }
}
