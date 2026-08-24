<?php

namespace App\Http\Middleware;

use App\Services\Auth\SafeModeAuthenticator;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateSafeModeUser
{
    public function __construct(private SafeModeAuthenticator $authenticator)
    {
    }

    public function handle(Request $request, Closure $next): Response
    {
        if (config('app.safe_mode')) {
            $this->authenticator->authenticate($request);
        }

        return $next($request);
    }
}
