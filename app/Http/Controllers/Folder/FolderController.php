<?php

/*
 * Explicit proprietary scope: the paid team and workspace folder visibility branches in this file implement paid
 * Puppetflow features and are licensed under the Puppetflow Proprietary License.
 * See LICENSE_PROPRIETARY.md.
 */

namespace App\Http\Controllers\Folder;

use App\Authorization\OnBehalfOwnerResolver;
use App\Enums\Authorization\Ability;
use App\Http\Controllers\Controller;
use App\Http\Requests\Folder\StoreFolderRequest;
use App\Http\Requests\Folder\UpdateFolderRequest;
use App\Models\Folder;
use App\Models\User;
use App\Models\WorkspaceTeam;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FolderController extends Controller
{
    public function __construct(
        private readonly OnBehalfOwnerResolver $onBehalfOwners,
    ) {}

    public function store(StoreFolderRequest $request): JsonResponse|RedirectResponse
    {
        $currentWorkspaceId = $this->workspaceIdFromSession();
        $workspaceId = $currentWorkspaceId;
        /** @var User $user */
        $user = $request->user();
        $data = [
            ...$request->validated(),
            'workspace_id' => $workspaceId,
            'owner_id' => $user->id,
        ];
        $teamId = $data['team_id'] ?? null;
        unset($data['team_id']);
        $parentId = $data['parent_id'] ?? null;
        unset($data['parent_id']);

        if (is_string($parentId) && $parentId !== '') {
            $parent = Folder::where('workspace_id', $workspaceId)
                ->where('id', $parentId)
                ->firstOrFail();
            $this->authorize(Ability::VIEW->value, $parent);
            $data['parent_id'] = $parent->id;
            $data['team_id'] = $parent->team_id;
            $data['is_shared'] = $parent->is_shared;
            if (! $parent->is_shared && $parent->owner_id) {
                // A personal subfolder must belong to the parent's owner,
                // otherwise it is unreachable in every sidebar tree.
                $data['owner_id'] = $parent->owner_id;
            }
        } elseif (is_string($teamId) && $teamId !== '') {
            $team = WorkspaceTeam::where('workspace_id', $workspaceId)
                ->where('id', $teamId)
                ->firstOrFail();
            $destination = $team->rootFolder()->firstOrFail();
            $this->authorize(Ability::VIEW->value, $destination);
            $data['team_id'] = $team->id;
            $data['is_shared'] = true;
        } elseif (empty($data['is_shared']) && $request->filled('owner_id')) {
            // Instance admins browsing another user's personal space create
            // root folders on behalf of that user.
            $requestedOwnerId = User::workspaceMemberId($request->string('owner_id')->toString(), $workspaceId);
            abort_unless($requestedOwnerId !== null, 404);
            $data['owner_id'] = $this->onBehalfOwners
                ->resolveOrFail($user, $workspaceId, $requestedOwnerId)
                ->id;
        }

        $folder = Folder::create($data);

        if ($request->wantsJson()) {
            return response()->json($folder, 201);
        }

        return back()->with('success', 'Folder created.');
    }

    public function update(UpdateFolderRequest $request, Folder $folder): RedirectResponse
    {
        $data = $request->validated();

        if (array_key_exists('parent_id', $data)) {
            $parentId = $data['parent_id'];
            unset($data['parent_id']);
            $data['parent_id'] = null;
            if ($parentId !== null) {
                $parent = Folder::where('workspace_id', $folder->workspace_id)
                    ->where('id', $parentId)
                    ->firstOrFail();
                $this->authorize(Ability::VIEW->value, $parent);
                abort_if($this->isSelfOrDescendant($folder, $parent), 422, 'Cannot move a folder into itself or one of its descendants.');
                $data['parent_id'] = $parent->id;
                $data['team_id'] = $parent->team_id;
                $data['is_shared'] = $parent->is_shared;
            }
        }

        $folder->update($data);

        return back()->with('success', 'Folder updated.');
    }

    public function move(Request $request, Folder $folder): RedirectResponse
    {
        $this->authorize(Ability::UPDATE->value, $folder);

        $request->validate([
            'parent_id' => ['nullable', 'string'],
        ]);

        $parentId = $request->string('parent_id')->toString();

        $parent = $parentId !== ''
            ? Folder::where('workspace_id', $folder->workspace_id)
                ->where('id', $parentId)
                ->firstOrFail()
            : null;

        if ($parent) {
            $this->authorize(Ability::VIEW->value, $parent);

            if ($this->isSelfOrDescendant($folder, $parent)) {
                return back()->with('error', 'Cannot move a folder into itself or one of its descendants.');
            }
        }

        $folder->update([
            'parent_id' => $parent?->id,
            ...($parent ? [
                'team_id' => $parent->team_id,
                'is_shared' => $parent->is_shared,
            ] : []),
        ]);

        return back()->with('success', 'Folder moved.');
    }

    public function destroy(Folder $folder): RedirectResponse
    {
        $this->authorize(Ability::DELETE->value, $folder);

        if ($folder->team_id && $folder->parent_id === null) {
            return back()->with('error', 'Team root folders cannot be deleted directly.');
        }

        DB::transaction(fn () => $folder->delete(), 3);

        return back()->with('success', 'Folder deleted.');
    }

    private function isSelfOrDescendant(Folder $folder, Folder $destination): bool
    {
        $current = $destination;

        while ($current) {
            if ($current->id === $folder->id) {
                return true;
            }

            $current = $current->parent;
        }

        return false;
    }
}
