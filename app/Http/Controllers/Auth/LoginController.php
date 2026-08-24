<?php

/*
 * Explicit proprietary scope: the SAML and LDAP provider discovery and sign-in branches in this file implement paid
 * Puppetflow features and are licensed under the Puppetflow Proprietary License.
 * See LICENSE_PROPRIETARY.md.
 */

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\IdentityProvider;
use App\Models\Setting;
use App\Models\User;
use App\Services\Auth\AuthSessionFinalizer;
use App\Services\Auth\SafeModeAuthenticator;
use App\Services\FeatureFlags\FeatureFlagService;
use App\Services\Sso\ExternalIdentityResolver;
use App\Services\Sso\LdapService;
use App\Services\Sso\SsoProviderService;
use App\Support\IdentityEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class LoginController extends Controller
{
    public function __construct(
        private SafeModeAuthenticator $safeModeAuthenticator,
        private AuthSessionFinalizer $authSessions,
        private FeatureFlagService $features,
        private SsoProviderService $ssoProviders,
        private ExternalIdentityResolver $externalIdentities,
    ) {}

    public function show(Request $request): Response|RedirectResponse
    {
        if ($redirect = $request->query('redirect')) {
            if (is_string($redirect) && str_starts_with($redirect, '/') && ! str_starts_with($redirect, '//')) {
                session()->put('url.intended', $redirect);
            }
        }

        if ($this->safeModeAuthenticator->authenticate($request)) {
            return redirect()->intended(route('dashboard'));
        }

        if (User::query()->doesntExist()) {
            return redirect()->route('register');
        }

        $socialAuthEnabled = (bool) config('services.social_auth.enabled');

        return Inertia::render('Auth/Login/Login', [
            'socialProviders' => [
                'google' => $socialAuthEnabled && (bool) config('services.google.enabled'),
                'github' => $socialAuthEnabled && (bool) config('services.github.enabled'),
            ],
            'ssoProviders' => [
                'saml' => $this->features->enabled('sso_enabled')
                    && $this->ssoProviders->provider('saml', true) !== null,
                'ldap' => $this->features->enabled('sso_enabled')
                    && $this->ssoProviders->provider('ldap', true) !== null,
            ],
        ]);
    }

    public function store(Request $request, LdapService $ldap): RedirectResponse|\Symfony\Component\HttpFoundation\Response
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string', 'max:10000'],
            'remember' => ['sometimes', 'boolean'],
        ]);
        $email = IdentityEmail::normalize($validated['email']);
        $remember = true;

        /** @var User|null $user */
        $user = null;
        if (! Setting::magicLinkEnabled()) {
            $candidate = User::query()->where('email', $email)->first();
            $user = $candidate !== null && Hash::check($validated['password'], $candidate->password)
                ? $candidate
                : null;
        }

        if ($user !== null) {
            if (config('app.safe_mode')) {
                Auth::login($user, $remember);
                $request->session()->regenerate();
                $this->safeModeAuthenticator->authenticate($request);

                return $this->redirectAfterAuth($request);
            }

            return $this->authSessions->complete($request, $user, $remember);
        }

        if (! config('app.safe_mode') && $this->features->enabled('sso_enabled')) {
            $provider = $this->ssoProviders->provider(IdentityProvider::TYPE_LDAP, true);
            if ($provider !== null) {
                try {
                    $identity = $ldap->authenticate($provider, $email, $validated['password']);
                    $user = $this->externalIdentities->resolve(
                        $provider,
                        $identity['subject'],
                        $identity['email'],
                        $identity['name'],
                    );
                    if ($user === null) {
                        return redirect()->route('register', ['submitted' => 1]);
                    }

                    return $this->authSessions->complete($request, $user, $remember, $provider->id);
                } catch (ValidationException) {
                    // Return the same error as local authentication.
                }
            }
        }

        return back()->withErrors([
            'email' => 'The provided credentials do not match our records.',
        ])->onlyInput('email');
    }

    public function destroy(Request $request): RedirectResponse|\Symfony\Component\HttpFoundation\Response
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        if ($request->header('X-Inertia')) {
            return Inertia::location(route('login'));
        }

        return redirect()->route('login');
    }

    private function redirectAfterAuth(Request $request): RedirectResponse|\Symfony\Component\HttpFoundation\Response
    {
        $intended = session()->pull('url.intended', route('dashboard'));
        $intended = is_string($intended) ? $intended : route('dashboard');

        if ($request->header('X-Inertia')) {
            return Inertia::location($intended);
        }

        return redirect()->to($intended);
    }
}
