<?php

namespace App\Http\Controllers\Workspace;

use App\Enums\Authorization\Ability;
use App\Http\Controllers\Controller;
use App\Models\Flow;
use App\Models\McpAccessToken;
use App\Models\McpOauthClient;
use App\Models\McpOauthConnection;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceMcpSetting;
use App\Services\FeatureFlags\FeatureFlagService;
use App\Services\Mcp\McpToolService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Laravel\Passport\Client;
use Laravel\Passport\ClientRepository;
use Laravel\Passport\RefreshToken;
use Laravel\Passport\Token;

class WorkspaceMcpController extends Controller
{
    public function __construct(
        private McpToolService $mcpTools,
        private ClientRepository $passportClients,
    ) {}

    public function update(Request $request): JsonResponse
    {
        $this->features()->abortIfDisabled('mcp_enabled');
        $workspace = $this->workspace();
        $this->abortIfMcpSettingStale($workspace);
        $this->authorizeWorkspaceAdmin($request, $workspace);

        $validated = $request->validate([
            'enabled' => ['required', 'boolean'],
            'include_unexposed_flow_previews' => ['required', 'boolean'],
            'enabled_tools' => ['nullable', 'array'],
            'enabled_tools.*' => ['string', 'in:'.implode(',', $this->mcpTools->allToolNames())],
        ]);

        $setting = $workspace->mcpSetting()->updateOrCreate(
            ['workspace_id' => $workspace->id],
            [
                ...$validated,
                'enabled_tools' => array_values($validated['enabled_tools'] ?? $this->mcpTools->allToolNames()),
            ],
        );

        return response()->json($this->serializeSetting($setting));
    }

    public function storeToken(Request $request): JsonResponse
    {
        $this->features()->abortIfDisabled('mcp_enabled');
        $workspace = $this->workspace();
        $this->abortIfMcpSettingStale($workspace);
        $this->authorizeWorkspaceAdmin($request, $workspace);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        $plainToken = 'mcp_'.Str::random(56);
        /** @var User $user */
        $user = $request->user();
        $token = McpAccessToken::create([
            'workspace_id' => $workspace->id,
            'user_id' => $user->id,
            'name' => $validated['name'],
            'token_hash' => hash('sha256', $plainToken),
            'token_preview' => substr($plainToken, 0, 6).'...'.substr($plainToken, -4),
        ]);

        $token->load('user:id,name');

        return response()->json([
            'token' => $this->serializeToken($token),
            'plain_token' => $plainToken,
        ], 201);
    }

    public function revokeToken(Request $request, McpAccessToken $token): JsonResponse
    {
        $workspace = $this->workspace();
        $this->authorizeWorkspaceAdmin($request, $workspace);

        abort_unless($token->workspace_id === $workspace->id, 404);

        $token->update(['revoked_at' => now()]);
        $token->load('user:id,name');

        return response()->json($this->serializeToken($token));
    }

    public function storeOauthClient(Request $request): JsonResponse
    {
        $this->features()->abortIfDisabled('mcp_enabled');
        $workspace = $this->workspace();
        $this->authorizeWorkspaceAdmin($request, $workspace);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'redirect_uri' => ['required', 'url', 'max:2048'],
        ]);
        /** @var User $user */
        $user = $request->user();

        $client = $this->passportClients->createAuthorizationCodeGrantClient(
            $validated['name'],
            [$validated['redirect_uri']],
            false,
            $user,
        );

        $mcpClient = McpOauthClient::create([
            'workspace_id' => $workspace->id,
            'user_id' => $user->id,
            'oauth_client_id' => $client->id,
            'name' => $validated['name'],
            'redirect_uri' => $validated['redirect_uri'],
        ]);
        $mcpClient->load('user:id,name');

        return response()->json($this->serializeOauthClient($mcpClient), 201);
    }

    public function revokeOauthClient(Request $request, McpOauthClient $client): JsonResponse
    {
        $workspace = $this->workspace();
        $this->authorizeWorkspaceAdmin($request, $workspace);

        abort_unless($client->workspace_id === $workspace->id, 404);

        Client::where('id', $client->oauth_client_id)->update(['revoked' => true]);
        $tokenIds = Token::where('client_id', $client->oauth_client_id)->pluck('id');
        Token::whereIn('id', $tokenIds)->update(['revoked' => true]);
        RefreshToken::whereIn('access_token_id', $tokenIds)->update(['revoked' => true]);
        McpOauthConnection::where('workspace_id', $workspace->id)
            ->where('oauth_client_id', $client->oauth_client_id)
            ->update(['revoked_at' => now()]);

        $client->update(['revoked_at' => now()]);
        $client->load('user:id,name');

        return response()->json($this->serializeOauthClient($client));
    }

    public function revokeOauthConnection(Request $request, McpOauthConnection $connection): JsonResponse
    {
        $workspace = $this->workspace();
        $this->authorizeWorkspaceAdmin($request, $workspace);

        abort_unless($connection->workspace_id === $workspace->id, 404);

        Token::where('id', $connection->oauth_access_token_id)->update(['revoked' => true]);
        RefreshToken::where('access_token_id', $connection->oauth_access_token_id)->update(['revoked' => true]);
        $connection->update(['revoked_at' => now()]);
        $connection->load('user:id,name');

        return response()->json($this->serializeOauthConnection($connection));
    }

    public function updateFlow(Request $request, Flow $flow): JsonResponse
    {
        $this->features()->abortIfDisabled('mcp_enabled');
        $currentWorkspaceId = $this->workspaceIdFromSession();
        abort_unless($flow->workspace_id === $currentWorkspaceId, 404);
        $this->abortIfMcpSettingStale($this->workspace());
        $this->authorize(Ability::UPDATE->value, $flow);

        $validated = $request->validate([
            'available_in_mcp' => ['required', 'boolean'],
        ]);

        $flow->update($validated);

        return response()->json([
            'id' => $flow->id,
            'available_in_mcp' => (bool) $flow->available_in_mcp,
        ]);
    }

    public function bulkUpdateFlows(Request $request): JsonResponse
    {
        $this->features()->abortIfDisabled('mcp_enabled');
        $workspace = $this->workspace();
        $this->abortIfMcpSettingStale($workspace);
        $this->authorizeWorkspaceAdmin($request, $workspace);

        $validated = $request->validate([
            'available_in_mcp' => ['required', 'boolean'],
            'flow_ids' => ['sometimes', 'array'],
            'flow_ids.*' => ['string', 'distinct'],
        ]);

        $query = Flow::where('workspace_id', $workspace->id);
        if (! empty($validated['flow_ids'])) {
            $query->whereIn('id', $validated['flow_ids']);
        }

        $count = $query->update(['available_in_mcp' => $validated['available_in_mcp']]);

        return response()->json(['updated' => $count]);
    }

    private function workspace(): Workspace
    {
        $currentWorkspaceId = $this->workspaceIdFromSession();

        return Workspace::findOrFail($currentWorkspaceId);
    }

    private function authorizeWorkspaceAdmin(Request $request, Workspace $workspace): void
    {
        \Illuminate\Support\Facades\Gate::authorize(Ability::UPDATE->value, $workspace);
    }

    /** @return array<string, mixed> */
    private function serializeSetting(WorkspaceMcpSetting $setting): array
    {
        return [
            'enabled' => (bool) $setting->enabled,
            'include_unexposed_flow_previews' => (bool) $setting->include_unexposed_flow_previews,
            'enabled_tools' => $this->mcpTools->enabledToolNames($setting),
        ];
    }

    /** @return array<string, mixed> */
    private function serializeToken(McpAccessToken $token): array
    {
        return [
            'id' => $token->id,
            'name' => $token->name,
            'token_preview' => $token->token_preview,
            'last_used_at' => $token->last_used_at?->toIso8601String(),
            'revoked_at' => $token->revoked_at?->toIso8601String(),
            'created_at' => $token->created_at?->toIso8601String(),
            'user' => $token->user ? ['id' => $token->user->id, 'name' => $token->user->name] : null,
        ];
    }

    /** @return array<string, mixed> */
    private function serializeOauthClient(McpOauthClient $client): array
    {
        return [
            'id' => $client->id,
            'oauth_client_id' => $client->oauth_client_id,
            'name' => $client->name,
            'redirect_uri' => $client->redirect_uri,
            'revoked_at' => $client->revoked_at?->toIso8601String(),
            'created_at' => $client->created_at?->toIso8601String(),
            'user' => $client->user ? ['id' => $client->user->id, 'name' => $client->user->name] : null,
        ];
    }

    /** @return array<string, mixed> */
    private function serializeOauthConnection(McpOauthConnection $connection): array
    {
        return [
            'id' => $connection->id,
            'oauth_client_id' => $connection->oauth_client_id,
            'client_name' => $connection->client_name,
            'last_used_at' => $connection->last_used_at?->toIso8601String(),
            'revoked_at' => $connection->revoked_at?->toIso8601String(),
            'created_at' => $connection->created_at?->toIso8601String(),
            'user' => $connection->user ? ['id' => $connection->user->id, 'name' => $connection->user->name] : null,
        ];
    }

    private function features(): FeatureFlagService
    {
        return app(FeatureFlagService::class);
    }

    private function abortIfMcpSettingStale(Workspace $workspace): void
    {
        $setting = $workspace->mcpSetting()->first();
        if ($setting) {
            $this->features()->abortIfStale($setting);
        }
    }
}
