<?php

/*
 * Explicit proprietary scope: licensing, SAML/LDAP configuration and
 * white-label settings branches in this controller are licensed under the
 * Puppetflow Proprietary License. See LICENSE_PROPRIETARY.md.
 */

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Models\Workspace;
use App\Services\Admin\MagicLinkSettingChallengeService;
use App\Services\FeatureFlags\FeatureFlagService;
use App\Services\FeatureFlags\RunCycleService;
use App\Services\Licensing\LicenseFileImporter;
use App\Services\Licensing\LicenseFileStore;
use App\Services\Licensing\LicenseManager;
use App\Services\Sso\SsoProviderService;
use App\Services\Storage\InstanceStorageQuotaService;
use FilesystemIterator;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use Throwable;

class SettingsController extends Controller
{
    public function index(
        LicenseManager $licenses,
        LicenseFileStore $fileStore,
        LicenseFileImporter $licenseFiles,
        FeatureFlagService $features,
        InstanceStorageQuotaService $storageQuota,
        SsoProviderService $sso,
    ): Response {
        /** @var string|null $version */
        $version = config('license.app_version');
        $managedLicense = (bool) config('license.managed_license');

        return Inertia::render('Admin/Server/Server', [
            // Named serverSettings to avoid shadowing the shared "settings" prop
            // from HandleInertiaRequests, which carries the feature flags used
            // by the sidebar.
            'serverSettings' => [
                'invitation_requests_enabled' => Setting::invitationRequestsEnabled(),
                'magic_link_enabled' => Setting::magicLinkEnabled(),
            ],
            'license' => [
                ...$licenses->status(),
                'managed_license' => $managedLicense,
                'file_configured' => $fileStore->has(),
                'file' => $managedLicense ? null : $licenseFiles->metadata(),
                'feature_flags' => $licenses->featureFlags(),
                'cycle' => app(RunCycleService::class)->current(),
                'storage' => $this->licenseStorage($storageQuota),
            ],
            'about' => [
                'name' => config('app.name'),
                // Sourced from version.txt at the project root, with a safe
                // fallback when the file is missing.
                'version' => $version ?: 'unknown',
            ],
            'storage' => $this->dataStorage(),
            'sso' => $features->enabled('sso_enabled') ? $sso->sanitized() : null,
            'ssoWorkspaces' => $features->enabled('sso_enabled')
                ? Workspace::query()->orderBy('name')->get(['id', 'name'])
                : [],
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'invitation_requests_enabled' => ['sometimes', 'boolean'],
            'magic_link_enabled' => ['sometimes', 'boolean'],
        ]);

        if (array_key_exists('invitation_requests_enabled', $validated)) {
            Setting::set('registration_enabled', $validated['invitation_requests_enabled'] ? '1' : '0');
        }

        if (array_key_exists('magic_link_enabled', $validated)) {
            if ($validated['magic_link_enabled'] && ! Setting::magicLinkEnabled()) {
                throw ValidationException::withMessages([
                    'magic_link_enabled' => 'Verify email delivery before enabling passwordless sign-in.',
                ]);
            }

            Setting::set('magic_link_enabled', $validated['magic_link_enabled'] ? '1' : '0');
        }

        return back()->with('success', 'Settings saved.');
    }

    public function requestMagicLinkChallenge(
        Request $request,
        MagicLinkSettingChallengeService $challenges,
    ): JsonResponse {
        if (Setting::magicLinkEnabled()) {
            throw ValidationException::withMessages([
                'code' => 'Passwordless sign-in is already enabled.',
            ]);
        }

        /** @var \App\Models\User $admin */
        $admin = $request->user();

        try {
            $challenge = $challenges->issue($admin, $request->ip());
        } catch (ValidationException $exception) {
            throw $exception;
        } catch (Throwable $exception) {
            Log::error('Unable to send the passwordless sign-in confirmation code.', [
                'user_id' => $request->user()?->getAuthIdentifier(),
                'exception' => $exception,
            ]);

            throw ValidationException::withMessages([
                'code' => 'The confirmation email could not be sent. Check your mail configuration and try again.',
            ]);
        }

        return response()->json([
            'challenge_id' => $challenge->getKey(),
            'email' => $challenge->email,
            'expires_at' => $challenge->expires_at->toIso8601String(),
            'resend_after_seconds' => $challenges->resendAfterSeconds(),
        ]);
    }

    public function confirmMagicLinkChallenge(
        Request $request,
        MagicLinkSettingChallengeService $challenges,
    ): JsonResponse {
        $validated = $request->validate([
            'challenge_id' => ['required', 'uuid'],
            'code' => ['required', 'digits:6'],
        ]);

        /** @var \App\Models\User $admin */
        $admin = $request->user();

        $challenges->consume(
            $validated['challenge_id'],
            $validated['code'],
            $admin,
        );
        Setting::set('magic_link_enabled', '1');

        return response()->json([
            'magic_link_enabled' => true,
            'message' => 'Passwordless email sign-in enabled.',
        ]);
    }

    public function uploadLicense(
        Request $request,
        LicenseFileImporter $licenseFiles,
        LicenseManager $licenses,
    ): RedirectResponse {
        $validated = $request->validate([
            // Accepts the bare .license file or the downloaded zip bundle.
            'license_file' => ['required', 'file', 'max:256'],
        ]);

        try {
            $licenseFiles->import((string) file_get_contents($validated['license_file']->getRealPath()));
            // Activation also resynchronizes the feature-flag dependent resources.
            $licenses->activate();
        } catch (ConnectionException) {
            return back()->with('error', 'The license server could not be reached. Check your network and try again.');
        } catch (\Throwable $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'License activated.');
    }

    public function pingLicense(LicenseManager $licenses, LicenseFileStore $fileStore): RedirectResponse
    {
        if (! $fileStore->has()) {
            return back()->with('error', 'No license file is configured on this instance.');
        }

        try {
            $payload = $licenses->ping();
        } catch (ConnectionException) {
            return back()->with('error', 'The license server could not be reached. Check your network and try again.');
        } catch (\Throwable $e) {
            return back()->with('error', $e->getMessage());
        }

        // The ping locks the instance and removes the license when the static
        // file checksum check fails on the fresh token; the captive /license
        // page explains why.
        $lock = $licenses->staticFileChecksumLock();
        if ($lock && ! $licenses->payload()) {
            return redirect()->route('license.launcher');
        }

        return back()->with('success', $payload->nextCheckAt !== null
            ? "License refreshed. Next check at {$payload->nextCheckAt}."
            : 'License refreshed.');
    }

    public function downloadLicense(LicenseFileStore $fileStore): \Illuminate\Http\Response
    {
        $content = $fileStore->get();
        abort_if($content === null, 404);

        return response($content, 200, [
            'Content-Type' => 'application/octet-stream',
            'Content-Disposition' => 'attachment; filename="puppetflow.license"',
        ]);
    }

    public function deleteLicense(
        LicenseManager $licenses,
        LicenseFileStore $fileStore,
        LicenseFileImporter $licenseFiles,
        FeatureFlagService $features,
    ): RedirectResponse {
        try {
            $licenses->deactivate();
        } catch (Throwable) {
            // Best effort: the license server may be unreachable, local state is purged anyway.
        }

        $licenses->forgetToken();
        $fileStore->forget();
        $licenseFiles->forget();
        $features->syncStaleStates();

        return back()->with('success', 'License removed.');
    }

    /**
     * @return array{used_bytes: int, total_bytes: float|int, free_bytes: float|int|null, percentage: float|int}
     */
    private function dataStorage(): array
    {
        $dataPath = realpath(base_path('data')) ?: base_path('data');
        $totalBytes = @disk_total_space($dataPath) ?: 0;
        $usedBytes = $this->directorySize($dataPath);
        $freeBytes = $totalBytes > 0 ? max(0, $totalBytes - $usedBytes) : null;

        return [
            'used_bytes' => $usedBytes,
            'total_bytes' => $totalBytes,
            'free_bytes' => $freeBytes,
            'percentage' => $totalBytes > 0 ? min(100, round(($usedBytes / $totalBytes) * 100, 2)) : 0,
        ];
    }

    /**
     * @return array{used_bytes: int, limit_bytes: int|null}
     */
    private function licenseStorage(InstanceStorageQuotaService $quota): array
    {
        $limitBytes = $quota->limitBytes();

        return [
            'used_bytes' => $quota->usedBytes(),
            'limit_bytes' => $limitBytes > 0 ? $limitBytes : null,
        ];
    }

    private function directorySize(string $path): int
    {
        if (! is_dir($path)) {
            return 0;
        }

        $bytes = 0;

        try {
            $files = new RecursiveIteratorIterator(
                new RecursiveDirectoryIterator($path, FilesystemIterator::SKIP_DOTS),
                RecursiveIteratorIterator::LEAVES_ONLY
            );

            foreach ($files as $file) {
                /** @var \SplFileInfo $file */
                if ($file->isFile() && ! $file->isLink()) {
                    $bytes += $file->getSize();
                }
            }
        } catch (Throwable) {
            return $bytes;
        }

        return $bytes;
    }
}
