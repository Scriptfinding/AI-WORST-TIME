<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\IdentityProvider;
use App\Models\User;
use App\Models\UserExternalIdentity;
use App\Services\Auth\AuthSessionFinalizer;
use App\Services\FeatureFlags\FeatureFlagService;
use App\Services\Sso\ExternalIdentityResolver;
use App\Services\Sso\LdapService;
use App\Services\Sso\SamlService;
use App\Services\Sso\SsoProviderService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;

class SsoAuthController extends Controller
{
    public function __construct(
        private readonly FeatureFlagService $features,
        private readonly SsoProviderService $providers,
        private readonly ExternalIdentityResolver $identities,
        private readonly AuthSessionFinalizer $sessions,
    ) {}

    public function samlRedirect(Request $request, SamlService $saml): RedirectResponse
    {
        $provider = $this->ready(IdentityProvider::TYPE_SAML);
        $request->session()->put('login.remember', true);

        return redirect()->away($saml->redirectUrl($provider, $request));
    }

    public function samlLink(Request $request, SamlService $saml): RedirectResponse
    {
        $provider = $this->ready(IdentityProvider::TYPE_SAML);

        return redirect()->away($saml->redirectUrl($provider, $request, true));
    }

    public function samlAcs(Request $request, SamlService $saml): RedirectResponse|Response
    {
        $provider = $this->ready(IdentityProvider::TYPE_SAML);
        $identity = $saml->consume($provider, $request);

        if ($identity['linking_user_id'] !== null) {
            $user = User::query()->findOrFail($identity['linking_user_id']);
            $this->identities->link($user, $provider, $identity['subject'], $identity['email']);

            return redirect()->route('profile', ['tab' => 'security'])
                ->with('success', 'SAML identity linked.');
        }

        $user = $this->identities->resolve(
            $provider,
            $identity['subject'],
            $identity['email'],
            $identity['name'],
        );
        if ($user === null) {
            return redirect()->route('register', ['submitted' => 1]);
        }

        $remember = $request->session()->pull('login.remember', true) === true;

        return $this->sessions->complete($request, $user, $remember, $provider->id);
    }

    public function samlMetadata(SamlService $saml): Response
    {
        $provider = $this->provider(IdentityProvider::TYPE_SAML);

        return response($saml->metadata($provider), 200, ['Content-Type' => 'application/samlmetadata+xml']);
    }

    public function ldapLogin(Request $request, LdapService $ldap): RedirectResponse|Response
    {
        $validated = $request->validate([
            'login' => ['required', 'string', 'max:255'],
            'password' => ['required', 'string', 'max:10000'],
            'remember' => ['sometimes', 'boolean'],
        ]);
        $provider = $this->ready(IdentityProvider::TYPE_LDAP);
        $identity = $ldap->authenticate($provider, $validated['login'], $validated['password']);
        $user = $this->identities->resolve(
            $provider,
            $identity['subject'],
            $identity['email'],
            $identity['name'],
        );
        if ($user === null) {
            return redirect()->route('register', ['submitted' => 1]);
        }

        return $this->sessions->complete(
            $request,
            $user,
            true,
            $provider->id,
        );
    }

    public function ldapLink(Request $request, LdapService $ldap): RedirectResponse
    {
        $validated = $request->validate([
            'login' => ['required', 'string', 'max:255'],
            'password' => ['required', 'string', 'max:10000'],
        ]);
        $provider = $this->ready(IdentityProvider::TYPE_LDAP);
        $identity = $ldap->authenticate($provider, $validated['login'], $validated['password']);
        /** @var User $user */
        $user = $request->user();
        $this->identities->link($user, $provider, $identity['subject'], $identity['email']);

        return back()->with('success', 'LDAP identity linked.');
    }

    public function unlink(Request $request, string $type): RedirectResponse
    {
        $provider = $this->provider($type);
        /** @var User $user */
        $user = $request->user();
        $identity = UserExternalIdentity::query()
            ->where('user_id', $user->id)
            ->where('identity_provider_id', $provider->id)
            ->firstOrFail();

        if ($user->externalIdentities()->count() === 1 && ! $user->google_id && ! $user->github_id) {
            $validated = $request->validate(['current_password' => ['required', 'string']]);
            if (! Hash::check($validated['current_password'], $user->password)) {
                throw ValidationException::withMessages(['current_password' => 'The password is incorrect.']);
            }
        }

        $identity->delete();

        return back()->with('success', strtoupper($type).' identity unlinked.');
    }

    private function ready(string $type): IdentityProvider
    {
        $this->features->abortIfDisabled('sso_enabled');

        return $this->providers->provider($type, true) ?? abort(404);
    }

    private function provider(string $type): IdentityProvider
    {
        $this->features->abortIfDisabled('sso_enabled');
        abort_unless(in_array($type, [IdentityProvider::TYPE_SAML, IdentityProvider::TYPE_LDAP], true), 404);

        return $this->providers->provider($type) ?? abort(404);
    }
}
