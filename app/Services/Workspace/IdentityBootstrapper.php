<?php

namespace App\Services\Workspace;

use App\DTO\Workspace\WorkspaceMutationData;
use App\Models\User;
use App\Models\Workspace;
use App\Services\Workspace\Identity\IdentityMutex;
use App\Services\Workspace\Identity\IdentityRows;
use App\Services\Workspace\Identity\IdentityTransaction;
use App\Services\Workspace\Identity\WorkspaceMembershipStore;
use App\Support\IdentityEmail;

final class IdentityBootstrapper
{
    public function __construct(
        private readonly IdentityTransaction $transactions,
        private readonly IdentityMutex $mutex,
        private readonly IdentityRows $rows,
        private readonly WorkspaceMembershipStore $memberships,
        private readonly WorkspaceProvisioner $workspaces,
    ) {}

    public function roleForSelfRegistration(?string $email = null): string
    {
        if ($email !== null) {
            $this->mutex->lock('email:'.IdentityEmail::normalize($email));
        }

        // Once any user exists, self-registrations are always members: skip
        // the global first-admin serialization. Double-checked under the
        // mutex so the very first concurrent registrations stay correct.
        if (User::query()->exists()) {
            return 'member';
        }

        $this->mutex->lock('first-admin');

        // The lock may have waited on a concurrent first registration, so the
        // table can have changed since the fast-path check above.
        return User::query()->exists() ? 'member' : 'admin'; // @phpstan-ignore ternary.alwaysFalse
    }

    /**
     * @return array{user: User, workspace: Workspace}
     */
    public function provisionSafeMode(
        string $name,
        string $email,
        string $password,
        string $workspaceName,
    ): array {
        return $this->transactions->run(function () use ($name, $email, $password, $workspaceName): array {
            $email = IdentityEmail::normalize($email);
            $this->mutex->lock('email:'.$email, 'first-admin', 'safe-mode');
            $admin = User::query()->where('role', 'admin')->orderBy('id')->first();
            $user = $admin
                ?? User::query()->whereRaw('LOWER(email) = LOWER(?)', [$email])->first();

            if ($user === null) {
                $user = User::create([
                    'name' => $name,
                    'email' => $email,
                    'password' => $password,
                    'role' => 'admin',
                    'can_create_workspace' => true,
                ]);
            }

            $this->mutex->lock('personal-workspace:'.$user->id);
            $lockedUser = $this->rows->users([$user->id])->firstOrFail();
            if ($admin === null) {
                $lockedUser->forceFill([
                    'role' => 'admin',
                    'can_create_workspace' => true,
                ])->save();
            }
            $workspace = Workspace::query()->orderBy('id')->first();

            if ($workspace === null) {
                $workspace = $this->workspaces->ensureOwned(
                    $lockedUser,
                    WorkspaceMutationData::named($workspaceName),
                    enforceLimit: false,
                );
            } else {
                $lockedWorkspace = $this->rows->workspaces([$workspace->id])->firstOrFail();
                $this->memberships->upsert($lockedWorkspace->id, $lockedUser->id, 'admin');
                if ($lockedWorkspace->owner_id === null) {
                    $lockedWorkspace->forceFill(['owner_id' => $lockedUser->id])->save();
                }
                $workspace = $lockedWorkspace;
            }

            return [
                'user' => $lockedUser->refresh(),
                'workspace' => $workspace->refresh(),
            ];
        });
    }
}
