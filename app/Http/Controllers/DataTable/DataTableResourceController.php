<?php

namespace App\Http\Controllers\DataTable;

use App\Authorization\AuthorizationContextFactory;
use App\Authorization\Visibility\SharedResourceVisibility;
use App\Enums\Authorization\Ability;
use App\Http\Controllers\Controller;
use App\Models\DataTable;
use App\Models\DataTableColumn;
use App\Models\Flow;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

final class DataTableResourceController extends Controller
{
    public function __construct(
        private readonly AuthorizationContextFactory $authorizationContexts,
        private readonly SharedResourceVisibility $visibility,
    ) {}

    public function __invoke(Request $request, Flow $flow): JsonResponse
    {
        abort_unless($flow->workspace_id === $this->workspaceIdFromSession(), 404);
        $this->authorize(Ability::VIEW->value, $flow);
        /** @var User $user */
        $user = $request->user();
        $query = DataTable::query()
            ->where('workspace_id', $flow->workspace_id)
            ->with(['columns', 'user:id,name', 'team:id,name']);
        $this->visibility->applyView(
            $query,
            $this->authorizationContexts->for($user, $flow->workspace_id),
            scopeColumn: 'visibility',
        );

        return response()->json($query->orderBy('name')->get()->map(
            fn (DataTable $dataTable): array => [
                'id' => $dataTable->id,
                'name' => $dataTable->name,
                'description' => $dataTable->description,
                'visibility' => $dataTable->visibility,
                'owner' => $dataTable->user === null ? null : [
                    'id' => $dataTable->user->id,
                    'name' => $dataTable->user->name,
                ],
                'team' => $dataTable->team === null ? null : [
                    'id' => $dataTable->team->id,
                    'name' => $dataTable->team->name,
                ],
                'can_manage' => Gate::forUser($user)->allows(Ability::UPDATE->value, $dataTable),
                'columns' => $dataTable->columns->map(fn (DataTableColumn $column): array => [
                    'id' => $column->id,
                    'name' => $column->name,
                    'type' => $column->type->value,
                ])->values()->all(),
            ],
        )->values());
    }
}
