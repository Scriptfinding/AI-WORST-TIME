<?php

namespace App\Http\Controllers\Integration\Repository\Vendor\Github;

use App\DTO\Integration\Repository\GithubRepositoryConfig;
use App\Enums\Authorization\Ability;
use App\Enums\Integration\IntegrationRepositoryProviderEnum;
use App\Events\Integration\Repository\Vendor\Github\GithubAppCallbackReceived;
use App\Events\Integration\Repository\Vendor\Github\GithubAppInstallationReceived;
use App\Http\Controllers\Controller;
use App\Models\Integration;
use App\Models\User;
use App\Services\FeatureFlags\FeatureFlagService;
use App\Services\Integration\Config\IntegrationConfigHydrator;
use App\Services\Integration\Repository\Vendor\Github\GithubRepositoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class GithubRepositoryController extends Controller
{
    public function __construct(
        private readonly GithubRepositoryService $githubRepositoryService,
        private readonly IntegrationConfigHydrator $configHydrator,
    ) {}

    public function manifest(Request $request): JsonResponse
    {
        app(FeatureFlagService::class)->abortIfDisabled('vcs_enabled');
        Gate::authorize(Ability::CREATE->value, Integration::class);

        $state = bin2hex(random_bytes(32));
        $webhookId = Integration::newWebhookId();
        session([
            'github_app_manifest_state' => [
                'value' => $state,
                'webhook_id' => $webhookId,
                'expires_at' => now()->addMinutes(10)->timestamp,
            ],
        ]);

        return response()->json([
            'manifest' => $this->githubRepositoryService->buildManifest($webhookId),
            'action_url' => 'https://github.com/settings/apps/new',
            'state' => $state,
        ]);
    }

    public function storePendingName(Request $request): JsonResponse
    {
        app(FeatureFlagService::class)->abortIfDisabled('vcs_enabled');
        Gate::authorize(Ability::CREATE->value, Integration::class);
        /** @var array{name: string} $validated */
        $validated = $request->validate(['name' => 'required|string|max:255']);
        $name = $validated['name'];
        session(['github_app_pending_name' => $name]);

        return response()->json(['ok' => true]);
    }

    public function callback(Request $request): RedirectResponse
    {
        app(FeatureFlagService::class)->abortIfDisabled('vcs_enabled');
        Gate::authorize(Ability::CREATE->value, Integration::class);
        $storedState = session()->pull('github_app_manifest_state');
        $returnedState = $request->input('state');

        if (
            ! is_array($storedState)
            || ! is_string($storedState['value'] ?? null)
            || ! is_string($storedState['webhook_id'] ?? null)
            || preg_match('/\A[a-f0-9]{64}\z/', $storedState['webhook_id']) !== 1
            || ! is_numeric($storedState['expires_at'] ?? null)
            || (int) $storedState['expires_at'] < now()->timestamp
            || ! is_string($returnedState)
            || ! hash_equals($storedState['value'], $returnedState)
        ) {
            session()->forget('github_app_pending_name');

            return redirect('/integrations')->with('error', 'GitHub returned an invalid or expired manifest state.');
        }

        $code = $request->input('code');

        if (! is_string($code) || $code === '') {
            session()->forget('github_app_pending_name');

            return redirect('/integrations')->with('error', 'GitHub did not return a valid code.');
        }

        $pendingName = session()->pull('github_app_pending_name');
        if (! is_string($pendingName) && $pendingName !== null) {
            return redirect('/integrations')->with('error', 'The pending GitHub App name is invalid.');
        }
        $currentWorkspaceId = $this->workspaceIdFromSession();
        /** @var User $user */
        $user = $request->user();

        $event = new GithubAppCallbackReceived(
            code: $code,
            webhookId: $storedState['webhook_id'],
            workspaceId: $currentWorkspaceId,
            userId: $user->id,
            pendingName: $pendingName,
        );

        event($event);

        if ($event->error) {
            return redirect('/integrations')->with('error', $event->error);
        }

        return redirect('/integrations')->with('external_app_integration_id', $event->integrationId);
    }

    public function setup(Request $request): RedirectResponse
    {
        app(FeatureFlagService::class)->abortIfDisabled('vcs_enabled');
        $installationId = $request->string('installation_id')->toString();

        if (! $installationId) {
            return redirect('/integrations')->with('error', 'Missing installation ID.');
        }

        $integrationId = $request->string('integration_id')->toString();
        $currentWorkspaceId = $this->workspaceIdFromSession();
        $integration = $integrationId
            ? Integration::where('workspace_id', $currentWorkspaceId)->findOrFail($integrationId)
            : Integration::where('workspace_id', $currentWorkspaceId)
                ->where('provider', 'github')
                ->where('category', 'repository')
                ->where('stale', false)
                ->get()
                ->first(fn (Integration $candidate) => Gate::allows(Ability::UPDATE->value, $candidate));

        abort_unless($integration instanceof Integration, 404, 'No GitHub App found. Create one first.');
        Gate::authorize(Ability::UPDATE->value, $integration);
        $this->abortIfReadonly($integration);

        $event = new GithubAppInstallationReceived(
            installationId: $installationId,
            workspaceId: $currentWorkspaceId,
            integrationId: $integration->id,
        );

        event($event);

        if ($event->error) {
            return redirect('/integrations')->with('error', $event->error);
        }

        return redirect('/integrations')->with('success', 'GitHub App installed successfully.');
    }

    public function installUrl(Request $request): JsonResponse
    {
        app(FeatureFlagService::class)->abortIfDisabled('vcs_enabled');
        $integrationId = $request->string('integration_id')->toString();
        $currentWorkspaceId = $this->workspaceIdFromSession();

        $integration = $integrationId
            ? Integration::where('workspace_id', $currentWorkspaceId)->find($integrationId)
            : Integration::where('workspace_id', $currentWorkspaceId)
                ->where('provider', 'github')
                ->where('category', 'repository')
                ->where('stale', false)
                ->get()
                ->first(fn (Integration $candidate) => Gate::allows(Ability::UPDATE->value, $candidate));

        if ($integration instanceof Integration) {
            app(FeatureFlagService::class)->abortIfStale($integration);
            Gate::authorize(Ability::UPDATE->value, $integration);
            $this->abortIfReadonly($integration);
        }

        $config = $this->configHydrator->repository(
            IntegrationRepositoryProviderEnum::GITHUB,
            $integration instanceof Integration ? ($integration->config ?? []) : [],
        );
        if (! $config instanceof GithubRepositoryConfig) {
            throw new \LogicException('Expected GitHub repository configuration.');
        }
        $slug = $config->slug();

        if ($slug === '') {
            return response()->json(['error' => 'No GitHub App found.'], 404);
        }

        return response()->json([
            'url' => $this->githubRepositoryService->installUrl($slug),
        ]);
    }

    private function abortIfReadonly(Integration $integration): void
    {
        abort_if(
            (bool) $integration->getAttribute('is_readonly'),
            403,
            'This integration is managed by the instance and is read-only.',
        );
    }
}
