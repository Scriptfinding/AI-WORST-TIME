<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Flow;
use App\Models\RegistrationRequest;
use App\Models\User;
use App\Models\Workspace;
use App\Services\Auth\RegistrationRequestApprovalService;
use App\Services\Workspace\UserIdentityManager;
use App\Services\Workspace\WorkspaceMembershipManager;
use App\Support\IdentityEmail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function __construct(
        private WorkspaceMembershipManager $workspaceMemberships,
        private UserIdentityManager $userIdentities,
        private RegistrationRequestApprovalService $registrationApprovals,
    ) {}

    public function index(Request $request): Response
    {
        $query = User::withCount('workspaces', 'ownedFlows', 'apiKeys')
            ->with('workspaces:workspaces.id,workspaces.id,workspaces.name,workspaces.icon_type,workspaces.icon_value,workspaces.icon_color,workspaces.icon_upload_path')
            ->with('ownedFlows:id,name,owner_id,icon_type,icon_value,icon_color,icon_upload_path');
        $users = (clone $query)
            ->latest()
            ->paginate(20);
        $editingUserId = $request->string('edit')->toString();
        $editingUser = $editingUserId
            ? (clone $query)->whereKey($editingUserId)->first()
            : null;

        $allWorkspaces = Workspace::select('id', 'name')->orderBy('name')->get();

        return Inertia::render('Admin/Users/Users', [
            'users' => $users,
            'editingUser' => $editingUser,
            'allWorkspaces' => $allWorkspaces,
            'registrationRequests' => RegistrationRequest::query()
                ->latest()
                ->get(['id', 'name', 'email', 'email_verified_at', 'origin', 'created_at']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->merge(['email' => IdentityEmail::normalize($request->input('email'))]);
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users'],
            'password' => ['required', Password::defaults()],
            'role' => ['sometimes', 'in:admin,member'],
            'can_create_workspace' => ['sometimes', 'boolean'],
            'workspace_ids' => ['nullable', 'array'],
            'workspace_ids.*' => ['string', 'distinct', 'exists:workspaces,id'],
        ]);

        DB::transaction(function () use ($request, $validated) {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role' => $validated['role'] ?? 'member',
                'can_create_workspace' => $validated['can_create_workspace'] ?? true,
            ]);

            if (! empty($validated['workspace_ids'])) {
                /** @var list<string> $workspaceIds */
                $workspaceIds = $validated['workspace_ids'];
                $memberships = collect($workspaceIds)
                    ->mapWithKeys(fn (string $id) => [$id => 'member'])
                    ->all();
                $this->workspaceMemberships->replace($user, $memberships, $request->user());
            }

            $this->lockAndAuthorizeInstanceAdmin($user);
        }, 3);

        return back()->with('success', 'User created.');
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        if ($request->has('email')) {
            $request->merge(['email' => IdentityEmail::normalize($request->input('email'))]);
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'unique:users,email,'.$user->id],
            'password' => ['nullable', 'string'],
            'role' => ['sometimes', 'in:admin,member'],
            'can_create_workspace' => ['sometimes', 'boolean'],
            'workspace_ids' => ['sometimes', 'array'],
            'workspace_ids.*' => ['string', 'distinct', 'exists:workspaces,id'],
        ]);

        if (isset($validated['role']) && $user->id === Auth::id() && $validated['role'] !== 'admin') {
            abort(400, 'Cannot remove your own admin role.');
        }

        $workspaceIds = null;

        if (isset($validated['workspace_ids'])) {
            /** @var list<string> $validatedWorkspaceIds */
            $validatedWorkspaceIds = $validated['workspace_ids'];
            $workspaceIds = $validatedWorkspaceIds;
            unset($validated['workspace_ids']);
        }

        if (! empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        DB::transaction(function () use ($user, $validated, $workspaceIds) {
            $attributes = $validated;

            if ($workspaceIds !== null) {
                $existingPivots = $user->workspaces()->pluck('user_workspace.role', 'workspaces.id');
                $memberships = collect($workspaceIds)
                    ->mapWithKeys(function (string $id) use ($existingPivots): array {
                        $role = $existingPivots[$id] ?? 'member';

                        return [$id => is_string($role) ? $role : 'member'];
                    })
                    ->all();
                $this->workspaceMemberships->replace($user, $memberships, Auth::user());
            }

            $email = $attributes['email'] ?? null;
            if (is_string($email) && $email !== $user->email) {
                $this->userIdentities->changeEmail($user, $email, Auth::user());
            }
            unset($attributes['email']);

            $lockedUser = $this->lockAndAuthorizeInstanceAdmin($user);
            $lockedUser->update($attributes);
        }, 3);

        return back()->with('success', 'User updated.');
    }

    public function search(Request $request): JsonResponse
    {
        $query = User::select('id', 'name', 'email');

        if ($id = $request->string('id')->toString()) {
            $query->where('id', $id);
        } elseif ($search = $request->input('q')) {
            $search = is_scalar($search) ? (string) $search : '';
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        return response()->json($query->orderBy('name')->limit(50)->get());
    }

    public function destroy(User $user): RedirectResponse
    {
        abort_if($user->id === Auth::id(), 400, 'Cannot delete yourself.');

        $deleted = DB::transaction(function () use ($user): bool {
            $lockedUser = User::query()->whereKey($user->getKey())->lockForUpdate()->first();
            if (! $lockedUser instanceof User) {
                return false;
            }

            $ownedFlows = Flow::query()
                ->where('owner_id', $lockedUser->id)
                ->orderBy('id')
                ->lockForUpdate()
                ->get();
            if ($ownedFlows->isNotEmpty() && Flow::anyHaveActiveRuns($ownedFlows->modelKeys())) {
                return false;
            }

            $this->workspaceMemberships->prepareUserDeletion($lockedUser, Auth::user());

            return (bool) $lockedUser->delete();
        }, 3);
        if (! $deleted) {
            return back()->with('error', 'Cannot delete a user who owns a flow with an active or cancellation-requested run.');
        }

        return back()->with('success', 'User deleted.');
    }

    public function destroyBatch(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'user_ids' => ['required', 'array', 'min:1'],
            'user_ids.*' => ['string', 'distinct', 'exists:users,id'],
        ]);

        /** @var list<string> $userIds */
        $userIds = $validated['user_ids'];
        $ids = User::whereIn('id', $userIds)
            ->pluck('id')
            ->filter(fn (mixed $id): bool => is_string($id))
            ->values()
            ->all();
        abort_if(in_array(Auth::id(), $ids, true), 400, 'Cannot delete yourself.');

        $deleted = DB::transaction(function () use ($ids): bool {
            $users = User::query()
                ->whereKey($ids)
                ->orderBy('id')
                ->lockForUpdate()
                ->get();
            if ($users->count() !== count($ids)) {
                return false;
            }

            $ownedFlows = Flow::query()
                ->whereIn('owner_id', $ids)
                ->orderBy('id')
                ->lockForUpdate()
                ->get();
            if ($ownedFlows->isNotEmpty() && Flow::anyHaveActiveRuns($ownedFlows->modelKeys())) {
                return false;
            }

            foreach ($users as $user) {
                $this->workspaceMemberships->prepareUserDeletion($user, Auth::user());
                $user->delete();
            }

            return true;
        }, 3);

        if (! $deleted) {
            return back()->with('error', 'Cannot delete users who own a flow with an active or cancellation-requested run.');
        }

        $count = count($ids);

        return back()->with('success', $count === 1 ? 'User deleted.' : "{$count} users deleted.");
    }

    public function approveRegistrationRequest(
        Request $request,
        RegistrationRequest $registrationRequest,
    ): RedirectResponse {
        $validated = $request->validate([
            'workspace_ids' => ['required', 'array', 'min:1'],
            'workspace_ids.*' => ['string', 'distinct', 'exists:workspaces,id'],
        ]);

        /** @var list<string> $workspaceIds */
        $workspaceIds = $validated['workspace_ids'];
        $memberships = collect($workspaceIds)
            ->mapWithKeys(fn (string $id) => [$id => 'member'])
            ->all();
        /** @var User $actor */
        $actor = $request->user();
        $this->registrationApprovals->approve(
            $registrationRequest,
            $memberships,
            $actor,
            crossWorkspace: true,
        );

        return back()->with('success', 'Invitation request approved.');
    }

    public function rejectRegistrationRequest(
        RegistrationRequest $registrationRequest,
    ): RedirectResponse {
        $this->registrationApprovals->reject($registrationRequest);

        return back()->with('success', 'Invitation request rejected.');
    }

    public function impersonate(User $user): RedirectResponse
    {
        abort_if(session()->has('impersonate.admin_id'), 403, 'Already impersonating.');
        abort_if($user->id === Auth::id(), 400, 'Cannot impersonate yourself.');

        session()->put('impersonate.admin_id', Auth::id());
        session()->put('impersonate.admin_workspace_id', session('current_workspace_id'));

        Auth::login($user);

        $workspace = $user->workspaces()->first();
        session(['current_workspace_id' => $workspace?->id]);

        return redirect()->route('dashboard');
    }

    public function leaveImpersonate(): RedirectResponse
    {
        $adminId = session()->pull('impersonate.admin_id');
        $adminWorkspaceId = session()->pull('impersonate.admin_workspace_id');
        abort_unless($adminId !== null, 403);

        Auth::loginUsingId($adminId);
        session(['current_workspace_id' => $adminWorkspaceId]);

        return redirect()->route('admin.users.index');
    }

    private function lockAndAuthorizeInstanceAdmin(User $target): User
    {
        $users = User::query()
            ->whereIn('id', [Auth::id(), $target->id])
            ->orderBy('id')
            ->lockForUpdate()
            ->get()
            ->keyBy('id');
        abort_unless($users->get(Auth::id())?->isAdmin() === true, 403);
        $lockedTarget = $users->get($target->id);
        abort_unless($lockedTarget instanceof User, 404);

        return $lockedTarget;
    }

}
