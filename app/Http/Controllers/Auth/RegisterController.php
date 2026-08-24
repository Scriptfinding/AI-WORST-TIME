<?php

namespace App\Http\Controllers\Auth;

use App\DTO\Workspace\WorkspaceMutationData;
use App\Http\Controllers\Controller;
use App\Models\RegistrationRequest;
use App\Models\Setting;
use App\Models\User;
use App\Models\WorkspaceInvitation;
use App\Services\Auth\RegistrationRequestSubmissionService;
use App\Services\Workspace\IdentityBootstrapper;
use App\Services\Workspace\WorkspaceInvitationManager;
use App\Services\Workspace\WorkspaceProvisioner;
use App\Support\IdentityEmail;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RegisterController extends Controller
{
    public function __construct(
        private readonly IdentityBootstrapper $identityBootstrapper,
        private readonly WorkspaceInvitationManager $workspaceInvitations,
        private readonly WorkspaceProvisioner $workspaceProvisioner,
        private readonly RegistrationRequestSubmissionService $registrationRequests,
    ) {}

    public function show(Request $request): Response
    {
        $invitation = null;

        if ($redirect = $request->query('redirect')) {
            if (is_string($redirect) && str_starts_with($redirect, '/') && ! str_starts_with($redirect, '//')) {
                session()->put('url.intended', $redirect);
            }
        }

        if ($request->has('invitation')) {
            $invitation = WorkspaceInvitation::with('workspace:id,name')
                ->where('token', $request->invitation)
                ->where('expires_at', '>', now())
                ->first();
        }

        if (! $invitation
            && ! $request->boolean('submitted')
            && User::query()->exists()
            && ! Setting::invitationRequestsEnabled()) {
            abort(403, 'Invitation requests are disabled.');
        }

        return Inertia::render('Auth/Register/Register', [
            'firstUserSetup' => ! $invitation && User::query()->doesntExist(),
            'registrationSubmitted' => $request->boolean('submitted'),
            'invitation' => $invitation ? [
                'token' => $invitation->token,
                'email' => $invitation->email,
                'workspace' => $invitation->workspace->name,
                'registrationSubmitted' => $invitation->registration_submitted_at !== null,
            ] : null,
        ]);
    }

    public function store(Request $request): RedirectResponse|\Symfony\Component\HttpFoundation\Response
    {
        abort_if(Setting::magicLinkEnabled(), 404);

        $invitation = null;

        if ($request->filled('invitation_token')) {
            $invitation = WorkspaceInvitation::with('workspace')
                ->where('token', $request->invitation_token)
                ->where('expires_at', '>', now())
                ->first();

            if (! $invitation) {
                throw ValidationException::withMessages([
                    'invitation_token' => 'This invitation is no longer valid.',
                ]);
            }
        }

        if (! $invitation && User::query()->exists() && ! Setting::invitationRequestsEnabled()) {
            abort(403, 'Invitation requests are disabled.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        if ($invitation
            && ! hash_equals(
                IdentityEmail::normalize($invitation->email),
                IdentityEmail::normalize($validated['email']),
            )) {
            throw ValidationException::withMessages([
                'email' => 'This invitation was issued for a different email address.',
            ]);
        }

        $validated['email'] = IdentityEmail::normalize($validated['email']);

        if ($invitation) {
            $submittedInvitation = $this->workspaceInvitations->submitRegistration(
                $invitation,
                $validated['name'],
                $validated['password'],
            );
            $this->workspaceInvitations->provisionUser($submittedInvitation);

            return redirect()
                ->route('login')
                ->with('success', 'Your account has been created. You can now sign in.');
        }

        if (User::query()->exists()) {
            $this->registrationRequests->submit(
                $validated['name'],
                $validated['email'],
                RegistrationRequest::ORIGIN_PASSWORD,
                password: Hash::make($validated['password']),
            );

            return redirect()->route('register', ['submitted' => 1]);
        }

        try {
            [$user, $workspace] = DB::transaction(function () use ($validated) {
                $role = $this->identityBootstrapper
                    ->roleForSelfRegistration($validated['email']);
                if (User::query()->exists()) {
                    abort(403, 'A valid workspace invitation is required.');
                }

                if (User::whereRaw('LOWER(email) = LOWER(?)', [$validated['email']])->exists()) {
                    throw ValidationException::withMessages([
                        'email' => 'The email has already been taken.',
                    ]);
                }

                $user = User::create([
                    'name' => $validated['name'],
                    'email' => $validated['email'],
                    'password' => Hash::make($validated['password']),
                    'role' => $role,
                ]);

                $workspace = $this->workspaceProvisioner->ensureOwned(
                    $user,
                    WorkspaceMutationData::named($user->name."'s Workspace"),
                    $user,
                    enforceLimit: true,
                );

                return [$user, $workspace];
            }, 3);
        } catch (UniqueConstraintViolationException $exception) {
            if (! str_contains($exception->getMessage(), 'users_email')) {
                throw $exception;
            }

            throw ValidationException::withMessages([
                'email' => 'The email has already been taken.',
            ]);
        }

        Auth::login($user);
        $request->session()->regenerate();
        session(['current_workspace_id' => $workspace->id]);
        $user->rememberWorkspace($workspace);

        $intended = session()->pull('url.intended', route('dashboard'));
        $intended = is_string($intended) ? $intended : route('dashboard');

        if ($request->header('X-Inertia')) {
            return Inertia::location($intended);
        }

        return redirect()->to($intended);
    }
}
