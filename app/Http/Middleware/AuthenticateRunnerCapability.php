<?php

namespace App\Http\Middleware;

use App\Services\Runtime\RunnerCapabilityService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateRunnerCapability
{
    public function __construct(
        private readonly RunnerCapabilityService $capabilities,
    ) {}

    public function handle(Request $request, Closure $next, ?string $requiredScope = null): Response
    {
        $token = $request->bearerToken();
        $resolved = is_string($token) && $token !== ''
            ? $this->capabilities->resolve($token)
            : null;

        if ($resolved === null) {
            return response()->json(['message' => 'Invalid or expired runner capability.'], 401);
        }
        $rateKey = 'runner-capability:'.hash('sha256', $token);
        $configuredRate = config('puppetflow.runner_api.rate_limit_per_minute', 120);
        $maxAttempts = max(10, is_numeric($configuredRate) ? (int) $configuredRate : 120);
        if (RateLimiter::tooManyAttempts($rateKey, $maxAttempts)) {
            return response()->json(['message' => 'Runner capability rate limit exceeded.'], 429);
        }
        RateLimiter::hit($rateKey, 60);

        $run = $resolved['run'];
        $claims = $resolved['claims'];
        if ($run->getAttribute('status') !== 'running') {
            return response()->json(['message' => 'Runner is no longer active.'], 409);
        }
        $scopes = $claims['scopes'] ?? [];
        if ($requiredScope !== null && (! is_array($scopes) || ! in_array($requiredScope, $scopes, true))) {
            return response()->json(['message' => 'Runner capability does not allow this operation.'], 403);
        }

        $request->attributes->set('runner', $run);
        $request->attributes->set('runnerCapabilityClaims', $claims);

        return $next($request);
    }
}
