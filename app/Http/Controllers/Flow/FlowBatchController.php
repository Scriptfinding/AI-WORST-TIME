<?php

namespace App\Http\Controllers\Flow;

use App\Enums\Authorization\Ability;
use App\Http\Controllers\Controller;
use App\Models\Flow;
use App\Models\Folder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

final class FlowBatchController extends Controller
{
    public function destroy(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ids' => 'sometimes|array',
            'ids.*' => 'string|distinct',
            'folder_ids' => 'sometimes|array',
            'folder_ids.*' => 'string|distinct',
        ]);
        $flowIds = $validated['ids'] ?? [];
        $folderIds = $validated['folder_ids'] ?? [];
        if ($flowIds === [] && $folderIds === []) {
            return back()->with('error', 'No items selected.');
        }
        $workspaceValue = $this->workspaceIdFromSession();
        $workspaceId = $workspaceValue;
        $flows = Flow::whereIn('id', $flowIds)->where('workspace_id', $workspaceId)->get();
        $folders = Folder::whereIn('id', $folderIds)->where('workspace_id', $workspaceId)->get();
        foreach ($flows as $flow) {
            $this->authorize(Ability::DELETE->value, $flow);
        }
        foreach ($folders as $folder) {
            $this->authorize(Ability::DELETE->value, $folder);
            if ($folder->team_id && $folder->parent_id === null) {
                return back()->with('error', 'Team root folders cannot be deleted directly.');
            }
        }
        if ($flows->isNotEmpty() && Flow::anyHaveActiveRuns($flows->modelKeys())) {
            return back()->with('error', 'Cannot delete a flow with an active or cancellation-requested run.');
        }
        $count = $flows->count() + $folders->count();
        DB::transaction(function () use ($flows, $folders): void {
            $flows->each->delete();
            $folders->each->delete();
        }, 3);

        return back()->with('success', "Deleted {$count} item(s).");
    }
}
