<?php

namespace App\Http\Middleware;

use App\Models\McpOauthClient;
use App\Models\McpOauthConnection;
use App\Models\Workspace;
use App\Services\FeatureFlags\FeatureFlagService;
use Closure;
use Illuminate\Http\Request;
use Laravel\Passport\Client;
use Laravel\Passport\Token;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateMcpOAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        $features = app(FeatureFlagService::class);
        if (! $features->enabled('mcp_enabled')) {
            return response()->json(['error' => 'MCP is disabled for this instance.'], 403);
        }

        $user = $request->user('api');

        if (! $user) {
            return response()->json(['error' => 'OAuth token required.'], 401);
        }

        $routeWorkspace = $request->route('workspace');
        $workspace = $routeWorkspace instanceof Workspace
            ? $routeWorkspace
            : (is_string($routeWorkspace)
                ? Workspace::where('id', $routeWorkspace)->first()
                    ?? Workspace::where('lookup_key', $routeWorkspace)->first()
                : null);

        if (! $workspace) {
            return response()->json(['error' => 'Workspace not found.'], 404);
        }

        if (! $user->isAdmin() && $workspace->isExpired()) {
            return response()->json(['error' => 'This workspace has expired.'], 403);
        }

        if (! $user->isAdmin() && ! $user->belongsToWorkspace($workspace)) {
            return response()->json(['error' => 'Workspace access revoked.'], 403);
        }

        $setting = $workspace->mcpSetting;
        if (! $setting || $setting->stale || ! $setting->enabled) {
            return response()->json(['error' => 'MCP is disabled for this workspace.'], 403);
        }

        /** @var Token|null $token */
        $token = $user->token();
        if (! $token || ($token->can('mcp') === false)) {
            return response()->json(['error' => 'OAuth token is missing the mcp scope.'], 403);
        }

        $client = Client::find($token->client_id);
        $mcpClient = McpOauthClient::where('workspace_id', $workspace->id)
            ->where('oauth_client_id', $token->client_id)
            ->whereNull('revoked_at')
            ->where('stale', false)
            ->first();
        if (! $mcpClient) {
            return response()->json(['error' => 'OAuth client is unavailable.'], 403);
        }

        $connection = McpOauthConnection::updateOrCreate(
            ['oauth_access_token_id' => $token->id],
            [
                'workspace_id' => $workspace->id,
                'user_id' => $user->id,
                'oauth_client_id' => $token->client_id,
                'client_name' => $client->name ?? 'OAuth client',
                'last_used_at' => now(),
                'revoked_at' => null,
            ],
        );

        $request->setUserResolver(fn () => $user);
        $request->attributes->set('mcpOauthConnection', $connection);
        $request->attributes->set('mcpWorkspace', $workspace);
        $request->attributes->set('mcpSetting', $setting);
        $request->attributes->set('mcpArtifactRouteName', 'mcp.oauth.artifacts.download');

        return $next($request);
    }
}
