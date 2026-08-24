<?php

namespace App\Services\Auth;

use App\Models\User;
use App\Models\Workspace;
use App\Services\Workspace\Identity\IdentityMutex;
use App\Services\Workspace\Identity\IdentityRows;
use App\Services\Workspace\IdentityBootstrapper;
use App\Services\Workspace\WorkspaceMembershipManager;
use App\Services\Workspace\WorkspaceProvisioner;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class SafeModeAuthenticator
{
    private const SAFE_MODE_EMAIL = 'safe-mode@puppetflow.local';

    private const SAFE_MODE_WORKSPACE = 'Safe Mode Workspace';

    public function __construct(
        private readonly IdentityBootstrapper $identityBootstrapper,
        private readonly IdentityMutex $identityMutex,
        private readonly IdentityRows $identityRows,
        private readonly WorkspaceMembershipManager $workspaceMemberships,
        private readonly WorkspaceProvisioner $workspaceProvisioner,
    ) {}

    public function authenticate(Request $request): ?User
    {
        if (! config('app.safe_mode')) {
            return null;
        }

        $identity = $this->identityBootstrapper->provisionSafeMode(
            'Safe Mode Admin',
            self::SAFE_MODE_EMAIL,
            Hash::make(Str::random(64)),
            self::SAFE_MODE_WORKSPACE,
        );
        $user = $identity['user'];

        if (Auth::id() !== $user->id) {
            Auth::login($user);
            $request->session()->regenerate();
        }

        session(['current_workspace_id' => $identity['workspace']->id]);

        return $user;
    }

    public function deleteSafeModeUser(): void
    {
        if (config('app.safe_mode')) {
            return;
        }

        $deletedUserId = DB::transaction(function (): ?string {
            $this->identityMutex->lock(
                'email:'.self::SAFE_MODE_EMAIL,
                'first-admin',
                'safe-mode',
            );
            $user = User::where('email', self::SAFE_MODE_EMAIL)->first();

            if (! $user) {
                return null;
            }

            $ownedWorkspaces = Workspace::query()
                ->where('owner_id', $user->id)
                ->orderBy('id')
                ->get();
            /** @var list<string> $ownedWorkspaceIds */
            $ownedWorkspaceIds = $ownedWorkspaces->pluck('id')->all();
            /** @var list<string> $successorIds */
            $successorIds = User::query()
                ->join('user_workspace', 'user_workspace.user_id', '=', 'users.id')
                ->whereIn('user_workspace.workspace_id', $ownedWorkspaceIds)
                ->where('users.id', '!=', $user->id)
                ->pluck('users.id')
                ->all();
            $this->identityRows->users([$user->id, ...$successorIds]);
            $lockedWorkspaces = $this->identityRows
                ->workspaces($ownedWorkspaceIds)
                ->keyBy('id');

            foreach ($ownedWorkspaces as $ownedWorkspace) {
                /** @var Workspace $lockedWorkspace */
                $lockedWorkspace = $lockedWorkspaces->get($ownedWorkspace->id);
                if ($lockedWorkspace->owner_id !== $user->id) {
                    continue;
                }
                $successor = User::query()
                    ->select('users.*')
                    ->join('user_workspace', 'user_workspace.user_id', '=', 'users.id')
                    ->where('user_workspace.workspace_id', $lockedWorkspace->id)
                    ->where('users.id', '!=', $user->id)
                    ->orderByRaw("CASE WHEN user_workspace.role = 'admin' THEN 0 ELSE 1 END")
                    ->orderBy('users.id')
                    ->first();

                if ($successor) {
                    $this->workspaceProvisioner->transferOwnership($lockedWorkspace, $successor);
                } else {
                    $lockedWorkspace->delete();
                }
            }

            $this->workspaceMemberships->prepareUserDeletion($user);
            $user->delete();

            return $user->id;
        }, 3);

        if ($deletedUserId !== null
            && ! app()->runningInConsole()
            && Auth::id() === $deletedUserId) {
            Auth::logout();
            session()->forget('current_workspace_id');
        }
    }
}
