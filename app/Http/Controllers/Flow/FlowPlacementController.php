<?php

namespace App\Http\Controllers\Flow;

use App\Enums\Authorization\Ability;
use App\Http\Controllers\Controller;
use App\Models\Flow;
use App\Models\User;
use App\Services\FeatureFlags\FeatureFlagService;
use App\Services\Flow\FlowPlacementService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

final class FlowPlacementController extends Controller
{
    public function __construct(
        private readonly FlowPlacementService $placement,
        private readonly FeatureFlagService $features,
    ) {}

    public function updateVisibility(Request $request, Flow $flow): RedirectResponse
    {
        abort_unless($flow->workspace_id === $this->workspaceId(), 404);
        $this->authorize(Ability::UPDATE->value, $flow);
        /** @var array{visibility: string, folder_id?: string|null, workspace_folder_id?: string|null, team_id?: string|null, owner_id?: string|null} $validated */
        $validated = $request->validate([
            'visibility' => ['required', 'in:'.implode(',', $this->features->allowedScopes())],
            'folder_id' => ['nullable', 'string'],
            'workspace_folder_id' => ['nullable', 'string'],
            'team_id' => ['nullable', 'string'],
            'owner_id' => ['sometimes', 'nullable', 'string', 'exists:users,id'],
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
        if (array_key_exists('owner_id', $validated)) {
            if (is_string($validated['owner_id']) && $validated['owner_id'] !== '') {
                $ownerId = User::workspaceMemberId($validated['owner_id'], $flow->workspace_id);
                abort_unless($ownerId !== null, 422, 'The selected owner is not a member of this workspace.');
                $validated['owner_id'] = $ownerId;
            } else {
                unset($validated['owner_id']);
            }
        }
        $this->placement->updateVisibility($flow, $validated);

        return back()->with('success', 'Visibility updated.');
    }

    public function move(Request $request, Flow $flow): RedirectResponse
    {
        abort_unless($flow->workspace_id === $this->workspaceId(), 404);
        $this->authorize(Ability::UPDATE->value, $flow);
        /** @var array{folder_id?: string|null, workspace_folder_id?: string|null, scope?: string, team_id?: string|null, change_visibility?: bool} $validated */
        $validated = $request->validate([
            'folder_id' => ['nullable', 'string'],
            'workspace_folder_id' => ['nullable', 'string'],
            'scope' => ['sometimes', 'in:'.implode(',', $this->features->allowedScopes())],
            'team_id' => ['nullable', 'string'],
            'change_visibility' => ['sometimes', 'boolean'],
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
        $this->placement->move($flow, $validated, $request->boolean('change_visibility'));

        return back()->with('success', 'Flow moved.');
    }

    private function workspaceId(): string
    {
        return $this->workspaceIdFromSession();
    }
}
