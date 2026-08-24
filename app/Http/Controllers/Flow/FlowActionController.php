<?php

/*
 * Explicit proprietary scope: the paid shared action scopes and replay overrides in this file implement paid
 * Puppetflow features and are licensed under the Puppetflow Proprietary License.
 * See LICENSE_PROPRIETARY.md.
 */

namespace App\Http\Controllers\Flow;

use App\Authorization\ResourceAssignmentValidator;
use App\Enums\Authorization\Ability;
use App\Http\Controllers\Controller;
use App\Models\Flow;
use App\Models\FlowAction;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class FlowActionController extends Controller
{
    public function __construct(
        private readonly ResourceAssignmentValidator $assignments,
    ) {}

    public function store(Request $request, Flow $flow): RedirectResponse
    {
        $this->assertFlowInCurrentWorkspace($flow);
        $this->authorize(Ability::UPDATE->value, $flow);

        /** @var array{
         *     type: string,
         *     label: string,
         *     group?: string|null,
         *     config?: array<string, mixed>|null,
         *     fire_on_error?: bool,
         *     export_artifacts_screenshots?: bool|null,
         *     export_artifacts_downloads?: bool|null,
         *     export_artifacts_recording?: bool|null,
         *     scope?: string,
         *     team_id?: string|null
         * } $validated
         */
        $validated = $request->validate([
            'type' => 'required|in:webhook',
            'label' => 'required|string|max:255',
            'group' => 'nullable|string|max:100',
            'config' => 'nullable|array',
            'fire_on_error' => 'boolean',
            'export_artifacts_screenshots' => 'nullable|boolean',
            'export_artifacts_downloads' => 'nullable|boolean',
            'export_artifacts_recording' => 'nullable|boolean',
            'scope' => 'sometimes|in:'.implode(',', app(\App\Services\FeatureFlags\FeatureFlagService::class)->allowedScopes()),
            'team_id' => 'nullable|string',
        ]);
        if (array_key_exists('team_id', $validated)) {
            $validated['team_id'] = $this->resolveWorkspaceTeamId($validated['team_id'], $flow->workspace_id);
        }

        $scope = $validated['scope'] ?? 'owner';
        $teamId = $scope === 'team' ? ($validated['team_id'] ?? null) : null;
        /** @var User $user */
        $user = $request->user();
        $this->assignments->ensureOwnerSatisfiesScope($flow->workspace_id, $user->id, $scope, $teamId);

        FlowAction::create([
            ...$validated,
            'flow_id' => $flow->id,
            'user_id' => $user->id,
            'scope' => $scope,
            'team_id' => $teamId,
        ]);

        return back()->with('success', 'Action created.');
    }

    public function update(Request $request, FlowAction $action): RedirectResponse
    {
        $flow = $this->parentFlow($action);
        Gate::authorize(Ability::UPDATE->value, $action);

        /** @var array{
         *     label?: string,
         *     group?: string|null,
         *     config?: array<string, mixed>|null,
         *     is_active?: bool,
         *     fire_on_error?: bool,
         *     export_artifacts_screenshots?: bool|null,
         *     export_artifacts_downloads?: bool|null,
         *     export_artifacts_recording?: bool|null,
         *     scope?: string,
         *     team_id?: string|null,
         *     user_id?: string|null
         * } $validated
         */
        $validated = $request->validate([
            'label' => 'sometimes|string|max:255',
            'group' => 'nullable|string|max:100',
            'config' => 'nullable|array',
            'is_active' => 'sometimes|boolean',
            'fire_on_error' => 'sometimes|boolean',
            'export_artifacts_screenshots' => 'sometimes|nullable|boolean',
            'export_artifacts_downloads' => 'sometimes|nullable|boolean',
            'export_artifacts_recording' => 'sometimes|nullable|boolean',
            'scope' => 'sometimes|in:'.implode(',', app(\App\Services\FeatureFlags\FeatureFlagService::class)->allowedScopes()),
            'team_id' => 'nullable|string',
            'user_id' => 'nullable|string|exists:users,id',
        ]);
        $workspaceId = $flow->workspace_id;
        if (array_key_exists('team_id', $validated)) {
            $validated['team_id'] = $this->resolveWorkspaceTeamId($validated['team_id'], $workspaceId);
        }
        if (
            (isset($validated['scope']) && $validated['scope'] !== $action->scope)
            || (array_key_exists('team_id', $validated) && $validated['team_id'] !== $action->team_id)
        ) {
            Gate::authorize(Ability::MANAGE_SCOPE->value, $action);
        }
        $ownerId = $this->resolveOwnerId($validated, $workspaceId, $action->user_id);
        $scope = $validated['scope'] ?? $action->scope;
        abort_unless(is_string($scope), 500, 'The action scope is invalid.');
        $teamId = $scope === 'team' ? ($validated['team_id'] ?? $action->team_id) : null;
        abort_unless(is_string($teamId) || $teamId === null, 500, 'The action team is invalid.');
        $validated['team_id'] = $teamId;
        $this->assignments->ensureOwnerSatisfiesScope($workspaceId, $ownerId, $scope, $teamId);

        $action->update($validated);

        return back()->with('success', 'Action updated.');
    }

    public function destroy(Request $request, FlowAction $action): RedirectResponse
    {
        $this->parentFlow($action);
        Gate::authorize(Ability::DELETE->value, $action);

        $action->delete();

        return back()->with('success', 'Action deleted.');
    }

    public function destroyBatch(Request $request, Flow $flow): RedirectResponse
    {
        $this->assertFlowInCurrentWorkspace($flow);
        $this->authorize(Ability::UPDATE->value, $flow);

        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => [
                'string',
                'distinct',
                \Illuminate\Validation\Rule::exists('flow_actions', 'id')
                    ->where('flow_id', $flow->id),
            ],
        ]);

        /** @var list<string> $ids */
        $ids = $validated['ids'];
        $actions = FlowAction::query()->where('flow_id', $flow->id)->whereIn('id', $ids)->orderBy('id')->get();

        foreach ($actions as $action) {
            Gate::authorize(Ability::DELETE->value, $action);
        }

        DB::transaction(fn () => $actions->each->delete(), 3);
        $count = $actions->count();

        return back()->with('success', $count === 1 ? 'Action deleted.' : "{$count} actions deleted.");
    }

    private function parentFlow(FlowAction $action): Flow
    {
        $flow = $action->flow()->firstOrFail();
        $this->assertFlowInCurrentWorkspace($flow);

        return $flow;
    }

    private function assertFlowInCurrentWorkspace(Flow $flow): void
    {
        $workspaceId = $this->workspaceIdFromSession();
        abort_unless($flow->workspace_id === $workspaceId, 404);
    }
}
