<?php

namespace App\Http\Controllers\Admin;

use App\DTO\Workspace\WorkspaceMutationData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Workspace\StoreWorkspaceRequest;
use App\Models\User;
use App\Models\Workspace;
use App\Services\FeatureFlags\FeatureFlagService;
use App\Services\Workspace\WorkspaceProvisioner;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class WorkspaceController extends Controller
{
    public function __construct(private readonly WorkspaceProvisioner $workspaceProvisioner) {}

    public function index(Request $request): Response
    {
        $query = Workspace::withCount('users', 'flows')
            ->with('owner:id,name,icon_type,icon_value,icon_color,avatar_path,updated_at')
            ->with('users:users.id,users.id,users.name,users.avatar_path,users.icon_type,users.icon_value,users.icon_color,users.updated_at')
            ->with('flows:id,name,workspace_id,icon_type,icon_value,icon_color,icon_upload_path');
        $workspaces = (clone $query)
            ->orderBy('name')
            ->paginate(20);
        $editingWorkspaceId = $request->string('edit')->toString()
            ?: $request->string('edit-workspace-owner')->toString();
        $editingWorkspace = $editingWorkspaceId
            ? (clone $query)->whereKey($editingWorkspaceId)->first()
            : null;

        return Inertia::render('Admin/Workspaces/Workspaces', [
            'adminWorkspaces' => $workspaces,
            'editingWorkspace' => $editingWorkspace,
            'workspaceLimit' => app(FeatureFlagService::class)->limit('workspace_limit'),
            'workspaceCount' => $workspaces->total(),
        ]);
    }

    public function store(StoreWorkspaceRequest $request): RedirectResponse
    {
        app(FeatureFlagService::class)->abortIfWorkspaceLimitReached();

        /** @var User $owner */
        $owner = $request->user();
        $this->workspaceProvisioner->create(
            $owner,
            $request->mutationData(),
            $owner,
        );

        return back()->with('success', 'Workspace created.');
    }

    public function update(Request $request, Workspace $workspace): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'expires_at' => ['nullable', 'date'],
            'lookup_key' => [
                'nullable',
                'string',
                'max:255',
                'regex:/^[a-z][a-z0-9_-]*$/',
                Rule::unique('workspaces', 'lookup_key')->ignore($workspace->id),
            ],
        ]);

        $this->workspaceProvisioner->update(
            $workspace,
            WorkspaceMutationData::fromValidated($validated),
        );

        return back()->with('success', 'Workspace updated.');
    }

    public function transferOwnership(Request $request, Workspace $workspace): RedirectResponse
    {
        $validated = $request->validate([
            'owner_id' => ['required', 'string', 'exists:users,id'],
        ]);

        $newOwner = User::where('id', $validated['owner_id'])->firstOrFail();

        $this->workspaceProvisioner->transferOwnership($workspace, $newOwner, $request->user());

        return back()->with('success', "Ownership transferred to {$newOwner->name}.");
    }

    public function destroy(Workspace $workspace): RedirectResponse
    {
        DB::transaction(fn () => $workspace->delete(), 3);

        return back()->with('success', 'Workspace deleted.');
    }
}
