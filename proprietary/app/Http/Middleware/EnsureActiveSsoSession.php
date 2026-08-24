<?php

namespace App\Http\Middleware;

use App\Models\IdentityProvider;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

final class EnsureActiveSsoSession
{
    public function handle(Request $request, Closure $next): Response
    {
        $providerId = $request->session()->get('auth.identity_provider_id');
        if (! $request->user() || ! is_numeric($providerId)) {
            return $next($request);
        }

        $providerIsActive = IdentityProvider::query()
            ->whereKey((int) $providerId)
            ->where('is_enabled', true)
            ->whereNotNull('validated_at')
            ->exists();

        if ($providerIsActive) {
            return $next($request);
        }

        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return $request->header('X-Inertia')
            ? Inertia::location(route('login'))
            : redirect()->route('login');
    }
}
