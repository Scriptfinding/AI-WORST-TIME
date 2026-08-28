<?php

namespace App\Http\Controllers\DataTable;

use App\Authorization\AuthorizationContextFactory;
use App\Authorization\ResourceAssignmentValidator;
use App\Authorization\ScopeEvaluator;
use App\Authorization\Visibility\SharedResourceVisibility;
use App\Enums\Authorization\Ability;
use App\Http\Controllers\Controller;
use App\Http\Requests\DataTable\StoreDataTableRequest;
use App\Http\Requests\DataTable\UpdateDataTableRequest;
use App\Models\DataTable;
use App\Models\User;
use App\Models\WorkspaceTeam;
use App\Services\DataTable\DataTableExportService;
use App\Services\DataTable\DataTableRowRepository;
use App\Services\DataTable\DataTableSchemaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DataTableController extends Controller
{
    public function __construct(
        private readonly DataTableSchemaService $schema,
        private readonly DataTableRowRepository $rows,
        private readonly DataTableExportService $exporter,
        private readonly AuthorizationContextFactory $authorizationContexts,
        private readonly SharedResourceVisibility $visibility,
        private readonly ResourceAssignmentValidator $assignments,
        private readonly ScopeEvaluator $scopeEvaluator,
    ) {}

    public function index(Request $request): Response
    {
        $workspaceId = $this->workspaceIdFromSession();
        /** @var User $user */
        $user = $request->user();
        $context = $this->authorizationContexts->for($user, $workspaceId);
        $query = DataTable::query()
            ->with(['user:id,name', 'team:id,name'])
            ->withCount('columns');
        $this->visibility->applyView($query, $context, scopeColumn: 'visibility');
        $dataTables = $query->orderBy('name')->get();
        $this->injectOwnerWorkspaceRoles($dataTables, $workspaceId);
        $rowCounts = $this->rows->countRowsByTable($dataTables);
        $teams = app(\App\Services\FeatureFlags\FeatureFlagService::class)->teamsEnabled()
            ? WorkspaceTeam::query()->where('workspace_id', $workspaceId)->orderBy('name')->get(['id', 'name'])
            : collect();

        return Inertia::render('DataTable/DataTables', [
            'dataTables' => $dataTables->map(
                fn (DataTable $dataTable) => $this->serialize($dataTable, $rowCounts[$dataTable->id] ?? 0),
            ),
            'teams' => $teams,
            'isAdmin' => $this->scopeEvaluator->isAdministrator($context),
            'selectedDataTableId' => $request->string('t')->toString() ?: null,
        ]);
    }

    public function show(Request $request, DataTable $dataTable): JsonResponse
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

        return response()->json([
            'data_table' => $this->serialize($dataTable),
            'columns' => $dataTable->columns()->get(),
            'rows' => $this->rows->paginate($dataTable, $perPage, $validated['filters'] ?? []),
        ]);
    }

    public function downloadExport(Request $request, DataTable $dataTable): StreamedResponse
    {
        $this->authorizeDataTable($dataTable, Ability::VIEW);
        /** @var array{
         *     format: 'csv'|'json'|'xml',
         *     scope: 'all'|'filtered'|'selected',
         *     filters?: list<array{column_id: string, operator: string, value?: string|null}>,
         *     ids?: list<int>
         * } $validated
         */
        $validated = $request->validate([
            'format' => ['required', Rule::in(['csv', 'json', 'xml'])],
            'scope' => ['required', Rule::in(['all', 'filtered', 'selected'])],
            'filters' => ['sometimes', 'array', 'max:20'],
            'filters.*.column_id' => ['required', 'string'],
            'filters.*.operator' => ['required', 'string', 'max:40'],
            'filters.*.value' => ['nullable', 'string', 'max:2000'],
            'ids' => ['sometimes', 'array', 'max:100'],
            'ids.*' => ['required', 'integer', 'min:1', 'distinct'],
        ]);

        if ($validated['scope'] === 'selected' && empty($validated['ids'])) {
            throw ValidationException::withMessages([
                'ids' => 'Select at least one row to export.',
            ]);
        }

        $filters = $validated['scope'] === 'filtered' ? ($validated['filters'] ?? []) : [];
        $rowIds = $validated['scope'] === 'selected' ? ($validated['ids'] ?? []) : null;
        $columns = $dataTable->columns()->orderBy('position')->get();
        $dataTable->setRelation('columns', $columns);
        $rows = $this->rows->exportRows($dataTable, $filters, $rowIds);
        $filename = str($dataTable->name)->slug()->value() ?: "data-table-{$dataTable->id}";
        $format = $validated['format'];

        return response()->streamDownload(
            fn () => $this->exporter->write($format, $rows, $columns, $dataTable->name),
            "{$filename}.{$format}",
            ['Content-Type' => $this->exporter->contentType($format)],
        );
    }

    public function store(StoreDataTableRequest $request): JsonResponse
    {
        $workspaceId = $this->workspaceIdFromSession();
        /** @var array{name: string, description?: string|null, visibility?: string, team_id?: string|null, user_id?: string|null} $validated */
        $validated = $request->validated();
        /** @var User $user */
        $user = $request->user();
        $name = $validated['name'];
        $description = $validated['description'] ?? null;
        $requestedTeamId = $validated['team_id'] ?? null;
        $visibility = is_string($validated['visibility'] ?? null) ? $validated['visibility'] : 'owner';
        $ownerId = $this->resolveOwnerId($validated, $workspaceId, $user->id);
        $teamId = $visibility === 'team'
            ? $this->resolveWorkspaceTeamId($requestedTeamId, $workspaceId)
            : null;
        $this->assignments->validate($workspaceId, $ownerId, $visibility, $teamId);
        $dataTable = $this->schema->createDataTable([
            'workspace_id' => $workspaceId,
            'user_id' => $ownerId,
            'team_id' => $teamId,
            'name' => $name,
            'description' => $description,
            'visibility' => $visibility,
        ]);
        $dataTable->load(['user:id,name', 'team:id,name'])->loadCount('columns');

        return response()->json($this->serialize($dataTable), 201);
    }

    public function update(UpdateDataTableRequest $request, DataTable $dataTable): JsonResponse
    {
        /** @var array{name?: string, description?: string|null, visibility?: string, team_id?: string|null, user_id?: string|null} $validated */
        $validated = $request->validated();
        $visibility = is_string($validated['visibility'] ?? null)
            ? $validated['visibility']
            : $dataTable->visibility;
        $requestedTeamId = $validated['team_id'] ?? $dataTable->team_id;
        $ownerId = $this->resolveOwnerId($validated, $dataTable->workspace_id, $dataTable->user_id);
        $teamId = $visibility === 'team'
            ? $this->resolveWorkspaceTeamId($requestedTeamId, $dataTable->workspace_id)
            : null;
        if ($visibility !== $dataTable->visibility || $teamId !== $dataTable->team_id) {
            Gate::authorize(Ability::MANAGE_SCOPE->value, $dataTable);
        }
        $this->assignments->validate($dataTable->workspace_id, $ownerId, $visibility, $teamId);
        $validated['user_id'] = $ownerId;
        $validated['team_id'] = $teamId;
        $validated['visibility'] = $visibility;
        $dataTable = $this->schema->updateDataTable($dataTable, $validated);
        $dataTable->load(['user:id,name', 'team:id,name'])->loadCount('columns');

        return response()->json($this->serialize($dataTable));
    }

    public function destroy(DataTable $dataTable): JsonResponse
    {
        $this->authorizeDataTable($dataTable, Ability::DELETE);
        $this->schema->deleteDataTable($dataTable);

        return response()->json(['message' => 'Data table deleted.']);
    }

    public function destroyBatch(Request $request): JsonResponse
    {
        /** @var array{ids: list<string>} $validated */
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1', 'max:100'],
            'ids.*' => ['required', 'string', 'distinct'],
        ]);
        $workspaceId = $this->workspaceIdFromSession();
        $dataTables = DataTable::query()
            ->where('workspace_id', $workspaceId)
            ->whereKey($validated['ids'])
            ->get();
        if ($dataTables->count() !== count($validated['ids'])) {
            throw ValidationException::withMessages(['ids' => 'One or more selected data tables do not exist.']);
        }
        foreach ($dataTables as $dataTable) {
            Gate::authorize(Ability::DELETE->value, $dataTable);
        }
        $deleted = $this->schema->deleteDataTables($workspaceId, $validated['ids']);

        return response()->json([
            'message' => $deleted === 1 ? 'Data table deleted.' : "{$deleted} data tables deleted.",
            'deleted' => $deleted,
        ]);
    }

    private function authorizeDataTable(DataTable $dataTable, Ability $ability): void
    {
        abort_unless($dataTable->workspace_id === $this->workspaceIdFromSession(), 404);
        Gate::authorize($ability->value, $dataTable);
    }

    /** @return array<string, mixed> */
    private function serialize(DataTable $table, ?int $rowsCount = null): array
    {
        return array_merge($table->toArray(), [
            'user_name' => $table->user?->name,
            'team_name' => $table->team?->name,
            'columns_count' => $table->columns_count ?? $table->columns()->count(),
            'rows_count' => $rowsCount ?? DB::table($table->physical_name)->count(),
            'can_manage' => Gate::allows(Ability::UPDATE->value, $table),
        ]);
    }
}
