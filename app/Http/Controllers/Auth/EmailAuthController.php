<?php

namespace App\Http\Controllers\Auth;

use App\DTO\Workspace\WorkspaceMutationData;
use App\Http\Controllers\Controller;
use App\Models\EmailAuthChallenge;
use App\Models\RegistrationRequest;
use App\Models\Setting;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceInvitation;
use App\Services\Auth\EmailAuthChallengeService;
use App\Services\Auth\RegistrationRequestSubmissionService;
use App\Services\Workspace\IdentityBootstrapper;
use App\Services\Workspace\WorkspaceInvitationManager;
use App\Services\Workspace\WorkspaceProvisioner;
use App\Support\IdentityEmail;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class EmailAuthController extends Controller
{
    public function __construct(
        private readonly IdentityBootstrapper $identityBootstrapper,
        private readonly WorkspaceInvitationManager $workspaceInvitations,
        private readonly WorkspaceProvisioner $workspaceProvisioner,
        private readonly RegistrationRequestSubmissionService $registrationRequests,
    ) {}

    public function requestCode(Request $request, EmailAuthChallengeService $challenges): JsonResponse
    {
        abort_unless(Setting::magicLinkEnabled(), 404);

        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'intent' => ['required', Rule::in(['login', 'register'])],
            'name' => ['nullable', 'string', 'max:255', Rule::requiredIf($request->input('intent') === 'register')],
            'invitation_token' => ['nullable', 'string', 'max:255'],
            'remember' => ['sometimes', 'boolean'],
        ]);

        $email = IdentityEmail::normalize($validated['email']);
        $invitation = $this->invitation($validated['invitation_token'] ?? null);

        if ($invitation && ! hash_equals(Str::lower($invitation->email), $email)) {
            throw ValidationException::withMessages([
                'email' => 'Use the email address that received this invitation.',
            ]);
        }

        if ($validated['intent'] === 'register'
            && ! $invitation
            && User::query()->exists()
            && ! Setting::invitationRequestsEnabled()) {
            throw ValidationException::withMessages([
                'email' => 'Invitation requests are disabled.',
            ]);
        }

        $intended = $this->safeInternalPath(
            $request->session()->get('url.intended')
        );

        $challenge = $challenges->issue(
            email: $email,
            intent: $validated['intent'],
            context: array_filter([
                'name' => isset($validated['name']) ? trim($validated['name']) : null,
                'invitation_token' => $invitation?->token,
                'redirect_path' => $intended,
                'remember' => $validated['intent'] === 'login'
                    ? true
                    : (bool) ($validated['remember'] ?? false),
            ]),
            ipAddress: $request->ip(),
        );

        return response()->json([
            'challenge_id' => $challenge->id,
            'email' => $challenge->email,
            'expires_at' => $challenge->expires_at,
            'resend_after_seconds' => $challenges->resendAfterSeconds(),
        ]);
    }

    public function verify(
        Request $request,
        EmailAuthChallengeService $challenges,
    ): JsonResponse {
        abort_unless(Setting::magicLinkEnabled(), 404);

        $validated = $request->validate([
            'challenge_id' => ['required', 'uuid'],
            'code' => ['required', 'digits:6'],
        ]);

        $challenge = EmailAuthChallenge::query()->findOrFail($validated['challenge_id']);
        abort_unless($challenge instanceof EmailAuthChallenge, 404);
        $challenge = $challenges->consumePin($challenge, $validated['code']);

        return response()->json([
            'redirect' => $this->complete($request, $challenge),
        ]);
    }

    public function magic(
        Request $request,
        EmailAuthChallenge $challenge,
        string $token,
        EmailAuthChallengeService $challenges,
    ): RedirectResponse {
        if (! Setting::magicLinkEnabled()) {
            return redirect()->route('login')->withErrors([
                'email' => 'Email sign-in is currently disabled.',
            ]);
        }

        try {
            $challenge = $challenges->consumeToken($challenge, $token);

            return redirect()->to($this->complete($request, $challenge));
        } catch (ValidationException $exception) {
            return redirect()->route('login')->withErrors($exception->errors());
        }
    }

    private function complete(Request $request, EmailAuthChallenge $challenge): string
    {
        /** @var array<string, mixed> $context */
        $context = $challenge->context ?? [];
        $invitationToken = $context['invitation_token'] ?? null;
        $invitation = $this->invitation(is_string($invitationToken) ? $invitationToken : null);

        if (! empty($context['invitation_token']) && ! $invitation) {
            throw ValidationException::withMessages([
                'email' => 'This workspace invitation has expired or is no longer available.',
            ]);
        }

        if ($challenge->intent === 'register' && ! $invitation && User::query()->exists()) {
            if (! Setting::invitationRequestsEnabled()) {
                throw ValidationException::withMessages([
                    'email' => 'Invitation requests are disabled.',
                ]);
            }

            $name = $context['name'] ?? '';
            $this->registrationRequests->submit(
                is_string($name) ? $name : '',
                $challenge->email,
                RegistrationRequest::ORIGIN_EMAIL,
                emailVerifiedAt: now(),
            );

            return route('register', ['submitted' => 1], absolute: false);
        }

        try {
            [$user, $workspace] = DB::transaction(function () use ($challenge, $context, $invitation): array {
                $this->identityBootstrapper->roleForSelfRegistration($challenge->email);
                $user = User::query()
                    ->whereRaw('LOWER(email) = LOWER(?)', [$challenge->email])
                    ->first();

                if (! $user && $challenge->intent === 'login') {
                    throw ValidationException::withMessages([
                        'email' => 'No account exists for this email.',
                    ]);
                }

                if (! $user) {
                    if (! $invitation && User::query()->exists()) {
                        throw ValidationException::withMessages([
                            'email' => 'A valid workspace invitation is required.',
                        ]);
                    }

                    $user = $this->createUser($challenge, $context);
                } elseif (! $user->email_verified_at) {
                    $user->forceFill(['email_verified_at' => now()])->save();
                }

                $workspace = $this->resolveWorkspace($user, $challenge, $invitation, $context);

                return [$user, $workspace];
            }, 3);
        } catch (UniqueConstraintViolationException $exception) {
            if (! str_contains($exception->getMessage(), 'users_email')) {
                throw $exception;
            }

            throw ValidationException::withMessages([
                'email' => 'An account already exists for this email address.',
            ]);
        }

        $redirect = $this->safeInternalPath($context['redirect_path'] ?? null) ?? route('dashboard', absolute: false);
        $remember = ($context['remember'] ?? false) === true;
        $request->session()->put('url.intended', $redirect);

        if (! config('app.safe_mode') && $user->hasTwoFactorEnabled()) {
            $request->session()->put('login.id', $user->id);
            $request->session()->put('login.remember', $remember);
            $request->session()->put('login.workspace_id', $workspace?->id);
            $request->session()->put('login.two_factor_attempts', 0);

            return route('two-factor.challenge');
        }

        Auth::login($user, $remember);
        $request->session()->regenerate();
        if ($workspace) {
            session(['current_workspace_id' => $workspace->id]);
        } else {
            session()->forget('current_workspace_id');
        }
        $user->rememberWorkspace($workspace);

        $intended = $request->session()->pull('url.intended', route('dashboard', absolute: false));

        return is_string($intended) ? $intended : route('dashboard', absolute: false);
    }

    /**
     * @param  array<string, mixed>  $context
     */
    private function createUser(EmailAuthChallenge $challenge, array $context): User
    {
        $emailName = Str::of(Str::before($challenge->email, '@'))
            ->replace(['.', '_', '-'], ' ')
            ->title()
            ->toString();

        $contextName = $context['name'] ?? '';
        $user = User::create([
            'name' => trim(is_string($contextName) ? $contextName : '') ?: $emailName,
            'email' => $challenge->email,
            'password' => Str::random(64),
            'role' => $this->identityBootstrapper->roleForSelfRegistration(),
        ]);

        $user->forceFill(['email_verified_at' => now()])->save();

        return $user;
    }

    /**
     * @param  array<string, mixed>  $context
     */
    private function resolveWorkspace(
        User $user,
        EmailAuthChallenge $challenge,
        ?WorkspaceInvitation $invitation,
        array $context,
    ): ?Workspace {
        if ($invitation) {
            if (! hash_equals(Str::lower($invitation->email), $challenge->email)) {
                throw ValidationException::withMessages([
                    'email' => 'This invitation does not match the verified email.',
                ]);
            }

            return $this->workspaceInvitations->consume($invitation, $user);
        }

        $requestedWorkspaceId = $context['workspace_id'] ?? null;
        if (is_string($requestedWorkspaceId) && $requestedWorkspaceId !== '') {
            $requestedWorkspace = Workspace::find($requestedWorkspaceId);
            if (! $requestedWorkspace
                || (! $user->isAdmin() && ! $user->belongsToWorkspace($requestedWorkspace))) {
                throw ValidationException::withMessages([
                    'email' => 'The requested workspace is no longer available.',
                ]);
            }

            return $requestedWorkspace;
        }

        $existing = $user->preferredWorkspace();
        if ($existing) {
            return $existing;
        }

        if (! $user->isAdmin() && ! $user->can_create_workspace) {
            return null;
        }

        $workspaceName = $user->name."'s Workspace";

        return $this->workspaceProvisioner->ensureOwned(
            $user,
            WorkspaceMutationData::named(
                $workspaceName,
                Str::slug($workspaceName).'-'.$user->id,
            ),
            $user,
            enforceLimit: true,
        );
    }

    private function invitation(?string $token): ?WorkspaceInvitation
    {
        if (! $token) {
            return null;
        }

        return WorkspaceInvitation::query()
            ->with('workspace')
            ->where('token', $token)
            ->where('expires_at', '>', now())
            ->first();
    }

    private function safeInternalPath(mixed $path): ?string
    {
        if (! is_string($path) || ! str_starts_with($path, '/') || str_starts_with($path, '//')) {
            return null;
        }

        return $path;
    }
}
