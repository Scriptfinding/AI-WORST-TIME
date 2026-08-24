<?php

namespace App\Services\Auth;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

final class AuthSessionFinalizer
{
    public function complete(
        Request $request,
        User $user,
        bool $remember = false,
        ?int $identityProviderId = null,
    ): RedirectResponse|Response {
        if ($identityProviderId === null) {
            $request->session()->forget('auth.identity_provider_id');
        } else {
            $request->session()->put('auth.identity_provider_id', $identityProviderId);
        }

        if (! config('app.safe_mode') && $user->hasTwoFactorEnabled()) {
            $request->session()->put('login.id', $user->id);
            $request->session()->put('login.remember', $remember);
            $request->session()->put('login.two_factor_attempts', 0);

            return redirect()->route('two-factor.challenge');
        }

        Auth::login($user, $remember);
        $request->session()->regenerate();

        $workspace = $user->preferredWorkspace();
        if ($workspace !== null) {
            $request->session()->put('current_workspace_id', $workspace->id);
            $user->rememberWorkspace($workspace);
        }

        $intended = $request->session()->pull('url.intended', route('dashboard'));
        $intended = is_string($intended) && str_starts_with($intended, '/') && ! str_starts_with($intended, '//')
            ? $intended
            : route('dashboard');

        return $request->header('X-Inertia')
            ? Inertia::location($intended)
            : redirect()->to($intended);
    }
}
