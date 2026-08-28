<?php

namespace App\Http\Middleware;

use App\Authorization\AuthorizationContextFactory;
use App\Contracts\BrandingProvider;
use App\Models\Setting;
use App\Models\User;
use App\Models\Workspace;
use App\Services\FeatureFlags\FeatureFlagService;
use App\Services\FeatureFlags\RunCycleService;
use App\Services\Storage\UploadStorage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $user = $request->user();
        $featureFlags = app(FeatureFlagService::class);
        $branding = app(BrandingProvider::class);

        return [
            ...parent::share($request),
            'branding' => fn () => $branding->current(),
            // Lazy: Inertia invokes share() before the route middleware run,
            // so the workspace role and current workspace must be resolved
            // after EnsureWorkspaceAccess populated its request attribute and
            // the controller warmed the scoped authorization context.
            'auth' => fn () => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'workspace_role' => $this->workspaceRole($user, $featureFlags)
                        ?? ($user->isAdmin() ? 'admin' : 'member'),
                    'can_create_workspace' => (bool) $user->can_create_workspace,
                    'timezone' => $user->timezone ?? 'UTC',
                    'explorer_view_mode' => $user->explorer_view_mode ?? 'grid',
                    'onboarding_versions' => $user->onboarding_versions ?? [],
                    'avatar_url' => $user->avatar_path
                        ? app(UploadStorage::class)->url($user->avatar_path, (int) ($user->updated_at->timestamp ?? 0))
                        : null,
                    'icon_type' => $user->icon_type ?? 'color',
                    'icon_value' => $user->icon_value,
                    'icon_color' => $user->icon_color,
                    'icon_url' => $user->icon_url,
                    'current_workspace_id' => session('current_workspace_id'),
                    'two_factor_enabled' => $user->hasTwoFactorEnabled(),
                ] : null,
            ],
            'safe_mode' => config('app.safe_mode'),
            'currentWorkspace' => function () use ($request, $user) {
                if (! $user) {
                    return null;
                }
                $workspace = $request->attributes->get('current_workspace');

                return $workspace instanceof Workspace
                    ? $workspace
                    : Workspace::find(session('current_workspace_id'));
            },
            'workspaces' => function () use ($user) {
                if (! $user) {
                    return [];
                }

                $cols = ['id', 'name', 'slug', 'icon_type', 'icon_value', 'icon_color', 'icon_upload_path', 'updated_at'];

                if ($user->isAdmin()) {
                    return Workspace::select($cols)
                        ->where(function ($query) {
                            $query->whereNull('expires_at')
                                ->orWhere('expires_at', '>', now());
                        })
                        ->orderBy('name')
                        ->get();
                }

                return $user->workspaces()
                    ->where(function ($query) {
                        $query->whereNull('workspaces.expires_at')
                            ->orWhere('workspaces.expires_at', '>', now());
                    })
                    ->get(array_map(fn ($c) => "workspaces.$c", $cols));
            },
            'settings' => [
                'invitation_requests_enabled' => fn () => Setting::invitationRequestsEnabled(),
                'magic_link_enabled' => fn () => Setting::magicLinkEnabled(),
                'server_timezone' => config('app.timezone', 'UTC'),
                'max_flow_timeout_seconds' => config('puppetflow.max_flow_timeout_seconds', 0),
                'grabber_chrome_store_url' => config('puppetflow.grabber_chrome_store_url', ''),
                'grabber_firefox_store_url' => config('puppetflow.grabber_firefox_store_url', ''),
                'queues_counter' => config('puppetflow.queues_counter', 1),
                ...$featureFlags->frontendSettings(),
            ],
            'workspace_quota' => function () use ($user, $featureFlags) {
                if (! $user || (! $user->isAdmin() && ! $user->can_create_workspace)) {
                    return null;
                }

                $limit = $featureFlags->limit('workspace_limit');
                if ($limit < 0) {
                    return null;
                }

                $used = Workspace::count();

                return [
                    'exceeded' => $used >= $limit,
                    'used' => $used,
                    'limit' => $limit,
                ];
            },
            'impersonating' => session()->has('impersonate.admin_id'),
            'run_quota' => function () {
                $cycle = app(RunCycleService::class)->current();
                if ($cycle === null || $cycle['limit'] === null) {
                    return null;
                }

                return [
                    'exceeded' => $cycle['exceeded'],
                    'used' => $cycle['used'],
                    'limit' => $cycle['limit'],
                    'resets_at' => $cycle['ends_at'],
                ];
            },
            'flash' => [
                // Unique id per flashed message so the frontend can re-show
                // a toast even when two consecutive messages are identical.
                'id' => fn () => $request->session()->get('success') || $request->session()->get('error')
                    ? uniqid('', true)
                    : null,
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'external_app_integration_id' => fn () => $request->session()->get('external_app_integration_id'),
            ],
        ];
    }

    private function workspaceRole(User $user, FeatureFlagService $featureFlags): ?string
    {
        $workspaceId = session('current_workspace_id');
        if (! is_string($workspaceId) || $workspaceId === '') {
            return null;
        }

        $role = app(AuthorizationContextFactory::class)->cachedFor($user, $workspaceId)->workspaceRole
            ?? DB::table('user_workspace')
                ->where('user_id', $user->id)
                ->where('workspace_id', $workspaceId)
                ->value('role');
        if (! is_string($role)) {
            return null;
        }

        // Expose the effective role: pivot roles are inert when sharing is
        // disabled, so the frontend degrades role-based UI automatically.
        if ($role !== 'member' && ! $featureFlags->sharingRolesEnabled()) {
            return 'member';
        }

        return $role;
    }
}
