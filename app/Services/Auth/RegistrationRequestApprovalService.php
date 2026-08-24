<?php

namespace App\Services\Auth;

use App\Events\RegistrationRequestApproved;
use App\Models\RegistrationRequest;
use App\Models\User;
use App\Models\Workspace;
use App\Services\Workspace\WorkspaceMembershipManager;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class RegistrationRequestApprovalService
{
    public function __construct(
        private readonly WorkspaceMembershipManager $memberships,
    ) {}

    /**
     * @param array<string, string> $workspaceMemberships
     */
    public function approve(
        RegistrationRequest $registrationRequest,
        array $workspaceMemberships,
        User $actor,
        bool $crossWorkspace = false,
    ): User {
        return DB::transaction(function () use (
            $registrationRequest,
            $workspaceMemberships,
            $actor,
            $crossWorkspace,
        ): User {
            $pending = RegistrationRequest::query()
                ->whereKey($registrationRequest->id)
                ->lockForUpdate()
                ->firstOrFail();
            abort_if(
                User::query()->whereRaw('LOWER(email) = LOWER(?)', [$pending->email])->exists(),
                409,
                'An account already exists for this email.',
            );

            $user = User::create([
                'name' => $pending->name,
                'email' => $pending->email,
                'password' => $pending->password ?? Str::random(64),
                'role' => 'member',
                'can_create_workspace' => false,
            ]);
            if ($pending->email_verified_at !== null) {
                $user->forceFill(['email_verified_at' => $pending->email_verified_at])->save();
            }

            RegistrationRequestApproved::dispatch($pending, $user);

            if ($crossWorkspace) {
                $this->memberships->replace($user, $workspaceMemberships, $actor);
            } else {
                foreach ($workspaceMemberships as $workspaceId => $role) {
                    $workspace = Workspace::query()->findOrFail($workspaceId);
                    $this->memberships->attach($workspace, $user, $role, $actor);
                }
            }

            $pending->delete();

            return $user->refresh();
        }, 3);
    }

    public function reject(RegistrationRequest $registrationRequest): void
    {
        DB::transaction(function () use ($registrationRequest): void {
            RegistrationRequest::query()
                ->whereKey($registrationRequest->id)
                ->lockForUpdate()
                ->firstOrFail()
                ->delete();
        }, 3);
    }
}
