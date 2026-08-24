<?php

namespace App\Http\Middleware;

use App\Models\McpAccessToken;
use App\Models\User;
use App\Models\Workspace;
use App\Services\FeatureFlags\FeatureFlagService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateMcpToken
{
    public function handle(Request $request, Closure $next): Response
    {
        $features = app(FeatureFlagService::class);
        if (! $features->enabled('mcp_enabled')) {
            return response()->json(['error' => 'MCP is disabled for this instance.'], 403);
        }

        $token = $request->bearerToken();

        if (! $token) {
            return response()->json(['error' => 'MCP token required.'], 401);
        }

        $accessToken = McpAccessToken::with(['user', 'workspace.mcpSetting'])
            ->where('token_hash', hash('sha256', $token))
            ->whereNull('revoked_at')
            ->where('stale', false)
            ->first();

        if (! $accessToken) {
            return response()->json(['error' => 'Invalid MCP token.'], 401);
        }

        /** @var McpAccessToken $accessToken */
        $workspace = $accessToken->workspace;
        $user = $accessToken->user;
        if (! $workspace instanceof Workspace || ! $user instanceof User) {
            return response()->json(['error' => 'Invalid MCP token.'], 401);
        }

        if (! $user->isAdmin() && $workspace->isExpired()) {
            return response()->json(['error' => 'This workspace has expired.'], 403);
        }

        $setting = $workspace->mcpSetting;
        if (! $setting || $setting->stale || ! $setting->enabled) {
            return response()->json(['error' => 'MCP is disabled for this workspace.'], 403);
        }

        if (! $user->isAdmin() && ! $user->belongsToWorkspace($workspace)) {
            return response()->json(['error' => 'Workspace access revoked.'], 403);
        }

        $accessToken->update(['last_used_at' => now()]);

        $request->setUserResolver(fn () => $user);
        $request->attributes->set('mcpAccessToken', $accessToken);
        $request->attributes->set('mcpWorkspace', $workspace);
        $request->attributes->set('mcpSetting', $setting);

        return $next($request);
    }
}
