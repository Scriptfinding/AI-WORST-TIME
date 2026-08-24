<?php

namespace App\Http\Middleware;

use App\Models\ApiKey;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateApiKey
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        if (!$token) {
            return response()->json(['error' => 'API key required.'], 401);
        }

        $hashedKey = hash('sha256', $token);
        $apiKey = ApiKey::where('key', $hashedKey)->first();

        if (!$apiKey) {
            return response()->json(['error' => 'Invalid API key.'], 401);
        }

        $apiKey->update(['last_used_at' => now()]);

        $request->setUserResolver(fn () => $apiKey->user);

        return $next($request);
    }
}
