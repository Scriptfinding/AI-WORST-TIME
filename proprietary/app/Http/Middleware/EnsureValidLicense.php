<?php

namespace App\Http\Middleware;

use App\Services\Licensing\LicenseManager;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureValidLicense
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($this->shouldPassThrough($request)) {
            return $next($request);
        }

        $licenses = app(LicenseManager::class);
        if ($licenses->ensureUsable()) {
            return $next($request);
        }

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'message' => 'Puppetflow is locked until a valid license is activated.',
                'license' => $licenses->status(),
            ], 423);
        }

        if (config('license.managed_license')) {
            return response('Puppetflow is locked until a valid license is provisioned by the instance operator.', 423);
        }

        return redirect()->route('license.launcher');
    }

    private function shouldPassThrough(Request $request): bool
    {
        if (! config('license.managed_license') && $request->is('license', 'license/*')) {
            return true;
        }

        if ($request->is('up', 'build/*', 'img/*', 'images/*', 'favicon.ico', 'robots.txt')) {
            return true;
        }

        return $request->isMethod('GET') && $request->is('storage/*');
    }
}
