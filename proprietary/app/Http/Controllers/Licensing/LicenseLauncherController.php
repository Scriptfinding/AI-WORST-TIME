<?php

namespace App\Http\Controllers\Licensing;

use App\Http\Controllers\Controller;
use App\Services\Licensing\LicenseClient;
use App\Services\Licensing\LicenseFileImporter;
use App\Services\Licensing\LicenseManager;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LicenseLauncherController extends Controller
{
    public function show(
        LicenseManager $licenses,
        LicenseFileImporter $files,
        LicenseClient $client,
    ): Response|RedirectResponse {
        // The launcher is unauthenticated, so a licensed instance never exposes
        // it: anyone could otherwise replace the valid license with another one.
        // License management for an active instance lives in the admin settings.
        if ($licenses->ensureUsable()) {
            return redirect('/');
        }

        $status = $licenses->status();
        try {
            $communityLicenseAvailable = $client->communityLicenseAvailable();
        } catch (\Throwable) {
            $communityLicenseAvailable = false;
        }

        // Only expose what the launcher displays; internals such as
        // next_check_at, grace periods and feature flags stay server-side.
        $configuredVersion = config('license.app_version');
        $version = is_scalar($configuredVersion) ? (string) $configuredVersion : 'unknown';

        return Inertia::render('License/Launcher', [
            'version' => $version !== '' ? $version : 'unknown',
            'community_license_available' => $communityLicenseAvailable,
            'license' => [
                'active' => $status['active'] ?? false,
                'status' => $status['status'] ?? 'missing',
                'message' => $status['message'] ?? null,
                'plan' => $status['plan'] ?? null,
                'file' => $files->metadata(),
            ],
        ]);
    }

    public function store(
        Request $request,
        LicenseFileImporter $files,
        LicenseManager $licenses,
    ): RedirectResponse {
        // Same rule as show(): once the instance is licensed, the unauthenticated
        // launcher must not accept a replacement license file.
        if ($licenses->ensureUsable()) {
            return redirect('/');
        }

        $validated = $request->validate([
            // Accepts the bare .license file or the downloaded zip bundle.
            'license_file' => ['required', 'file', 'max:256'],
        ]);

        try {
            $files->import((string) file_get_contents($validated['license_file']->getRealPath()));
            // Activation also resynchronizes the feature-flag dependent resources.
            $licenses->activate();
        } catch (ConnectionException) {
            return back()->with('error', 'The license server could not be reached. Check your network and try again.');
        } catch (\Throwable $e) {
            return back()->with('error', $e->getMessage());
        }

        return redirect('/')->with('success', 'License activated.');
    }

    public function requestCommunityLicense(
        Request $request,
        LicenseManager $licenses,
        LicenseClient $client,
    ): RedirectResponse {
        if ($licenses->ensureUsable()) {
            return redirect('/');
        }

        $validated = $request->validate([
            'email' => ['required', 'string', 'email:rfc', 'max:254'],
        ]);

        try {
            $client->requestCommunityLicense($validated['email']);
        } catch (ConnectionException) {
            return back()->with('error', 'The license server could not be reached. Check your network and try again.');
        } catch (\Throwable $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'Check your inbox, download your Community license, then upload it here.');
    }
}
