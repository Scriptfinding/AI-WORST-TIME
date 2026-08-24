<?php

namespace App\Services\Sso;

use App\Models\IdentityProvider;
use App\Models\RegistrationRequest;
use App\Models\SsoRegistrationRequest;
use App\Models\User;
use App\Models\UserExternalIdentity;
use App\Models\Workspace;
use App\Services\Auth\RegistrationRequestSubmissionService;
use App\Services\Workspace\WorkspaceMembershipManager;
use App\Support\IdentityEmail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class ExternalIdentityResolver
{
    public function __construct(
        private readonly WorkspaceMembershipManager $memberships,
        private readonly RegistrationRequestSubmissionService $registrationRequests,
    ) {}

    public function resolve(
        IdentityProvider $provider,
        string $subject,
        string $email,
        string $name,
    ): ?User {
        $email = IdentityEmail::normalize($email);
        $subjectHash = hash('sha256', $subject);

        return DB::transaction(function () use ($provider, $subject, $subjectHash, $email, $name): ?User {
            $identity = UserExternalIdentity::query()
                ->where('identity_provider_id', $provider->id)
                ->where('external_subject_hash', $subjectHash)
                ->lockForUpdate()
                ->first();

            if ($identity !== null) {
                abort_unless(hash_equals($identity->external_subject, $subject), 409, 'Identity subject collision.');
                $identity->update(['email_snapshot' => $email]);

                return $identity->user()->firstOrFail();
            }

            if (! $provider->jit_enabled) {
                throw ValidationException::withMessages([
                    'sso' => 'This identity is not linked to a Puppetflow account.',
                ]);
            }

            if (User::query()->whereRaw('LOWER(email) = LOWER(?)', [$email])->exists()) {
                throw ValidationException::withMessages([
                    'sso' => 'An account already uses this email. Sign in locally and link this identity from your profile.',
                ]);
            }

            if ($provider->configString('provisioning_mode', 'auto_join') === 'approval') {
                $this->requestApproval($provider, $subject, $subjectHash, $email, $name);

                return null;
            }

            $rawWorkspaceIds = $provider->configArray()['workspace_ids'] ?? [];
            if (! is_array($rawWorkspaceIds)) {
                $rawWorkspaceIds = [];
            }
            /** @var array<int, mixed> $rawWorkspaceIds */
            $workspaceIds = collect($rawWorkspaceIds)
                ->filter(fn (mixed $id): bool => is_string($id) && $id !== '')
                ->unique()
                ->values();
            $workspaces = Workspace::query()->whereIn('id', $workspaceIds)->get();
            if ($workspaces->isEmpty()) {
                throw ValidationException::withMessages([
                    'sso' => 'No workspace is configured for this identity provider.',
                ]);
            }

            $user = User::create([
                'name' => trim($name) !== '' ? trim($name) : Str::before($email, '@'),
                'email' => $email,
                'password' => Hash::make(Str::random(64)),
                'role' => 'member',
                'can_create_workspace' => false,
            ]);

            UserExternalIdentity::create([
                'user_id' => $user->id,
                'identity_provider_id' => $provider->id,
                'external_subject' => $subject,
                'email_snapshot' => $email,
            ]);

            foreach ($workspaces as $workspace) {
                $this->memberships->attach($workspace, $user);
            }

            return $user->refresh();
        }, 3);
    }

    private function requestApproval(
        IdentityProvider $provider,
        string $subject,
        string $subjectHash,
        string $email,
        string $name,
    ): void {
        $pendingIdentity = SsoRegistrationRequest::query()
            ->where('identity_provider_id', $provider->id)
            ->where('external_subject_hash', $subjectHash)
            ->first();

        if ($pendingIdentity !== null) {
            $this->registrationRequests->submit(
                trim($name) !== '' ? trim($name) : Str::before($email, '@'),
                $email,
                RegistrationRequest::ORIGIN_SSO,
                emailVerifiedAt: now(),
                existing: $pendingIdentity->registrationRequest()->firstOrFail(),
            );
            $pendingIdentity->update(['external_subject' => $subject]);

            return;
        }

        $registration = $this->registrationRequests->submit(
            trim($name) !== '' ? trim($name) : Str::before($email, '@'),
            $email,
            RegistrationRequest::ORIGIN_SSO,
            emailVerifiedAt: now(),
        );

        SsoRegistrationRequest::query()->updateOrCreate(
            ['registration_request_id' => $registration->id],
            [
                'identity_provider_id' => $provider->id,
                'external_subject' => $subject,
                'external_subject_hash' => $subjectHash,
                'username' => null,
            ],
        );
    }

    public function link(
        User $user,
        IdentityProvider $provider,
        string $subject,
        string $email,
    ): void {
        $email = IdentityEmail::normalize($email);
        if (! hash_equals($user->email, $email)) {
            throw ValidationException::withMessages([
                'sso' => 'The external identity email must match your Puppetflow account email.',
            ]);
        }

        $existing = UserExternalIdentity::query()
            ->where('identity_provider_id', $provider->id)
            ->where('external_subject_hash', hash('sha256', $subject))
            ->first();
        if ($existing !== null && $existing->user_id !== $user->id) {
            throw ValidationException::withMessages([
                'sso' => 'This external identity is already linked to another account.',
            ]);
        }

        UserExternalIdentity::query()->updateOrCreate(
            [
                'user_id' => $user->id,
                'identity_provider_id' => $provider->id,
            ],
            [
                'external_subject' => $subject,
                'email_snapshot' => $email,
            ],
        );
    }
}
