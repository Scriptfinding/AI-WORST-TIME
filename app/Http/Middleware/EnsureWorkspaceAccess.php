<?php

namespace App\Http\Middleware;

use App\DTO\Workspace\WorkspaceMutationData;
use App\Models\Flow;
use App\Models\Folder;
use App\Models\NotificationChannel;
use App\Models\UserVariable;
use App\Models\Workspace;
use App\Services\FeatureFlags\FeatureFlagService;
use App\Services\Workspace\WorkspaceProvisioner;
use Closure;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureWorkspaceAccess
{
    public function __construct(
        private readonly WorkspaceProvisioner $workspaceProvisioner,
        private readonly FeatureFlagService $features,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return redirect()->guest(route('login'));
        }

        $bypassRoutes = ['workspace.create', 'workspace.store', 'two-factor.setup', 'two-factor.enable', 'two-factor.disable', 'logout'];
        if (in_array($request->route()?->getName(), $bypassRoutes)) {
            return $next($request);
        }

        $workspaceId = $this->stringValue(session('current_workspace_id'));
        $workspace = null;

        if (! $workspaceId) {
            $workspace = $user->preferredWorkspace();

            if (! $workspace) {
                if ($user->isAdmin()) {
                    return redirect()->route('workspace.create');
                }

                abort_unless(
                    $user->can_create_workspace,
                    403,
                    'You do not belong to a workspace. Contact an administrator for access.',
                );

                $workspace = $this->workspaceProvisioner->ensureOwned(
                    $user,
                    WorkspaceMutationData::named($user->name."'s Workspace"),
                    $user,
                );
            }

            $workspaceId = $workspace->id;
            session(['current_workspace_id' => $workspace->id]);
            $user->rememberWorkspace($workspace);
        } else {
            if ($user->isAdmin()) {
                $workspace = Workspace::find($workspaceId);
            } else {
                $workspace = $user->workspaces()->where('workspaces.id', $workspaceId)->first();
            }

            if (! $workspace) {
                session()->forget('current_workspace_id');

                return redirect()->route('dashboard');
            }
        }

        if (! $user->isAdmin() && $workspace->isExpired()) {
            $availableWorkspace = $user->workspaces()
                ->where(function ($query) {
                    $query->whereNull('workspaces.expires_at')
                        ->orWhere('workspaces.expires_at', '>', now());
                })
                ->orderBy('workspaces.name')
                ->first();

            if ($availableWorkspace) {
                session(['current_workspace_id' => $availableWorkspace->id]);
                $user->rememberWorkspace($availableWorkspace);

                return redirect()->route('dashboard')
                    ->with('error', 'The workspace has expired. You were switched to an available workspace.');
            }

            abort(403, 'This workspace has expired. Contact the server administrator to restore access.');
        }

        $request->attributes->set('current_workspace', $workspace);
        if (
            ! config('app.safe_mode')
            && $this->features->enabled('two_factor_enforcement_enabled')
            && $workspace->require_two_factor
            && ! $user->hasTwoFactorEnabled()
        ) {
            return redirect()->route('two-factor.setup', ['forced' => 1]);
        }

        $this->abortIfBoundResourceIsOutsideWorkspace($request, $workspaceId);

        return $next($request);
    }

    private function abortIfBoundResourceIsOutsideWorkspace(Request $request, string $workspaceId): void
    {
        foreach ($request->route()?->parameters() ?? [] as $parameter) {
            if (
                $parameter instanceof Model
                && (
                    $parameter instanceof Flow
                    || $parameter instanceof Folder
                    || $parameter instanceof UserVariable
                    || $parameter instanceof NotificationChannel
                )
            ) {
                abort_unless($this->stringValue($parameter->getAttribute('workspace_id')) === $workspaceId, 404);
            }
        }
    }

    private function stringValue(mixed $value): string
    {
        return is_string($value) ? $value : '';
    }
}
