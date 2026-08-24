<?php

use App\Http\Controllers\Admin\SsoController;
use App\Http\Controllers\Admin\WhitelabelController;
use App\Http\Controllers\Auth\SsoAuthController;
use App\Http\Middleware\EnsureAdmin;
use App\Http\Middleware\EnsureWorkspaceAccess;
use Illuminate\Support\Facades\Route;

Route::middleware('web')->group(function (): void {
    Route::get('sso/saml/login', [SsoAuthController::class, 'samlRedirect'])->name('sso.saml.login');
    Route::post('sso/saml/acs', [SsoAuthController::class, 'samlAcs'])->name('sso.saml.acs');
    Route::get('sso/saml/metadata', [SsoAuthController::class, 'samlMetadata'])->name('sso.saml.metadata');
    Route::post('sso/ldap/login', [SsoAuthController::class, 'ldapLogin'])
        ->middleware('throttle:10,1')
        ->name('sso.ldap.login');

    Route::middleware('auth')->group(function (): void {
        Route::get('profile/sso/saml/link', [SsoAuthController::class, 'samlLink'])->name('profile.sso.saml.link');
        Route::post('profile/sso/ldap/link', [SsoAuthController::class, 'ldapLink'])
            ->middleware('throttle:10,1')
            ->name('profile.sso.ldap.link');
        Route::delete('profile/sso/{type}', [SsoAuthController::class, 'unlink'])->name('profile.sso.unlink');
    });
});

Route::middleware(['web', 'auth', EnsureWorkspaceAccess::class, EnsureAdmin::class])
    ->prefix('admin/server/branding')
    ->name('admin.server.branding.')
    ->group(function () {
        Route::put('/', [WhitelabelController::class, 'update'])->name('update');
        Route::post('logo', [WhitelabelController::class, 'uploadLogo'])->name('logo.upload');
        Route::delete('logo', [WhitelabelController::class, 'destroyLogo'])->name('logo.destroy');
        Route::delete('/', [WhitelabelController::class, 'reset'])->name('reset');
    });

Route::middleware(['web', 'auth', EnsureWorkspaceAccess::class, EnsureAdmin::class])
    ->prefix('admin/server/sso')
    ->name('admin.server.sso.')
    ->group(function (): void {
        Route::put('{type}', [SsoController::class, 'update'])->name('update');
        Route::post('{type}/test', [SsoController::class, 'test'])->name('test');
        Route::patch('{type}', [SsoController::class, 'toggle'])->name('toggle');
        Route::delete('{type}', [SsoController::class, 'destroy'])->name('destroy');
    });
