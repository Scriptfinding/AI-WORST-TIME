<?php

namespace App\Http\Controllers\Auth;

use App\DTO\Workspace\WorkspaceMutationData;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Workspace\IdentityBootstrapper;
use App\Services\Workspace\WorkspaceProvisioner;
use App\Support\IdentityEmail;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Laravel\Socialite\Contracts\User as SocialiteUser;
use Laravel\Socialite\Facades\Socialite;
use Symfony\Component\HttpFoundation\RedirectResponse as SymfonyRedirectResponse;
use Throwable;

class SocialLoginController extends Controller
{
    private const SUPPORTED_PROVIDERS = ['google', 'github'];

    public function __construct(
        private readonly IdentityBootstrapper $identityBootstrapper,
        private readonly WorkspaceProvisioner $workspaceProvisioner,
    ) {}

    public function redirect(Request $request, string $provider): SymfonyRedirectResponse
    {
        $this->ensureSupportedProvider($provider);
        $request->session()->put('login.remember', true);

        return Socialite::driver($provider)->redirect();
    }

    public function callback(Request $request, string $provider): RedirectResponse
    {
        $this->ensureSupportedProvider($provider);

        try {
            $socialiteUser = Socialite::driver($provider)->user();
        } catch (Throwable) {
            return redirect()
                ->route('login')
                ->withErrors(['email' => 'Unable to authenticate with the selected provider.']);
        }

        if (! $socialiteUser->getEmail()) {
            return redirect()
                ->route('login')
                ->withErrors(['email' => 'The selected provider did not return an email address.']);
        }

        if (! $this->canCreateUser($provider, $socialiteUser)) {
            return redirect()
                ->route('login')
                ->withErrors(['email' => 'No account exists for this email address.']);
        }

        try {
            $user = DB::transaction(
                function () use ($provider, $socialiteUser): User {
                    $this->identityBootstrapper->roleForSelfRegistration(
                        $socialiteUser->getEmail(),
                    );
                    if (! $this->canCreateUser($provider, $socialiteUser)) {
                        throw ValidationException::withMessages([
                            'email' => 'No account exists for this email address.',
                        ]);
                    }

                    return $this->resolveUser($provider, $socialiteUser);
                },
                3,
            );
        } catch (UniqueConstraintViolationException $exception) {
            if (! str_contains($exception->getMessage(), 'users_email')) {
                throw $exception;
            }

            throw ValidationException::withMessages([
                'email' => 'An account already exists for this email address.',
            ]);
        }

        $remember = $request->session()->pull('login.remember', true) === true;

        if (! config('app.safe_mode') && $user->hasTwoFactorEnabled()) {
            $request->session()->put('login.id', $user->id);
            $request->session()->put('login.remember', $remember);
            $request->session()->put('login.two_factor_attempts', 0);

            return redirect()->route('two-factor.challenge');
        }

        Auth::login($user, $remember);
        $request->session()->regenerate();
        $this->setCurrentWorkspace($user);

        return redirect()->intended(route('dashboard'));
    }

    private function resolveUser(string $provider, SocialiteUser $socialiteUser): User
    {
        $providerColumn = $this->providerColumn($provider);
        $providerId = (string) $socialiteUser->getId();
        $email = IdentityEmail::normalize($socialiteUser->getEmail());

        $user = User::where($providerColumn, $providerId)->first();

        if ($user) {
            return $user;
        }

        $user = User::where('email', $email)->first();

        if ($user) {
            $user->forceFill([
                $providerColumn => $providerId,
                'email_verified_at' => $user->email_verified_at ?? now(),
            ])->save();

            return $user;
        }

        return $this->createUser($providerColumn, $providerId, $socialiteUser);
    }

    private function createUser(string $providerColumn, string $providerId, SocialiteUser $socialiteUser): User
    {
        $email = IdentityEmail::normalize($socialiteUser->getEmail());

        $user = User::create([
            'name' => $socialiteUser->getName() ?: $socialiteUser->getNickname() ?: Str::before($email, '@'),
            'email' => $email,
            $providerColumn => $providerId,
            'email_verified_at' => now(),
            'password' => Hash::make(Str::random(64)),
            'role' => $this->identityBootstrapper->roleForSelfRegistration(),
        ]);

        $workspace = $this->workspaceProvisioner->ensureOwned(
            $user,
            WorkspaceMutationData::named($user->name."'s Workspace"),
            $user,
            enforceLimit: true,
        );
        $user->rememberWorkspace($workspace);

        return $user;
    }

    private function canCreateUser(string $provider, SocialiteUser $socialiteUser): bool
    {
        $providerColumn = $this->providerColumn($provider);
        $providerId = (string) $socialiteUser->getId();
        $email = IdentityEmail::normalize($socialiteUser->getEmail());

        if (User::where($providerColumn, $providerId)->exists() || User::where('email', $email)->exists()) {
            return true;
        }

        return User::query()->doesntExist();
    }

    private function setCurrentWorkspace(User $user): void
    {
        $workspace = $user->preferredWorkspace();

        if (! $workspace) {
            if (! $user->isAdmin() && ! $user->can_create_workspace) {
                session()->forget('current_workspace_id');
                $user->rememberWorkspace(null);

                return;
            }

            $workspace = $this->workspaceProvisioner->ensureOwned(
                $user,
                WorkspaceMutationData::named($user->name."'s Workspace"),
                $user,
                enforceLimit: true,
            );
        }

        session(['current_workspace_id' => $workspace->id]);
        $user->rememberWorkspace($workspace);
    }

    private function providerColumn(string $provider): string
    {
        return $provider.'_id';
    }

    private function ensureSupportedProvider(string $provider): void
    {
        abort_unless((bool) config('services.social_auth.enabled'), 404);
        abort_unless(in_array($provider, self::SUPPORTED_PROVIDERS, true), 404);
        abort_unless((bool) config("services.{$provider}.enabled"), 404);
    }
}
