<?php

use App\Exceptions\FeatureFlags\RunQuotaExceededException;
use App\Http\Middleware\HandleInertiaRequests;
use App\Services\Auth\SafeModeAuthenticator;
use App\Services\Variable\UnresolvedVariableException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Support\Env;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withCommands([
        \App\Console\Commands\LicenseActivate::class,
        \App\Console\Commands\LicenseBootstrapEnvironment::class,
        \App\Console\Commands\LicenseImportFile::class,
        \App\Console\Commands\LicensePing::class,
        \App\Console\Commands\LicenseStaticFileChecksum::class,
        \App\Console\Commands\LicenseStatus::class,
        \App\Console\Commands\SafeModeCleanup::class,
        \App\Console\Commands\SyncFeatureFlagStale::class,
    ])
    ->withMiddleware(function (Middleware $middleware): void {
        $trustedProxiesValue = Env::get('TRUSTED_PROXIES', '127.0.0.1,::1,10.0.0.0/8,172.16.0.0/12,192.168.0.0/16,169.254.0.0/16,fc00::/7,fe80::/10');
        $trustedProxiesString = is_string($trustedProxiesValue) ? $trustedProxiesValue : '';
        $trustedProxies = array_values(array_filter(array_map(
            'trim',
            explode(',', $trustedProxiesString),
        )));
        if ($trustedProxies !== []) {
            $middleware->trustProxies(at: $trustedProxies);
        }
        $middleware->append(\App\Http\Middleware\AddSecurityHeaders::class);
        $middleware->validateCsrfTokens(except: [
            'sso/saml/acs',
        ]);
        $middleware->web(append: [
            \App\Http\Middleware\EnsureValidLicense::class,
            \App\Http\Middleware\AuthenticateSafeModeUser::class,
            \App\Http\Middleware\EnsureActiveSsoSession::class,
            \App\Http\Middleware\HandleInertiaRequests::class,
        ]);
        $middleware->api(append: [
            \App\Http\Middleware\EnsureValidLicense::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->dontFlash([
            'config.bind_password',
            'config.sp_private_key',
        ]);

        $exceptions->renderable(function (AuthenticationException $e, Request $request) {
            if ($request->expectsJson()) {
                return null;
            }

            if (app(SafeModeAuthenticator::class)->authenticate($request)) {
                return redirect()->intended($request->fullUrl());
            }

            return redirect()->guest(
                route('login', ['redirect' => $request->fullUrl()])
            );
        });

        $exceptions->renderable(function (RunQuotaExceededException $e, Request $request) {
            if ($request->expectsJson()) {
                return response()->json(['message' => $e->getMessage()], 429);
            }

            return back()->with('error', $e->getMessage());
        });

        $exceptions->renderable(function (UnresolvedVariableException $e, Request $request) {
            if ($request->expectsJson()) {
                return response()->json(['message' => $e->getMessage()], 422);
            }

            return back()->with('error', $e->getMessage());
        });

        $exceptions->respond(function (Response $response, \Throwable $exception, Request $request) {
            $status = $response->getStatusCode();
            if (
                $request->expectsJson()
                || ! $request->hasSession()
                || ! in_array($status, [403, 404, 500, 503], true)
            ) {
                return $response;
            }

            return Inertia::render('Dashboard/ErrorPage', [
                ...app(HandleInertiaRequests::class)->share($request),
                'status' => $status,
            ])
                ->toResponse($request)
                ->setStatusCode($status);
        });
    })->create();
