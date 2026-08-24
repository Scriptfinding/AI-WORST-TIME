<?php

namespace App\Http\Controllers\Flow;

use App\Enums\Authorization\Ability;
use App\Http\Controllers\Controller;
use App\Models\Flow;
use App\Models\User;
use App\Services\FeatureFlags\FeatureFlagService;
use App\Services\Flow\FlowDuplicationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

final class FlowDuplicationController extends Controller
{
    public function __construct(
        private readonly FlowDuplicationService $duplication,
        private readonly FeatureFlagService $features,
    ) {}

    public function __invoke(Request $request, Flow $flow): JsonResponse|RedirectResponse
    {
        $workspaceValue = $this->workspaceIdFromSession();
        $workspaceId = $workspaceValue;
        abort_unless($flow->workspace_id === $workspaceId, 404);
        $this->authorize(Ability::VIEW->value, $flow);
        Gate::authorize(Ability::CREATE->value, Flow::class);
        /** @var array{name?: string, description?: string|null, visibility?: string, folder_id?: string|null, workspace_folder_id?: string|null, team_id?: string|null} $validated */
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:128'],
            'description' => ['nullable', 'string'],
            'visibility' => ['sometimes', 'in:'.implode(',', $this->features->allowedScopes())],
            'folder_id' => ['nullable', 'string'],
            'workspace_folder_id' => ['nullable', 'string'],
            'team_id' => ['nullable', 'string'],
        ]);
        if (array_key_exists('folder_id', $validated)) {
            $validated['folder_id'] = $this->resolveWorkspaceFolderId($validated['folder_id'], $flow->workspace_id);
        }
        if (array_key_exists('workspace_folder_id', $validated)) {
            $validated['workspace_folder_id'] = $this->resolveWorkspaceFolderId($validated['workspace_folder_id'], $flow->workspace_id, 'workspace_folder_id');
        }
        if (array_key_exists('team_id', $validated)) {
            $validated['team_id'] = $this->resolveWorkspaceTeamId($validated['team_id'], $flow->workspace_id);
        }
        $user = $request->user();
        if (! $user instanceof User) {
            abort(401);
        }
        $copy = $this->duplication->duplicate($flow, $user, $workspaceId, $validated);
        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Flow duplicated.',
                'url' => route('flows.show', $copy).'#code',
                'flow' => ['id' => $copy->id, 'name' => $copy->name],
            ]);
        }

        return redirect()->to(route('flows.show', $copy).'#code')->with('success', 'Flow duplicated.');
    }
}
