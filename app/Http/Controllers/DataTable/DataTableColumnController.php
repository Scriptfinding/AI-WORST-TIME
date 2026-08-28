<?php

namespace App\Http\Controllers\DataTable;

use App\Enums\Authorization\Ability;
use App\Enums\DataTableColumnType;
use App\Http\Controllers\Controller;
use App\Http\Requests\DataTable\StoreDataTableColumnRequest;
use App\Http\Requests\DataTable\UpdateDataTableColumnRequest;
use App\Models\DataTable;
use App\Models\DataTableColumn;
use App\Services\DataTable\DataTableSchemaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class DataTableColumnController extends Controller
{
    public function __construct(private readonly DataTableSchemaService $schema) {}

    public function store(
        StoreDataTableColumnRequest $request,
        DataTable $dataTable,
    ): JsonResponse {
        $this->authorizeDataTable($dataTable);
        /** @var array{name: string, type: string, position?: int} $validated */
        $validated = $request->validated();
        $column = $this->schema->addColumn(
            $dataTable,
            $validated['name'],
            DataTableColumnType::from($validated['type']),
            $validated['position'] ?? null,
        );

        return response()->json($column, 201);
    }

    public function update(
        UpdateDataTableColumnRequest $request,
        DataTable $dataTable,
        DataTableColumn $dataTableColumn,
    ): JsonResponse {
        $this->assertColumnBelongsToDataTable($dataTableColumn, $dataTable);
        /** @var array{name?: string, position?: int} $validated */
        $validated = $request->validated();
        $column = $this->schema->updateColumn(
            $dataTableColumn,
            $validated['name'] ?? null,
            $validated['position'] ?? null,
        );

        return response()->json($column);
    }

    public function reorder(Request $request, DataTable $dataTable): JsonResponse
    {
        $this->authorizeDataTable($dataTable);
        $validated = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['required', 'string', 'distinct'],
        ]);

        return response()->json($this->schema->reorderColumns($dataTable, $validated['ids']));
    }

    public function destroy(
        DataTable $dataTable,
        DataTableColumn $dataTableColumn,
    ): JsonResponse {
        $this->assertColumnBelongsToDataTable($dataTableColumn, $dataTable);
        $this->schema->deleteColumn($dataTableColumn);

        return response()->json(['message' => 'Data table column deleted.']);
    }

    private function authorizeDataTable(DataTable $dataTable): void
    {
        abort_unless($dataTable->workspace_id === $this->workspaceIdFromSession(), 404);
        Gate::authorize(Ability::UPDATE->value, $dataTable);
    }

    private function assertColumnBelongsToDataTable(
        DataTableColumn $column,
        DataTable $dataTable,
    ): void {
        $this->authorizeDataTable($dataTable);
        abort_unless($column->data_table_id === $dataTable->id, 404);
    }
}
