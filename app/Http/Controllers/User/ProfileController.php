<?php

/*
 * Explicit proprietary scope: SAML and LDAP identity payload branches in this
 * controller are licensed under the Puppetflow Proprietary License.
 * See LICENSE_PROPRIETARY.md.
 */

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\FeatureFlags\FeatureFlagService;
use App\Services\Sso\SsoProviderService;
use App\Services\Storage\UploadStorage;
use App\Services\Workspace\UserIdentityManager;
use App\Support\IdentityEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class ProfileController extends Controller
{
    private const ONBOARDING_KEYS = [
        'onboarding.disabled',
        'dashboard',
        'flows',
        'runs',
        'variables',
        'channels',
        'mailboxes',
        'snippets',
        'integrations',
        'workspace.settings',
        'workspace.members',
        'profile',
        'admin.users',
        'admin.workspaces',
        'admin.server',
        'api.docs',
    ];

    public function __construct(
        private readonly UserIdentityManager $userIdentities,
        private readonly UploadStorage $uploads,
        private readonly FeatureFlagService $features,
        private readonly SsoProviderService $ssoProviders,
    ) {}

    public function show(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $ssoEnabled = $this->features->enabled('sso_enabled');

        return Inertia::render('Profile/Profile', [
            'apiKeys' => $user->apiKeys()
                ->orderByDesc('created_at')
                ->get(['id', 'name', 'key_preview', 'last_used_at', 'created_at']),
            'newApiKey' => session('new_api_key'),
            'twoFactorEnabled' => $user->hasTwoFactorEnabled(),
            'sso' => [
                'enabled' => $ssoEnabled,
                'providers' => [
                    'saml' => $ssoEnabled && $this->ssoProviders->provider('saml', true) !== null,
                    'ldap' => $ssoEnabled && $this->ssoProviders->provider('ldap', true) !== null,
                ],
                'linked' => $ssoEnabled ? $user->externalIdentities()
                    ->with('provider:id,type,name')
                    ->get()
                    ->mapWithKeys(function ($identity): array {
                        $provider = $identity->provider;
                        if ($provider === null) {
                            return [];
                        }

                        return [
                            $provider->type => [
                                'name' => $provider->name,
                                'email' => $identity->email_snapshot,
                            ],
                        ];
                    }) : [],
            ],
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $request->merge([
            'email' => IdentityEmail::normalize($request->input('email')),
        ]);

        /** @var array{name: string, email: string, timezone: string} $validated */
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email,'.$user->id],
            'timezone' => ['required', 'string', 'timezone:all'],
        ]);

        $emailChanged = $validated['email'] !== $user->email;
        DB::transaction(function () use ($user, $validated, $emailChanged): void {
            if ($emailChanged) {
                $this->userIdentities->changeEmail($user, $validated['email'], $user);
            }

            $user->forceFill([
                'name' => $validated['name'],
                'timezone' => $validated['timezone'],
            ])->save();
        }, 3);

        return back()->with('success', 'Profile updated.');
    }

    public function updatePreference(Request $request): RedirectResponse
    {
        /** @var array{key: 'explorer_view_mode', value: string} $validated */
        $validated = $request->validate([
            'key' => ['required', 'string', 'in:explorer_view_mode'],
            'value' => ['required', 'string'],
        ]);

        $request->validate(['value' => ['in:grid,list']]);

        /** @var User $user */
        $user = $request->user();
        $user->update([$validated['key'] => $validated['value']]);

        return back();
    }

    public function updateOnboarding(Request $request): HttpResponse
    {
        /** @var array{key: string, version: int} $validated */
        $validated = $request->validate([
            'key' => ['required', 'string', Rule::in(self::ONBOARDING_KEYS)],
            'version' => ['required', 'integer', 'min:1', 'max:100'],
        ]);

        /** @var User $authenticatedUser */
        $authenticatedUser = $request->user();

        DB::transaction(function () use ($authenticatedUser, $validated): void {
            /** @var User $user */
            $user = User::query()
                ->lockForUpdate()
                ->findOrFail($authenticatedUser->id);

            $versions = $user->onboarding_versions ?? [];
            $versions[$validated['key']] = max(
                (int) ($versions[$validated['key']] ?? 0),
                $validated['version'],
            );

            $user->forceFill(['onboarding_versions' => $versions])->save();
        }, 3);

        return response()->noContent();
    }

    public function resetOnboarding(Request $request): HttpResponse
    {
        /** @var User $authenticatedUser */
        $authenticatedUser = $request->user();

        User::query()
            ->whereKey($authenticatedUser->id)
            ->update(['onboarding_versions' => null]);

        return response()->noContent();
    }

    public function updatePassword(Request $request): RedirectResponse
    {
        /** @var array{current_password: string, password: string} $validated */
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        /** @var User $user */
        $user = $request->user();
        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        return back()->with('success', 'Password changed.');
    }

    public function updateIcon(Request $request): RedirectResponse
    {
        /** @var array{icon_type?: 'emoji'|'color'|'upload', icon_value?: string|null, icon_color?: string|null} $validated */
        $validated = $request->validate([
            'icon_type' => ['sometimes', 'in:emoji,color,upload'],
            'icon_value' => ['nullable', 'string', 'max:100'],
            'icon_color' => ['nullable', 'string', 'max:7'],
        ]);

        /** @var User $user */
        $user = $request->user();
        $user->update($validated);

        return back()->with('success', 'Profile icon updated.');
    }

    public function updateAvatar(Request $request): RedirectResponse
    {
        $request->validate([
            'avatar' => ['required', 'file', 'mimes:jpg,jpeg,png,gif,webp', 'max:2048'],
        ]);

        /** @var User $user */
        $user = $request->user();

        $file = $request->file('avatar');
        abort_unless($file instanceof UploadedFile, 422, 'A valid avatar file is required.');
        $oldPath = is_string($user->avatar_path) ? $user->avatar_path : null;
        $filename = $this->uploads->storeRasterImage($file, $user->iconUploadDir());

        try {
            DB::transaction(function () use ($user, $filename): void {
                if (! $user->update([
                    'avatar_path' => $filename,
                    'icon_type' => 'upload',
                    'icon_value' => null,
                ])) {
                    throw new \RuntimeException('Unable to update avatar.');
                }
            });
        } catch (\Throwable $exception) {
            $persisted = true;
            try {
                $persisted = User::query()
                    ->whereKey($user->getKey())
                    ->where('avatar_path', $filename)
                    ->exists();
            } catch (\Throwable $verificationException) {
                report($verificationException);
            }

            if (! $persisted) {
                try {
                    $this->uploads->delete($filename);
                } catch (\Throwable $cleanupException) {
                    report($cleanupException);
                }
            }

            throw $exception;
        }

        if ($oldPath !== null && $oldPath !== $filename) {
            try {
                $this->uploads->delete($oldPath);
            } catch (\Throwable $exception) {
                report($exception);
            }
        }

        return back()->with('success', 'Avatar updated.');
    }

    public function destroyAvatar(Request $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $oldPath = is_string($user->avatar_path) ? $user->avatar_path : null;

        $user->update([
            'avatar_path' => null,
            'icon_type' => 'color',
            'icon_value' => null,
            'icon_color' => null,
        ]);

        if ($oldPath !== null) {
            try {
                $this->uploads->delete($oldPath);
            } catch (\Throwable $exception) {
                report($exception);
            }
        }

        return back()->with('success', 'Avatar removed.');
    }
}
