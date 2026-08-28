<?php

namespace App\Http\Controllers\DataTable;

use App\Enums\Authorization\Ability;
use App\Http\Controllers\Controller;
use App\Http\Requests\DataTable\StoreDataTableRowRequest;
use App\Http\Requests\DataTable\UpdateDataTableRowRequest;
use App\Models\DataTable;
use App\Services\DataTable\DataTableRowRepository;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class DataTableRowController extends Controller
{
    public function __construct(private readonly DataTableRowRepository $rows) {}

    public function index(Request $request, DataTable $dataTable): JsonResponse
    {
        $this->authorizeDataTable($dataTable, Ability::VIEW);
        $perPage = min(max($request->integer('per_page', 50), 1), 100);
        /** @var array{filters?: list<array{column_id: string, operator: string, value?: string|null}>} $validated */
        $validated = $request->validate([
            'filters' => ['sometimes', 'array', 'max:20'],
            'filters.*.column_id' => ['required', 'string'],
            'filters.*.operator' => ['required', 'string', 'max:40'],
            'filters.*.value' => ['nullable', 'string', 'max:2000'],
        ]);

        return response()->json($this->rows->paginate($dataTable, $perPage, $validated['filters'] ?? []));
    }

    public function store(
        StoreDataTableRowRequest $request,
        DataTable $dataTable,
    ): JsonResponse {
        $this->authorizeDataTable($dataTable, Ability::UPDATE);
        /** @var array{values: array<string, mixed>} $validated */
        $validated = $request->validated();

        return response()->json(
            $this->rows->create($dataTable, $validated['values']),
            201,
        );
    }

    public function import(Request $request, DataTable $dataTable): JsonResponse
    {
        $this->authorizeDataTable($dataTable, Ability::UPDATE);
        /** @var array{rows: list<array<string, mixed>>} $validated */
        $validated = $request->validate([
            'rows' => ['required', 'array', 'min:1', 'max:1000'],
            'rows.*' => [
                'required',
                'array',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if (is_array($value) && $value !== [] && array_is_list($value)) {
                        $fail('Each imported row must be an object.');
                    }
                },
            ],
        ]);
        $imported = $this->rows->createMany($dataTable, $validated['rows']);

        return response()->json(['imported' => $imported], 201);
    }

    public function update(
        UpdateDataTableRowRequest $request,
        DataTable $dataTable,
        string $rowId,
    ): JsonResponse {
        $this->authorizeDataTable($dataTable, Ability::UPDATE);
        $rowId = $this->rowId($rowId);
        /** @var array{values: array<string, mixed>} $validated */
        $validated = $request->validated();

        return response()->json(
            $this->rows->update($dataTable, $rowId, $validated['values']),
        );
    }

    public function destroy(
        Request $request,
        DataTable $dataTable,
        string $rowId,
    ): JsonResponse {
        $this->authorizeDataTable($dataTable, Ability::UPDATE);
        $rowId = $this->rowId($rowId);
        $this->rows->delete($dataTable, $rowId);

        return response()->json(['message' => 'Data table row deleted.']);
    }

    public function destroyBatch(
        Request $request,
        DataTable $dataTable,
    ): JsonResponse {
        $this->authorizeDataTable($dataTable, Ability::UPDATE);
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1', 'max:100'],
            'ids.*' => ['required', 'integer', 'min:1', 'distinct'],
        ]);
        $deleted = $this->rows->deleteMany($dataTable, $validated['ids']);

        return response()->json([
            'message' => $deleted === 1 ? 'Data table row deleted.' : "{$deleted} data table rows deleted.",
            'deleted' => $deleted,
        ]);
    }

    private function authorizeDataTable(DataTable $dataTable, Ability $ability): void
    {
        abort_unless($dataTable->workspace_id === $this->workspaceIdFromSession(), 404);
        Gate::authorize($ability->value, $dataTable);
    }

    private function rowId(string $rowId): int
    {
        abort_unless(ctype_digit($rowId) && (int) $rowId > 0, 404);

        return (int) $rowId;
    }
}
