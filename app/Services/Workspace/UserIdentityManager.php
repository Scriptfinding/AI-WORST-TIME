<?php

namespace App\Services\Workspace;

use App\Exceptions\Workspace\RetryIdentityMutation;
use App\Models\User;
use App\Models\WorkspaceInvitation;
use App\Services\Workspace\Identity\IdentityMutex;
use App\Services\Workspace\Identity\IdentityRows;
use App\Services\Workspace\Identity\IdentityTransaction;
use App\Support\IdentityEmail;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class UserIdentityManager
{
    public function __construct(
        private readonly IdentityTransaction $transactions,
        private readonly IdentityMutex $mutex,
        private readonly IdentityRows $rows,
    ) {}

    public function changeEmail(User $user, string $email, ?User $actor = null): User
    {
        $email = IdentityEmail::normalize($email);

        try {
            for ($attempt = 1; $attempt <= 3; $attempt++) {
                $freshUser = User::query()->findOrFail($user->id);
                $expectedEmail = IdentityEmail::normalize($freshUser->email);

                try {
                    return $this->transactions->run(function () use (
                        $user,
                        $email,
                        $actor,
                        $expectedEmail,
                    ): User {
                        $this->mutex->lock('email:'.$expectedEmail, 'email:'.$email);
                        $lockedUsers = $this->rows->users([$actor?->id, $user->id])->keyBy('id');
                        $lockedUser = $lockedUsers->get($user->id);
                        if (! $lockedUser instanceof User) {
                            throw (new \Illuminate\Database\Eloquent\ModelNotFoundException)
                                ->setModel(User::class, [$user->id]);
                        }
                        /** @var User|null $lockedActor */
                        $lockedActor = $actor === null ? null : $lockedUsers->get($actor->id);
                        $previousEmail = IdentityEmail::normalize($lockedUser->email);

                        if ($previousEmail !== $expectedEmail) {
                            throw new RetryIdentityMutation;
                        }

                        if ($lockedActor !== null
                            && $lockedActor->id !== $lockedUser->id
                            && ! $lockedActor->isAdmin()) {
                            throw new AuthorizationException;
                        }

                        $lockedUser->forceFill([
                            'email' => $email,
                            'email_verified_at' => $previousEmail === $email
                                ? $lockedUser->email_verified_at
                                : null,
                        ])->save();

                        if ($previousEmail !== $email) {
                            WorkspaceInvitation::query()
                                ->whereIn('workspace_id', DB::table('user_workspace')
                                    ->select('workspace_id')
                                    ->where('user_id', $lockedUser->id))
                                ->where(function ($query) use ($previousEmail, $email): void {
                                    $query->whereRaw('LOWER(email) = LOWER(?)', [$previousEmail])
                                        ->orWhereRaw('LOWER(email) = LOWER(?)', [$email]);
                                })
                                ->delete();
                        }

                        return $lockedUser->refresh();
                    });
                } catch (RetryIdentityMutation) {
                    if (DB::transactionLevel() > 0 || $attempt === 3) {
                        throw ValidationException::withMessages([
                            'email' => 'The account email changed concurrently. Retry the operation.',
                        ]);
                    }
                }
            }
        } catch (UniqueConstraintViolationException $exception) {
            if (! str_contains($exception->getMessage(), 'users_email')) {
                throw $exception;
            }

            throw ValidationException::withMessages([
                'email' => 'The email has already been taken.',
            ]);
        }

        throw new \LogicException('Identity email retry loop exhausted.');
    }
}
