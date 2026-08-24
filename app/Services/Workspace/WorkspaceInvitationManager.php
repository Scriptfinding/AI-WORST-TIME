<?php

namespace App\Services\Workspace;

use App\Enums\Authorization\Ability;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceInvitation;
use App\Models\WorkspaceTeam;
use App\Services\Workspace\Identity\IdentityMutex;
use App\Services\Workspace\Identity\IdentityRows;
use App\Services\Workspace\Identity\IdentityTransaction;
use App\Services\Workspace\Identity\WorkspaceIdentityRules;
use App\Services\Workspace\Identity\WorkspaceMembershipStore;
use App\Services\Workspace\Identity\WorkspaceMutationAuthorizer;
use App\Support\IdentityEmail;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class WorkspaceInvitationManager
{
    public function __construct(
        private readonly IdentityTransaction $transactions,
        private readonly IdentityMutex $mutex,
        private readonly IdentityRows $rows,
        private readonly WorkspaceMembershipStore $memberships,
        private readonly WorkspaceIdentityRules $rules,
        private readonly WorkspaceMutationAuthorizer $authorizer,
    ) {}

    public function inviteOrAttach(
        Workspace $workspace,
        string $email,
        string $role,
        User $inviter,
        ?bool $canCreateWorkspace = null,
        ?User $actor = null,
        ?WorkspaceTeam $team = null,
    ): User|WorkspaceInvitation {
        return $this->transactions->run(function () use (
            $workspace,
            $email,
            $role,
            $inviter,
            $canCreateWorkspace,
            $actor,
            $team,
        ): User|WorkspaceInvitation {
            $email = IdentityEmail::normalize($email);
            $role = $this->rules->role($role);
            $this->mutex->lock('email:'.$email);
            $user = User::query()->whereRaw('LOWER(email) = LOWER(?)', [$email])->first();
            $lockedUsers = $this->rows->users([
                ($actor ?? $inviter)->id,
                $inviter->id,
                $user?->id,
            ])->keyBy('id');
            $lockedWorkspace = $this->rows->workspaces([$workspace->id])->firstOrFail();
            /** @var User $lockedActor */
            $lockedActor = $lockedUsers->get(($actor ?? $inviter)->id);
            /** @var User $lockedInviter */
            $lockedInviter = $lockedUsers->get($inviter->id);
            $lockedTeam = $team === null
                ? null
                : WorkspaceTeam::query()
                    ->whereKey($team->id)
                    ->where('workspace_id', $lockedWorkspace->id)
                    ->lockForUpdate()
                    ->firstOrFail();
            $currentRole = $user === null
                ? null
                : $this->memberships->role($lockedWorkspace->id, $user->id);

            if ($lockedTeam instanceof WorkspaceTeam) {
                $this->authorizer->teamMembership(
                    $lockedActor,
                    $lockedWorkspace,
                    $lockedTeam,
                    $role,
                    [$currentRole],
                    allowMemberProvisioning: true,
                );
            } else {
                $this->authorizer->membership($lockedActor, $lockedWorkspace, $role);
            }

            if ($user !== null) {
                $lockedTarget = $lockedUsers->get($user->id);
                if (! $lockedTarget instanceof User) {
                    throw ValidationException::withMessages([
                        'email' => 'The account no longer exists.',
                    ]);
                }
                if (IdentityEmail::normalize($lockedTarget->email) !== $email) {
                    throw ValidationException::withMessages([
                        'email' => 'The account email changed concurrently. Retry the operation.',
                    ]);
                }

                if ($currentRole !== null && $lockedTeam === null) {
                    throw ValidationException::withMessages([
                        'email' => 'This user is already a member of this workspace.',
                    ]);
                }

                if ($currentRole === null) {
                    $this->memberships->insert($lockedWorkspace->id, $lockedTarget->id, $role);
                }
                if ($lockedTeam instanceof WorkspaceTeam) {
                    $this->memberships->insertTeam($lockedTeam->id, $lockedWorkspace->id, $lockedTarget->id);
                }
                if ($lockedInviter->isAdmin() && $canCreateWorkspace !== null) {
                    $lockedTarget->forceFill(['can_create_workspace' => $canCreateWorkspace])->save();
                }

                return $lockedTarget->refresh();
            }

            $attributes = [
                'invited_by' => $lockedInviter->id,
                'team_id' => $lockedTeam?->id,
                'role' => $role,
                'expires_at' => now()->addDays(7),
            ];
            if ($lockedTeam instanceof WorkspaceTeam) {
                $attributes['can_create_workspace'] = false;
            } elseif ($lockedInviter->isAdmin() && $canCreateWorkspace !== null) {
                $attributes['can_create_workspace'] = $canCreateWorkspace;
            }
            $existing = WorkspaceInvitation::query()
                ->where('workspace_id', $lockedWorkspace->id)
                ->whereRaw('LOWER(email) = LOWER(?)', [$email])
                ->lockForUpdate()
                ->first();

            if ($existing !== null) {
                if ($lockedTeam instanceof WorkspaceTeam && $existing->team_id !== $lockedTeam->id) {
                    throw ValidationException::withMessages([
                        'email' => 'An invitation already exists for this email outside this team.',
                    ]);
                }
                $existing->forceFill($attributes)->save();

                return $existing->refresh();
            }

            return WorkspaceInvitation::create([
                'workspace_id' => $lockedWorkspace->id,
                'email' => $email,
                ...$attributes,
                'can_create_workspace' => $attributes['can_create_workspace'] ?? true,
                'token' => Str::random(64),
            ]);
        });
    }

    public function consume(
        WorkspaceInvitation $invitation,
        User $user,
        ?User $actor = null,
        ?string $roleOverride = null,
    ): Workspace {
        return $this->transactions->run(
            fn (): Workspace => $this->consumeLocked($invitation, $user, $actor, $roleOverride),
        );
    }

    public function submitRegistration(
        WorkspaceInvitation $invitation,
        string $name,
        ?string $password,
        bool $emailVerified = false,
    ): WorkspaceInvitation {
        return $this->transactions->run(function () use ($invitation, $name, $password, $emailVerified): WorkspaceInvitation {
            $lockedInvitation = WorkspaceInvitation::query()
                ->whereKey($invitation->id)
                ->where('expires_at', '>', now())
                ->lockForUpdate()
                ->firstOrFail();

            $attributes = [
                'registration_name' => trim($name),
                'registration_submitted_at' => now(),
            ];

            if ($password !== null) {
                $attributes['registration_password'] = Hash::make($password);
            }
            if ($emailVerified) {
                $attributes['registration_email_verified_at'] = now();
            }

            $lockedInvitation->forceFill($attributes)->save();

            return $lockedInvitation->refresh();
        });
    }

    /**
     * @return array{user: User, created: bool, workspace: Workspace}
     */
    public function provisionUser(
        WorkspaceInvitation $invitation,
        ?User $actor = null,
        ?string $roleOverride = null,
    ): array {
        try {
            return $this->transactions->run(function () use (
                $invitation,
                $actor,
                $roleOverride,
            ): array {
                $email = IdentityEmail::normalize($invitation->email);
                $this->mutex->lock('email:'.$email);
                $existing = User::query()->whereRaw('LOWER(email) = LOWER(?)', [$email])->first();

                if ($existing !== null) {
                    return [
                        'user' => $existing,
                        'created' => false,
                        'workspace' => $this->consumeLocked($invitation, $existing, $actor, $roleOverride),
                    ];
                }

                $lockedUsers = $this->rows->users([$actor?->id])->keyBy('id');
                $lockedWorkspace = $this->rows->workspaces([$invitation->workspace_id])->firstOrFail();
                $lockedInvitation = WorkspaceInvitation::query()
                    ->whereKey($invitation->id)
                    ->where('workspace_id', $lockedWorkspace->id)
                    ->where('expires_at', '>', now())
                    ->whereNotNull('registration_submitted_at')
                    ->lockForUpdate()
                    ->firstOrFail();
                /** @var User|null $lockedActor */
                $lockedActor = $actor === null ? null : $lockedUsers->get($actor->id);
                $role = $this->rules->role($roleOverride ?? $lockedInvitation->role);
                $lockedTeam = $this->lockedInvitationTeam($lockedInvitation, $lockedWorkspace);
                if ($lockedTeam instanceof WorkspaceTeam) {
                    $this->authorizer->teamMembership(
                        $lockedActor,
                        $lockedWorkspace,
                        $lockedTeam,
                        $role,
                        [null],
                        allowMemberProvisioning: true,
                    );
                } else {
                    $this->authorizer->membership($lockedActor, $lockedWorkspace, $role);
                }

                if (IdentityEmail::normalize($lockedInvitation->email) !== $email) {
                    throw ValidationException::withMessages([
                        'email' => 'The invitation email changed concurrently. Retry the operation.',
                    ]);
                }

                $user = User::create([
                    'name' => $lockedInvitation->registration_name,
                    'email' => $email,
                    'password' => $lockedInvitation->registration_password ?? Str::random(64),
                    'role' => 'member',
                    'can_create_workspace' => $lockedInvitation->can_create_workspace,
                ]);
                if ($lockedInvitation->registration_email_verified_at !== null) {
                    $user->forceFill([
                        'email_verified_at' => $lockedInvitation->registration_email_verified_at,
                    ])->save();
                }
                $this->memberships->insert($lockedWorkspace->id, $user->id, $role);
                if ($lockedTeam instanceof WorkspaceTeam) {
                    $this->memberships->insertTeam($lockedTeam->id, $lockedWorkspace->id, $user->id);
                }
                $lockedInvitation->delete();

                return [
                    'user' => $user,
                    'created' => true,
                    'workspace' => $lockedWorkspace,
                ];
            });
        } catch (UniqueConstraintViolationException $exception) {
            if (! str_contains($exception->getMessage(), 'users_email')) {
                throw $exception;
            }

            $user = User::query()
                ->whereRaw('LOWER(email) = LOWER(?)', [$invitation->email])
                ->firstOrFail();

            return [
                'user' => $user,
                'created' => false,
                'workspace' => $this->consume($invitation, $user, $actor, $roleOverride),
            ];
        }
    }

    public function renew(WorkspaceInvitation $invitation, ?User $actor = null): WorkspaceInvitation
    {
        return $this->transactions->run(function () use ($invitation, $actor): WorkspaceInvitation {
            $lockedUsers = $this->rows->users([$actor?->id])->keyBy('id');
            $lockedWorkspace = $this->rows->workspaces([$invitation->workspace_id])->firstOrFail();
            /** @var User|null $lockedActor */
            $lockedActor = $actor === null ? null : $lockedUsers->get($actor->id);
            $lockedInvitation = WorkspaceInvitation::query()
                ->whereKey($invitation->id)
                ->where('workspace_id', $lockedWorkspace->id)
                ->lockForUpdate()
                ->firstOrFail();
            $lockedTeam = $this->lockedInvitationTeam($lockedInvitation, $lockedWorkspace);
            if ($lockedTeam instanceof WorkspaceTeam) {
                $this->authorizer->teamMembership($lockedActor, $lockedWorkspace, $lockedTeam);
            } else {
                $this->authorizer->workspace($lockedActor, Ability::MANAGE_MEMBERS, $lockedWorkspace);
            }
            $lockedInvitation->forceFill(['expires_at' => now()->addDays(7)])->save();

            return $lockedInvitation->refresh();
        });
    }

    public function cancel(WorkspaceInvitation $invitation, ?User $actor = null): void
    {
        $this->transactions->run(function () use ($invitation, $actor): void {
            $lockedUsers = $this->rows->users([$actor?->id])->keyBy('id');
            $lockedWorkspace = $this->rows->workspaces([$invitation->workspace_id])->firstOrFail();
            /** @var User|null $lockedActor */
            $lockedActor = $actor === null ? null : $lockedUsers->get($actor->id);
            $lockedInvitation = WorkspaceInvitation::query()
                ->whereKey($invitation->id)
                ->where('workspace_id', $lockedWorkspace->id)
                ->lockForUpdate()
                ->firstOrFail();
            $lockedTeam = $this->lockedInvitationTeam($lockedInvitation, $lockedWorkspace);
            if ($lockedTeam instanceof WorkspaceTeam) {
                $this->authorizer->teamMembership($lockedActor, $lockedWorkspace, $lockedTeam);
            } else {
                $this->authorizer->workspace($lockedActor, Ability::MANAGE_MEMBERS, $lockedWorkspace);
            }
            $lockedInvitation->delete();
        });
    }

    private function consumeLocked(
        WorkspaceInvitation $invitation,
        User $user,
        ?User $actor,
        ?string $roleOverride,
    ): Workspace {
        $email = IdentityEmail::normalize($invitation->email);
        $this->mutex->lock('email:'.$email);
        $lockedUsers = $this->rows->users([$actor?->id, $user->id])->keyBy('id');
        $lockedWorkspace = $this->rows->workspaces([$invitation->workspace_id])->firstOrFail();
        $lockedInvitation = WorkspaceInvitation::query()
            ->whereKey($invitation->id)
            ->where('workspace_id', $lockedWorkspace->id)
            ->where('expires_at', '>', now())
            ->lockForUpdate()
            ->firstOrFail();
        $role = $this->rules->role($roleOverride ?? $lockedInvitation->role);
        /** @var User $lockedUser */
        $lockedUser = $lockedUsers->get($user->id);
        /** @var User|null $lockedActor */
        $lockedActor = $actor === null ? null : $lockedUsers->get($actor->id);
        $currentRole = $this->memberships->role($lockedWorkspace->id, $lockedUser->id);
        $lockedTeam = $this->lockedInvitationTeam($lockedInvitation, $lockedWorkspace);
        if ($lockedTeam instanceof WorkspaceTeam) {
            $this->authorizer->teamMembership(
                $lockedActor,
                $lockedWorkspace,
                $lockedTeam,
                $role,
                [$currentRole],
                allowMemberProvisioning: true,
            );
        } else {
            $this->authorizer->membership($lockedActor, $lockedWorkspace, $role, $currentRole);
        }

        if (! User::query()
            ->whereKey($lockedUser->id)
            ->whereRaw('LOWER(email) = LOWER(?)', [$lockedInvitation->email])
            ->exists()) {
            throw ValidationException::withMessages([
                'email' => 'This invitation was issued for a different email address.',
            ]);
        }

        $this->rules->ownerRemainsAdmin($lockedWorkspace, $lockedUser->id, $role);
        $this->rules->adminChangeIsSafe(
            $lockedWorkspace->id,
            $lockedUser->id,
            $currentRole,
            $role,
        );
        $this->memberships->upsert($lockedWorkspace->id, $lockedUser->id, $role);
        if ($lockedTeam instanceof WorkspaceTeam) {
            $this->memberships->insertTeam($lockedTeam->id, $lockedWorkspace->id, $lockedUser->id);
        }

        if (! $lockedInvitation->can_create_workspace) {
            $lockedUser->forceFill(['can_create_workspace' => false])->save();
        }

        $lockedInvitation->delete();

        return $lockedWorkspace;
    }

    private function lockedInvitationTeam(
        WorkspaceInvitation $invitation,
        Workspace $workspace,
    ): ?WorkspaceTeam {
        if ($invitation->team_id === null) {
            return null;
        }

        return WorkspaceTeam::query()
            ->whereKey($invitation->team_id)
            ->where('workspace_id', $workspace->id)
            ->lockForUpdate()
            ->firstOrFail();
    }
}
