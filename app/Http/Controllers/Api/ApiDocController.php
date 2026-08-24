<?php

namespace App\Http\Controllers\Api;

use App\Contracts\BrandingProvider;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class ApiDocController extends Controller
{
    public function ui(Request $request): View
    {
        $versions = $request->user()->onboarding_versions ?? [];

        return view('api-docs', [
            'onboardingVersion' => (int) ($versions['api.docs'] ?? 0),
            'onboardingDisabled' => (int) ($versions['onboarding.disabled'] ?? 0) >= 1,
        ]);
    }

    public function spec(): JsonResponse
    {
        /** @var string $appUrl */
        $appUrl = config('app.url');
        $baseUrl = rtrim($appUrl, '/');

        return response()->json([
            'openapi' => '3.0.3',
            'info' => [
                'title' => app(BrandingProvider::class)->current()['name'].' API',
                'description' => 'Trigger flows, list runs, fetch results, and download artifacts. Authenticate with a Bearer API key generated from your profile.',
                'version' => '1.0.0',
            ],
            'servers' => [
                ['url' => $baseUrl.'/api/v1', 'description' => 'API v1'],
            ],
            'components' => [
                'securitySchemes' => [
                    'bearerAuth' => [
                        'type' => 'http',
                        'scheme' => 'bearer',
                        'description' => 'API key generated from your profile page.',
                    ],
                ],
                'schemas' => [
                    'Error' => [
                        'type' => 'object',
                        'properties' => [
                            'error' => ['type' => 'string'],
                        ],
                    ],
                    'TriggerResponse' => [
                        'type' => 'object',
                        'properties' => [
                            'run_id' => ['type' => 'integer'],
                            'flow_id' => ['type' => 'string'],
                            'status' => ['type' => 'string'],
                        ],
                    ],
                    'Run' => [
                        'type' => 'object',
                        'properties' => [
                            'id' => ['type' => 'integer'],
                            'flow_id' => ['type' => 'string'],
                            'trigger_id' => ['type' => 'string', 'nullable' => true],
                            'status' => ['type' => 'string', 'enum' => ['pending', 'running', 'success', 'error', 'cancelled']],
                            'output' => ['type' => 'object', 'nullable' => true],
                            'error_message' => ['type' => 'string', 'nullable' => true],
                            'duration_ms' => ['type' => 'integer', 'nullable' => true],
                            'legend' => ['type' => 'string', 'nullable' => true],
                            'has_recording' => ['type' => 'boolean'],
                            'secrets_redacted' => ['type' => 'boolean', 'description' => 'Secret values are always masked in API responses.'],
                            'triggered_by_user' => [
                                'type' => 'object',
                                'nullable' => true,
                                'properties' => [
                                    'id' => ['type' => 'string'],
                                    'name' => ['type' => 'string'],
                                ],
                            ],
                            'waiting_for_human_validation' => ['type' => 'boolean'],
                            'human_validation_wait_id' => ['type' => 'string', 'format' => 'uuid', 'nullable' => true],
                            'artifacts' => [
                                'type' => 'object',
                                'description' => 'Included in getRun responses. Recording contains file, player, and lastshot URLs when available.',
                                'properties' => [
                                    'downloads' => ['type' => 'array', 'items' => ['type' => 'object']],
                                    'screenshots' => ['type' => 'array', 'items' => ['type' => 'object']],
                                    'recording' => [
                                        'type' => 'object',
                                        'nullable' => true,
                                        'properties' => [
                                            'file' => ['type' => 'string', 'nullable' => true],
                                            'player' => ['type' => 'string'],
                                            'lastshot' => ['type' => 'string', 'nullable' => true],
                                        ],
                                    ],
                                ],
                            ],
                            'console_logs' => ['type' => 'array', 'nullable' => true, 'description' => 'Only included when logs=1 is passed.', 'items' => ['type' => 'object']],
                            'code_snapshot' => ['type' => 'string', 'nullable' => true, 'description' => 'Only included when code=1 is passed.'],
                            'created_at' => ['type' => 'string', 'format' => 'date-time'],
                            'updated_at' => ['type' => 'string', 'format' => 'date-time'],
                        ],
                    ],
                    'RunResult' => [
                        'type' => 'object',
                        'properties' => [
                            'run_id' => ['type' => 'integer'],
                            'status' => ['type' => 'string'],
                            'output' => ['type' => 'object', 'nullable' => true],
                            'error_message' => ['type' => 'string', 'nullable' => true],
                            'duration_ms' => ['type' => 'integer', 'nullable' => true],
                        ],
                    ],
                    'ContinueRunResponse' => [
                        'type' => 'object',
                        'properties' => [
                            'run_id' => ['type' => 'integer'],
                            'status' => ['type' => 'string'],
                            'continue_requested' => ['type' => 'boolean'],
                        ],
                    ],
                    'PaginatedRuns' => [
                        'type' => 'object',
                        'properties' => [
                            'data' => [
                                'type' => 'array',
                                'items' => ['$ref' => '#/components/schemas/Run'],
                            ],
                            'current_page' => ['type' => 'integer'],
                            'last_page' => ['type' => 'integer'],
                            'per_page' => ['type' => 'integer'],
                            'total' => ['type' => 'integer'],
                        ],
                    ],
                    'FlowSummary' => [
                        'type' => 'object',
                        'properties' => [
                            'id' => ['type' => 'string'],
                            'name' => ['type' => 'string'],
                            'description' => ['type' => 'string', 'nullable' => true],
                            'flow_type' => ['type' => 'string', 'enum' => ['code', 'nodal']],
                            'folder_id' => ['type' => 'string', 'nullable' => true],
                            'workspace_folder_id' => ['type' => 'string', 'nullable' => true],
                            'is_published' => ['type' => 'boolean'],
                            'queue_index' => ['type' => 'integer', 'nullable' => true, 'minimum' => 1, 'maximum' => config()->integer('puppetflow.queues_counter', 1)],
                            'default_inputs' => ['type' => 'object', 'nullable' => true, 'additionalProperties' => true],
                            'updated_at' => ['type' => 'string', 'format' => 'date-time'],
                        ],
                    ],
                    'FlowDetail' => [
                        'type' => 'object',
                        'properties' => [
                            'id' => ['type' => 'string'],
                            'name' => ['type' => 'string'],
                            'description' => ['type' => 'string', 'nullable' => true],
                            'readme' => ['type' => 'string', 'nullable' => true],
                            'code' => ['type' => 'string', 'nullable' => true],
                            'source_type' => ['type' => 'string', 'enum' => ['code', 'repository', 'library']],
                            'flow_type' => ['type' => 'string', 'enum' => ['code', 'nodal']],
                            'nodal_graph' => ['type' => 'object', 'nullable' => true, 'additionalProperties' => true],
                            'folder_id' => ['type' => 'string', 'nullable' => true],
                            'workspace_folder_id' => ['type' => 'string', 'nullable' => true],
                            'workspace_id' => ['type' => 'string'],
                            'team_id' => ['type' => 'string', 'nullable' => true],
                            'owner_id' => ['type' => 'string'],
                            'is_published' => ['type' => 'boolean'],
                            'queue_index' => ['type' => 'integer', 'nullable' => true, 'minimum' => 1, 'maximum' => config()->integer('puppetflow.queues_counter', 1)],
                            'visibility' => ['type' => 'string', 'enum' => ['owner', 'workspace', 'team']],
                            'manual_input' => ['type' => 'object', 'nullable' => true, 'additionalProperties' => true],
                            'default_inputs' => ['type' => 'object', 'nullable' => true, 'additionalProperties' => true],
                            'timeout_seconds' => ['type' => 'integer', 'nullable' => true],
                            'operator_seconds' => ['type' => 'integer', 'nullable' => true],
                            'max_retries' => ['type' => 'integer', 'nullable' => true],
                            'include_raw_output' => ['type' => 'boolean'],
                            'include_input_in_output' => ['type' => 'boolean'],
                            'include_context_in_output' => ['type' => 'boolean'],
                            'always_success_response' => ['type' => 'boolean'],
                            'export_artifacts_screenshots' => ['type' => 'boolean'],
                            'export_artifacts_downloads' => ['type' => 'boolean'],
                            'export_artifacts_recording' => ['type' => 'boolean'],
                            'runs_retention_limit' => ['type' => 'integer', 'nullable' => true],
                            'viewport_width' => ['type' => 'integer', 'nullable' => true],
                            'viewport_height' => ['type' => 'integer', 'nullable' => true],
                            'keyboard_speed' => ['type' => 'integer', 'nullable' => true],
                            'disable_web_security' => ['type' => 'boolean'],
                            'library_locked' => ['type' => 'boolean'],
                            'library_namespace' => ['type' => 'string', 'nullable' => true],
                            'library_reference' => ['type' => 'string', 'nullable' => true],
                            'library_source_path' => ['type' => 'string', 'nullable' => true],
                            'library_source_sha' => ['type' => 'string', 'nullable' => true],
                            'library_source_url' => ['type' => 'string', 'nullable' => true],
                            'library_imported_at' => ['type' => 'string', 'format' => 'date-time', 'nullable' => true],
                            'last_run_at' => ['type' => 'string', 'format' => 'date-time', 'nullable' => true],
                            'icon_type' => ['type' => 'string', 'nullable' => true],
                            'icon_value' => ['type' => 'string', 'nullable' => true],
                            'icon_color' => ['type' => 'string', 'nullable' => true],
                            'cover_color' => ['type' => 'string', 'nullable' => true],
                            'icon_url' => ['type' => 'string', 'nullable' => true],
                            'created_at' => ['type' => 'string', 'format' => 'date-time'],
                            'updated_at' => ['type' => 'string', 'format' => 'date-time'],
                        ],
                    ],
                    'FolderSummary' => [
                        'type' => 'object',
                        'properties' => [
                            'id' => ['type' => 'string'],
                            'name' => ['type' => 'string'],
                            'parent_id' => ['type' => 'string', 'nullable' => true],
                            'is_shared' => ['type' => 'boolean'],
                        ],
                    ],
                    'Workspace' => [
                        'type' => 'object',
                        'properties' => [
                            'id' => ['type' => 'string'],
                            'name' => ['type' => 'string'],
                            'slug' => ['type' => 'string'],
                            'lookup_key' => ['type' => 'string', 'nullable' => true],
                            'owner_id' => ['type' => 'string', 'nullable' => true],
                            'expires_at' => ['type' => 'string', 'format' => 'date-time', 'nullable' => true],
                            'preferences' => [
                                'type' => 'object',
                                'properties' => [
                                    'runs_retention_default' => ['type' => 'integer'],
                                    'runs_retention_max' => ['type' => 'integer'],
                                    'default_flow_timeout_seconds' => ['type' => 'integer'],
                                    'max_flow_timeout_seconds' => ['type' => 'integer'],
                                    'max_retries_default' => ['type' => 'integer'],
                                    'max_retries_max' => ['type' => 'integer'],
                                    'viewport_width' => ['type' => 'integer'],
                                    'viewport_height' => ['type' => 'integer'],
                                    'keyboard_speed' => ['type' => 'integer'],
                                    'allow_trigger_advertising' => ['type' => 'boolean'],
                                    'require_two_factor' => [
                                        'type' => 'boolean',
                                        'description' => 'Effective workspace-wide 2FA requirement. Requires the two-factor enforcement entitlement.',
                                    ],
                                    'default_flow_code' => ['type' => 'string', 'nullable' => true],
                                ],
                            ],
                            'appearance' => [
                                'type' => 'object',
                                'properties' => [
                                    'icon_type' => ['type' => 'string', 'enum' => ['emoji', 'color', 'upload'], 'nullable' => true],
                                    'icon_value' => ['type' => 'string', 'nullable' => true],
                                    'icon_color' => ['type' => 'string', 'nullable' => true],
                                    'icon_url' => ['type' => 'string', 'nullable' => true],
                                ],
                            ],
                            'flows_count' => ['type' => 'integer', 'nullable' => true],
                            'users_count' => ['type' => 'integer', 'nullable' => true],
                            'created_at' => ['type' => 'string', 'format' => 'date-time', 'nullable' => true],
                            'updated_at' => ['type' => 'string', 'format' => 'date-time', 'nullable' => true],
                        ],
                    ],
                    'WorkspacePayload' => [
                        'type' => 'object',
                        'properties' => [
                            'name' => ['type' => 'string', 'maxLength' => 255],
                            'lookup_key' => [
                                'type' => 'string',
                                'nullable' => true,
                                'maxLength' => 255,
                                'pattern' => '^[a-z][a-z0-9_-]*$',
                                'description' => 'Unique stable identifier used for idempotent creation and workspace lookup.',
                            ],
                            'expires_at' => [
                                'type' => 'string',
                                'format' => 'date-time',
                                'nullable' => true,
                                'description' => 'Optional workspace expiration date. Send null to remove an existing expiration.',
                            ],
                            'runs_retention_default' => ['type' => 'integer', 'minimum' => 0, 'maximum' => 100000],
                            'runs_retention_max' => ['type' => 'integer', 'minimum' => 0, 'maximum' => 100000],
                            'default_flow_timeout_seconds' => ['type' => 'integer', 'minimum' => 0, 'maximum' => 9999999],
                            'max_flow_timeout_seconds' => ['type' => 'integer', 'minimum' => 0, 'maximum' => 9999999],
                            'max_retries_default' => ['type' => 'integer', 'minimum' => 0, 'maximum' => 255],
                            'max_retries_max' => ['type' => 'integer', 'minimum' => 0, 'maximum' => 255],
                            'viewport_width' => ['type' => 'integer', 'minimum' => 320, 'maximum' => 3840],
                            'viewport_height' => ['type' => 'integer', 'minimum' => 200, 'maximum' => 2160],
                            'keyboard_speed' => ['type' => 'integer', 'minimum' => 0, 'maximum' => 10000],
                            'icon_type' => ['type' => 'string', 'enum' => ['emoji', 'color']],
                            'icon_value' => ['type' => 'string', 'nullable' => true, 'maxLength' => 100],
                            'icon_color' => ['type' => 'string', 'nullable' => true, 'maxLength' => 7],
                            'allow_trigger_advertising' => ['type' => 'boolean'],
                            'require_two_factor' => [
                                'type' => 'boolean',
                                'description' => 'Require 2FA for all workspace members. Requires the two-factor enforcement entitlement.',
                            ],
                            'default_flow_code' => ['type' => 'string', 'nullable' => true, 'maxLength' => 65000],
                            'preferences' => [
                                'type' => 'object',
                                'description' => 'Optional nested form for workspace preferences. The same preference fields may also be sent at the top level.',
                                'properties' => [
                                    'runs_retention_default' => ['type' => 'integer', 'minimum' => 0, 'maximum' => 100000],
                                    'runs_retention_max' => ['type' => 'integer', 'minimum' => 0, 'maximum' => 100000],
                                    'default_flow_timeout_seconds' => ['type' => 'integer', 'minimum' => 0, 'maximum' => 9999999],
                                    'max_flow_timeout_seconds' => ['type' => 'integer', 'minimum' => 0, 'maximum' => 9999999],
                                    'max_retries_default' => ['type' => 'integer', 'minimum' => 0, 'maximum' => 255],
                                    'max_retries_max' => ['type' => 'integer', 'minimum' => 0, 'maximum' => 255],
                                    'viewport_width' => ['type' => 'integer', 'minimum' => 320, 'maximum' => 3840],
                                    'viewport_height' => ['type' => 'integer', 'minimum' => 200, 'maximum' => 2160],
                                    'keyboard_speed' => ['type' => 'integer', 'minimum' => 0, 'maximum' => 10000],
                                    'allow_trigger_advertising' => ['type' => 'boolean'],
                                    'require_two_factor' => [
                                        'type' => 'boolean',
                                        'description' => 'Require 2FA for all workspace members. Requires the two-factor enforcement entitlement.',
                                    ],
                                    'default_flow_code' => ['type' => 'string', 'nullable' => true, 'maxLength' => 65000],
                                ],
                            ],
                            'appearance' => [
                                'type' => 'object',
                                'description' => 'Optional nested form for API-managed workspace appearance. The same appearance fields may also be sent at the top level.',
                                'properties' => [
                                    'icon_type' => ['type' => 'string', 'enum' => ['emoji', 'color']],
                                    'icon_value' => ['type' => 'string', 'nullable' => true, 'maxLength' => 100],
                                    'icon_color' => ['type' => 'string', 'nullable' => true, 'maxLength' => 7],
                                ],
                            ],
                        ],
                    ],
                    'User' => [
                        'type' => 'object',
                        'properties' => [
                            'id' => [
                                'type' => 'string',
                                'pattern' => '^user_[A-Za-z0-9]{12}$',
                                'example' => 'user_k8Zt3xQ9mA2f',
                            ],
                            'name' => ['type' => 'string'],
                            'first_name' => ['type' => 'string', 'nullable' => true],
                            'last_name' => ['type' => 'string', 'nullable' => true],
                            'email' => ['type' => 'string', 'format' => 'email'],
                            'role' => ['type' => 'string', 'enum' => ['admin', 'member']],
                            'can_create_workspace' => ['type' => 'boolean'],
                            'timezone' => ['type' => 'string', 'nullable' => true],
                            'explorer_view_mode' => ['type' => 'string', 'enum' => ['grid', 'list'], 'nullable' => true],
                            'workspaces' => [
                                'type' => 'array',
                                'items' => [
                                    'type' => 'object',
                                    'properties' => [
                                        'id' => ['type' => 'string'],
                                        'name' => ['type' => 'string'],
                                        'role' => ['type' => 'string', 'enum' => ['admin', 'manager', 'member']],
                                    ],
                                ],
                            ],
                            'teams' => [
                                'type' => 'array',
                                'items' => [
                                    'type' => 'object',
                                    'properties' => [
                                        'id' => ['type' => 'string'],
                                        'workspace_id' => ['type' => 'string'],
                                        'name' => ['type' => 'string'],
                                    ],
                                ],
                            ],
                            'created_at' => ['type' => 'string', 'format' => 'date-time', 'nullable' => true],
                            'updated_at' => ['type' => 'string', 'format' => 'date-time', 'nullable' => true],
                        ],
                    ],
                    'UserPayload' => [
                        'type' => 'object',
                        'properties' => [
                            'name' => ['type' => 'string', 'maxLength' => 255],
                            'first_name' => ['type' => 'string', 'maxLength' => 120],
                            'last_name' => ['type' => 'string', 'maxLength' => 120],
                            'email' => ['type' => 'string', 'format' => 'email'],
                            'password' => ['type' => 'string', 'format' => 'password'],
                            'role' => ['type' => 'string', 'enum' => ['admin', 'member']],
                            'can_create_workspace' => ['type' => 'boolean'],
                            'timezone' => ['type' => 'string'],
                            'explorer_view_mode' => ['type' => 'string', 'enum' => ['grid', 'list']],
                            'workspaces' => [
                                'type' => 'array',
                                'items' => [
                                    'type' => 'object',
                                    'properties' => [
                                        'id' => ['type' => 'string'],
                                        'role' => ['type' => 'string', 'enum' => ['admin', 'manager', 'member']],
                                    ],
                                ],
                            ],
                            'team_ids' => ['type' => 'array', 'items' => ['type' => 'string']],
                        ],
                    ],
                    'Team' => [
                        'type' => 'object',
                        'properties' => [
                            'id' => ['type' => 'string', 'example' => 'team_k8Zt3xQ9mA2f'],
                            'workspace_id' => ['type' => 'string'],
                            'name' => ['type' => 'string'],
                            'users_count' => ['type' => 'integer', 'nullable' => true],
                            'users' => [
                                'type' => 'array',
                                'items' => [
                                    'type' => 'object',
                                    'properties' => [
                                        'id' => ['type' => 'string'],
                                        'name' => ['type' => 'string'],
                                        'email' => ['type' => 'string', 'format' => 'email'],
                                        'role' => ['type' => 'string'],
                                        'workspace_role' => ['type' => 'string', 'enum' => ['admin', 'manager', 'member']],
                                        'can_create_workspace' => ['type' => 'boolean'],
                                    ],
                                ],
                            ],
                            'created_at' => ['type' => 'string', 'format' => 'date-time', 'nullable' => true],
                            'updated_at' => ['type' => 'string', 'format' => 'date-time', 'nullable' => true],
                        ],
                    ],
                    'RunSummary' => [
                        'type' => 'object',
                        'properties' => [
                            'id' => ['type' => 'integer'],
                            'flow_id' => ['type' => 'string'],
                            'trigger_id' => ['type' => 'string', 'nullable' => true],
                            'status' => ['type' => 'string', 'enum' => ['pending', 'running', 'success', 'error', 'cancelled']],
                            'duration_ms' => ['type' => 'integer', 'nullable' => true],
                            'created_at' => ['type' => 'string', 'format' => 'date-time'],
                        ],
                    ],
                    'ArtifactList' => [
                        'type' => 'array',
                        'items' => [
                            'type' => 'object',
                            'properties' => [
                                'name' => ['type' => 'string'],
                                'size' => ['type' => 'integer'],
                                'url' => ['type' => 'string'],
                            ],
                        ],
                    ],
                ],
                'parameters' => [
                    'id' => [
                        'name' => 'id',
                        'in' => 'path',
                        'required' => true,
                        'description' => 'Flow ID.',
                        'schema' => ['type' => 'string'],
                    ],
                    'run' => [
                        'name' => 'run',
                        'in' => 'path',
                        'required' => true,
                        'description' => 'Run ID.',
                        'schema' => ['type' => 'integer'],
                    ],
                    'workspace' => [
                        'name' => 'workspace',
                        'in' => 'path',
                        'required' => true,
                        'description' => 'Workspace ID. Workspace detail and update endpoints also accept a lookup key.',
                        'schema' => ['type' => 'string'],
                    ],
                    'user' => [
                        'name' => 'user',
                        'in' => 'path',
                        'required' => true,
                        'description' => 'User ID.',
                        'schema' => ['type' => 'string'],
                    ],
                    'team' => [
                        'name' => 'team',
                        'in' => 'path',
                        'required' => true,
                        'description' => 'Team ID.',
                        'schema' => ['type' => 'string'],
                    ],
                ],
            ],
            'security' => [
                ['bearerAuth' => []],
            ],
            'paths' => [
                '/users' => [
                    'get' => [
                        'tags' => ['Users'],
                        'summary' => 'List users',
                        'description' => 'Lists users. Requires an instance admin API key.',
                        'operationId' => 'listUsers',
                        'parameters' => [
                            ['name' => 'search', 'in' => 'query', 'required' => false, 'description' => 'Search by name or email.', 'schema' => ['type' => 'string']],
                            ['name' => 'limit', 'in' => 'query', 'required' => false, 'description' => 'Maximum items to return.', 'schema' => ['type' => 'integer', 'default' => 50, 'maximum' => 100]],
                        ],
                        'responses' => [
                            '200' => ['description' => 'List of users.', 'content' => ['application/json' => ['schema' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/User']]]]],
                            '401' => ['description' => 'Unauthorized.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                            '403' => ['description' => 'Forbidden.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                        ],
                    ],
                    'post' => [
                        'tags' => ['Users'],
                        'summary' => 'Create a user',
                        'description' => 'Creates a user and optionally assigns workspace roles and teams. Requires an instance admin API key.',
                        'operationId' => 'createUser',
                        'requestBody' => [
                            'required' => true,
                            'content' => [
                                'application/json' => [
                                    'schema' => [
                                        'allOf' => [
                                            ['$ref' => '#/components/schemas/UserPayload'],
                                            ['required' => ['email', 'password']],
                                        ],
                                    ],
                                    'example' => [
                                        'first_name' => 'Jane',
                                        'last_name' => 'Doe',
                                        'email' => 'jane@example.com',
                                        'password' => 'secret-password',
                                        'role' => 'member',
                                        'can_create_workspace' => true,
                                        'workspaces' => [
                                            ['id' => 'work_k8Zt3xQ9mA2f', 'role' => 'manager'],
                                        ],
                                        'team_ids' => ['team_k8Zt3xQ9mA2f'],
                                    ],
                                ],
                            ],
                        ],
                        'responses' => [
                            '201' => ['description' => 'User created.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/User']]]],
                            '401' => ['description' => 'Unauthorized.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                            '403' => ['description' => 'Forbidden.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                            '422' => ['description' => 'Validation error.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                        ],
                    ],
                ],
                '/users/{user}' => [
                    'get' => [
                        'tags' => ['Users'],
                        'summary' => 'Get a user',
                        'description' => 'Returns a user with workspace and team assignments. Requires an instance admin API key.',
                        'operationId' => 'getUser',
                        'parameters' => [
                            ['$ref' => '#/components/parameters/user'],
                        ],
                        'responses' => [
                            '200' => ['description' => 'User details.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/User']]]],
                            '401' => ['description' => 'Unauthorized.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                            '403' => ['description' => 'Forbidden.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                        ],
                    ],
                    'patch' => [
                        'tags' => ['Users'],
                        'summary' => 'Update a user',
                        'description' => 'Updates profile, password, global role, workspace roles, and team assignments. Requires an instance admin API key.',
                        'operationId' => 'updateUser',
                        'parameters' => [
                            ['$ref' => '#/components/parameters/user'],
                        ],
                        'requestBody' => [
                            'required' => true,
                            'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/UserPayload']]],
                        ],
                        'responses' => [
                            '200' => ['description' => 'User updated.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/User']]]],
                            '400' => ['description' => 'Invalid self-role update.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                            '401' => ['description' => 'Unauthorized.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                            '403' => ['description' => 'Forbidden.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                            '422' => ['description' => 'Validation error.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                        ],
                    ],
                    'put' => [
                        'tags' => ['Users'],
                        'summary' => 'Update a user',
                        'description' => 'Same behavior as PATCH. Omitted fields are left unchanged.',
                        'operationId' => 'replaceUser',
                        'parameters' => [
                            ['$ref' => '#/components/parameters/user'],
                        ],
                        'requestBody' => [
                            'required' => true,
                            'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/UserPayload']]],
                        ],
                        'responses' => [
                            '200' => ['description' => 'User updated.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/User']]]],
                            '401' => ['description' => 'Unauthorized.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                            '403' => ['description' => 'Forbidden.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                            '422' => ['description' => 'Validation error.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                        ],
                    ],
                ],
                '/workspaces' => [
                    'get' => [
                        'tags' => ['Workspaces'],
                        'summary' => 'List workspaces',
                        'description' => 'Returns workspaces visible to the authenticated API key user.',
                        'operationId' => 'listWorkspaces',
                        'parameters' => [
                            ['name' => 'search', 'in' => 'query', 'required' => false, 'description' => 'Search by workspace name, slug, or lookup key.', 'schema' => ['type' => 'string']],
                            ['name' => 'limit', 'in' => 'query', 'required' => false, 'description' => 'Maximum items to return.', 'schema' => ['type' => 'integer', 'default' => 50, 'maximum' => 100]],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'List of workspaces.',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'array',
                                            'items' => ['$ref' => '#/components/schemas/Workspace'],
                                        ],
                                    ],
                                ],
                            ],
                            '401' => ['description' => 'Unauthorized.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                        ],
                    ],
                    'post' => [
                        'tags' => ['Workspaces'],
                        'summary' => 'Create or upsert a workspace',
                        'description' => 'Creates a workspace owned by the authenticated user. When lookup_key already exists, updates that workspace instead and returns 200. Creating a new workspace requires an admin or a user with workspace creation enabled. Updating an existing workspace requires workspace management permission.',
                        'operationId' => 'createWorkspace',
                        'requestBody' => [
                            'required' => true,
                            'content' => [
                                'application/json' => [
                                    'schema' => ['$ref' => '#/components/schemas/WorkspacePayload'],
                                    'example' => [
                                        'name' => 'Production',
                                        'lookup_key' => 'production_eu',
                                        'preferences' => [
                                            'viewport_width' => 1440,
                                            'viewport_height' => 900,
                                            'keyboard_speed' => 100,
                                        ],
                                        'appearance' => [
                                            'icon_type' => 'emoji',
                                            'icon_value' => ':rocket:',
                                        ],
                                    ],
                                ],
                            ],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Existing workspace updated by lookup key.',
                                'content' => [
                                    'application/json' => [
                                        'schema' => ['$ref' => '#/components/schemas/Workspace'],
                                    ],
                                ],
                            ],
                            '201' => [
                                'description' => 'Workspace created.',
                                'content' => [
                                    'application/json' => [
                                        'schema' => ['$ref' => '#/components/schemas/Workspace'],
                                    ],
                                ],
                            ],
                            '401' => ['description' => 'Unauthorized.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                            '403' => ['description' => 'Forbidden or workspace limit reached.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                            '422' => ['description' => 'Validation error.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                        ],
                    ],
                ],
                '/workspaces/{workspace}' => [
                    'get' => [
                        'tags' => ['Workspaces'],
                        'summary' => 'Get a workspace',
                        'description' => 'Returns the name, lookup key, preferences, appearance and counts for a visible workspace. The path accepts a workspace ID or lookup key.',
                        'operationId' => 'getWorkspace',
                        'parameters' => [
                            ['$ref' => '#/components/parameters/workspace'],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Workspace details.',
                                'content' => [
                                    'application/json' => [
                                        'schema' => ['$ref' => '#/components/schemas/Workspace'],
                                    ],
                                ],
                            ],
                            '401' => ['description' => 'Unauthorized.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                            '404' => ['description' => 'Workspace not found.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                        ],
                    ],
                    'patch' => [
                        'tags' => ['Workspaces'],
                        'summary' => 'Update a workspace',
                        'description' => 'Updates workspace name, lookup key, preferences, and appearance. The path accepts a workspace ID or lookup key. The API key user must be an instance admin or workspace admin/manager. Uploaded icons are not managed through this endpoint; use `icon_type`, `icon_value`, and `icon_color` for API-managed appearance.',
                        'operationId' => 'updateWorkspace',
                        'parameters' => [
                            ['$ref' => '#/components/parameters/workspace'],
                        ],
                        'requestBody' => [
                            'required' => true,
                            'content' => [
                                'application/json' => [
                                    'schema' => ['$ref' => '#/components/schemas/WorkspacePayload'],
                                    'example' => [
                                        'name' => 'Production Ops',
                                        'preferences' => [
                                            'runs_retention_default' => 30,
                                            'viewport_width' => 1600,
                                            'viewport_height' => 1000,
                                            'keyboard_speed' => 75,
                                        ],
                                        'appearance' => [
                                            'icon_type' => 'color',
                                            'icon_color' => '#16a34a',
                                        ],
                                    ],
                                ],
                            ],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Workspace updated.',
                                'content' => [
                                    'application/json' => [
                                        'schema' => ['$ref' => '#/components/schemas/Workspace'],
                                    ],
                                ],
                            ],
                            '401' => ['description' => 'Unauthorized.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                            '403' => ['description' => 'Forbidden.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                            '422' => ['description' => 'Validation error.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                        ],
                    ],
                    'put' => [
                        'tags' => ['Workspaces'],
                        'summary' => 'Update a workspace',
                        'description' => 'Same behavior as PATCH. Omitted fields are left unchanged.',
                        'operationId' => 'replaceWorkspace',
                        'parameters' => [
                            ['$ref' => '#/components/parameters/workspace'],
                        ],
                        'requestBody' => [
                            'required' => true,
                            'content' => [
                                'application/json' => [
                                    'schema' => ['$ref' => '#/components/schemas/WorkspacePayload'],
                                ],
                            ],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Workspace updated.',
                                'content' => [
                                    'application/json' => [
                                        'schema' => ['$ref' => '#/components/schemas/Workspace'],
                                    ],
                                ],
                            ],
                            '401' => ['description' => 'Unauthorized.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                            '403' => ['description' => 'Forbidden.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                            '422' => ['description' => 'Validation error.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                        ],
                    ],
                ],
                '/workspaces/{workspace}/teams' => [
                    'get' => [
                        'tags' => ['Teams'],
                        'summary' => 'List workspace teams',
                        'description' => 'Lists teams in a visible workspace.',
                        'operationId' => 'listTeams',
                        'parameters' => [
                            ['$ref' => '#/components/parameters/workspace'],
                        ],
                        'responses' => [
                            '200' => ['description' => 'List of teams.', 'content' => ['application/json' => ['schema' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/Team']]]]],
                            '401' => ['description' => 'Unauthorized.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                            '404' => ['description' => 'Workspace not found.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                        ],
                    ],
                    'post' => [
                        'tags' => ['Teams'],
                        'summary' => 'Create a team',
                        'description' => 'Creates a team in a workspace. Requires an instance admin or workspace admin/manager API key.',
                        'operationId' => 'createTeam',
                        'parameters' => [
                            ['$ref' => '#/components/parameters/workspace'],
                        ],
                        'requestBody' => [
                            'required' => true,
                            'content' => [
                                'application/json' => [
                                    'schema' => [
                                        'type' => 'object',
                                        'required' => ['name'],
                                        'properties' => ['name' => ['type' => 'string', 'maxLength' => 50]],
                                    ],
                                    'example' => ['name' => 'Operations'],
                                ],
                            ],
                        ],
                        'responses' => [
                            '201' => ['description' => 'Team created.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Team']]]],
                            '401' => ['description' => 'Unauthorized.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                            '403' => ['description' => 'Forbidden.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                            '422' => ['description' => 'Validation error.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                        ],
                    ],
                ],
                '/workspaces/{workspace}/teams/{team}' => [
                    'get' => [
                        'tags' => ['Teams'],
                        'summary' => 'Get a team',
                        'description' => 'Returns a team and its users.',
                        'operationId' => 'getTeam',
                        'parameters' => [
                            ['$ref' => '#/components/parameters/workspace'],
                            ['$ref' => '#/components/parameters/team'],
                        ],
                        'responses' => [
                            '200' => ['description' => 'Team details.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Team']]]],
                            '401' => ['description' => 'Unauthorized.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                            '404' => ['description' => 'Team not found.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                        ],
                    ],
                    'patch' => [
                        'tags' => ['Teams'],
                        'summary' => 'Update a team',
                        'description' => 'Updates a team name. Requires an instance admin or workspace admin/manager API key.',
                        'operationId' => 'updateTeam',
                        'parameters' => [
                            ['$ref' => '#/components/parameters/workspace'],
                            ['$ref' => '#/components/parameters/team'],
                        ],
                        'requestBody' => [
                            'required' => true,
                            'content' => ['application/json' => ['schema' => ['type' => 'object', 'properties' => ['name' => ['type' => 'string', 'maxLength' => 50]]]]],
                        ],
                        'responses' => [
                            '200' => ['description' => 'Team updated.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Team']]]],
                            '401' => ['description' => 'Unauthorized.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                            '403' => ['description' => 'Forbidden.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                            '422' => ['description' => 'Validation error.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                        ],
                    ],
                    'put' => [
                        'tags' => ['Teams'],
                        'summary' => 'Update a team',
                        'description' => 'Same behavior as PATCH. Omitted fields are left unchanged.',
                        'operationId' => 'replaceTeam',
                        'parameters' => [
                            ['$ref' => '#/components/parameters/workspace'],
                            ['$ref' => '#/components/parameters/team'],
                        ],
                        'requestBody' => [
                            'required' => true,
                            'content' => ['application/json' => ['schema' => ['type' => 'object', 'properties' => ['name' => ['type' => 'string', 'maxLength' => 50]]]]],
                        ],
                        'responses' => [
                            '200' => ['description' => 'Team updated.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Team']]]],
                            '401' => ['description' => 'Unauthorized.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                            '403' => ['description' => 'Forbidden.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                            '422' => ['description' => 'Validation error.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                        ],
                    ],
                ],
                '/workspaces/{workspace}/teams/{team}/users' => [
                    'post' => [
                        'tags' => ['Teams'],
                        'summary' => 'Add users to a team',
                        'description' => 'Adds one or more users to a team. Users are added to the workspace as members if they are not already workspace members.',
                        'operationId' => 'addTeamUsers',
                        'parameters' => [
                            ['$ref' => '#/components/parameters/workspace'],
                            ['$ref' => '#/components/parameters/team'],
                        ],
                        'requestBody' => [
                            'required' => true,
                            'content' => ['application/json' => ['schema' => ['type' => 'object', 'properties' => ['user_id' => ['type' => 'string'], 'user_ids' => ['type' => 'array', 'items' => ['type' => 'string']], 'workspace_role' => ['type' => 'string', 'enum' => ['admin', 'manager', 'member']]]]]],
                        ],
                        'responses' => [
                            '200' => ['description' => 'Team users updated.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Team']]]],
                            '403' => ['description' => 'Forbidden.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                            '422' => ['description' => 'Validation error.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                        ],
                    ],
                    'put' => [
                        'tags' => ['Teams'],
                        'summary' => 'Replace team users',
                        'description' => 'Replaces the full user list of a team.',
                        'operationId' => 'replaceTeamUsers',
                        'parameters' => [
                            ['$ref' => '#/components/parameters/workspace'],
                            ['$ref' => '#/components/parameters/team'],
                        ],
                        'requestBody' => [
                            'required' => true,
                            'content' => ['application/json' => ['schema' => ['type' => 'object', 'required' => ['user_ids'], 'properties' => ['user_ids' => ['type' => 'array', 'items' => ['type' => 'string']], 'workspace_role' => ['type' => 'string', 'enum' => ['admin', 'manager', 'member']]]]]],
                        ],
                        'responses' => [
                            '200' => ['description' => 'Team users replaced.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Team']]]],
                            '403' => ['description' => 'Forbidden.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                            '422' => ['description' => 'Validation error.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                        ],
                    ],
                ],
                '/workspaces/{workspace}/users/{user}/teams' => [
                    'put' => [
                        'tags' => ['Teams'],
                        'summary' => 'Set a user teams',
                        'description' => 'Replaces the teams assigned to one user within a workspace.',
                        'operationId' => 'setUserTeams',
                        'parameters' => [
                            ['$ref' => '#/components/parameters/workspace'],
                            ['$ref' => '#/components/parameters/user'],
                        ],
                        'requestBody' => [
                            'required' => true,
                            'content' => ['application/json' => ['schema' => ['type' => 'object', 'required' => ['team_ids'], 'properties' => ['team_ids' => ['type' => 'array', 'items' => ['type' => 'string']], 'workspace_role' => ['type' => 'string', 'enum' => ['admin', 'manager', 'member']]]]]],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'User teams updated.',
                                'content' => ['application/json' => ['schema' => [
                                    'type' => 'object',
                                    'properties' => [
                                        'user_id' => ['type' => 'string'],
                                        'workspace_id' => ['type' => 'string'],
                                        'workspace_role' => ['type' => 'string', 'enum' => ['admin', 'manager', 'member']],
                                        'team_ids' => ['type' => 'array', 'items' => ['type' => 'string']],
                                    ],
                                ]]],
                            ],
                            '403' => ['description' => 'Forbidden.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                            '422' => ['description' => 'Validation error.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                        ],
                    ],
                ],
                '/flows' => [
                    'get' => [
                        'tags' => ['Flows'],
                        'summary' => 'List flows',
                        'description' => 'Returns a list of flows accessible by the authenticated user. Supports search by name, description, ID, or flow type.',
                        'operationId' => 'listFlows',
                        'parameters' => [
                            ['name' => 'search', 'in' => 'query', 'required' => false, 'description' => 'Search by name, description, or ID.', 'schema' => ['type' => 'string']],
                            ['name' => 'name', 'in' => 'query', 'required' => false, 'description' => 'Filter by flow name.', 'schema' => ['type' => 'string']],
                            ['name' => 'flow_type', 'in' => 'query', 'required' => false, 'description' => 'Filter by flow type.', 'schema' => ['type' => 'string', 'enum' => ['code', 'nodal']]],
                            ['name' => 'type', 'in' => 'query', 'required' => false, 'description' => 'Alias for flow_type.', 'schema' => ['type' => 'string', 'enum' => ['code', 'nodal']]],
                            ['name' => 'folder_id', 'in' => 'query', 'required' => false, 'description' => 'Filter by folder ID.', 'schema' => ['type' => 'string']],
                            ['name' => 'limit', 'in' => 'query', 'required' => false, 'description' => 'Maximum items to return.', 'schema' => ['type' => 'integer', 'default' => 50, 'maximum' => 100]],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'List of flows.',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'array',
                                            'items' => ['$ref' => '#/components/schemas/FlowSummary'],
                                        ],
                                    ],
                                ],
                            ],
                            '401' => ['description' => 'Unauthorized.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                        ],
                    ],
                ],
                '/flows/search' => [
                    'get' => [
                        'tags' => ['Flows'],
                        'summary' => 'Search flows',
                        'description' => 'Alias of `GET /flows` for integrations that need an explicit search route.',
                        'operationId' => 'searchFlows',
                        'parameters' => [
                            ['name' => 'search', 'in' => 'query', 'required' => false, 'description' => 'Search by name, description, or ID.', 'schema' => ['type' => 'string']],
                            ['name' => 'name', 'in' => 'query', 'required' => false, 'description' => 'Filter by flow name.', 'schema' => ['type' => 'string']],
                            ['name' => 'flow_type', 'in' => 'query', 'required' => false, 'description' => 'Filter by flow type.', 'schema' => ['type' => 'string', 'enum' => ['code', 'nodal']]],
                            ['name' => 'type', 'in' => 'query', 'required' => false, 'description' => 'Alias for flow_type.', 'schema' => ['type' => 'string', 'enum' => ['code', 'nodal']]],
                            ['name' => 'folder_id', 'in' => 'query', 'required' => false, 'description' => 'Filter by folder ID.', 'schema' => ['type' => 'string']],
                            ['name' => 'limit', 'in' => 'query', 'required' => false, 'description' => 'Maximum items to return.', 'schema' => ['type' => 'integer', 'default' => 50, 'maximum' => 100]],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'List of flows.',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'array',
                                            'items' => ['$ref' => '#/components/schemas/FlowSummary'],
                                        ],
                                    ],
                                ],
                            ],
                            '401' => ['description' => 'Unauthorized.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                        ],
                    ],
                ],
                '/runs/search' => [
                    'get' => [
                        'tags' => ['Runs'],
                        'summary' => 'Search runs',
                        'description' => 'Search visible runs with the same filters as the Runs page.',
                        'operationId' => 'searchAllRuns',
                        'parameters' => [
                            ['name' => 'workspace_id', 'in' => 'query', 'required' => false, 'description' => 'Optional workspace ID.', 'schema' => ['type' => 'string']],
                            ['name' => 'flow_id', 'in' => 'query', 'required' => false, 'description' => 'Optional flow ID.', 'schema' => ['type' => 'string']],
                            ['name' => 'flow_search', 'in' => 'query', 'required' => false, 'description' => 'Search by run ID, flow name, or ID.', 'schema' => ['type' => 'string']],
                            ['name' => 'status', 'in' => 'query', 'required' => false, 'description' => 'Filter by status.', 'schema' => ['type' => 'string', 'enum' => ['pending', 'running', 'success', 'error', 'cancelled']]],
                            ['name' => 'statuses', 'in' => 'query', 'required' => false, 'description' => 'Filter by multiple statuses.', 'schema' => ['type' => 'array', 'items' => ['type' => 'string', 'enum' => ['pending', 'running', 'success', 'error', 'cancelled']]]],
                            ['name' => 'date_from', 'in' => 'query', 'required' => false, 'description' => 'Minimum created_at value.', 'schema' => ['type' => 'string']],
                            ['name' => 'date_to', 'in' => 'query', 'required' => false, 'description' => 'Maximum created_at value.', 'schema' => ['type' => 'string']],
                            ['name' => 'legend', 'in' => 'query', 'required' => false, 'description' => 'Filter by run legend.', 'schema' => ['type' => 'string']],
                            ['name' => 'duration_min_ms', 'in' => 'query', 'required' => false, 'description' => 'Minimum duration in milliseconds.', 'schema' => ['type' => 'integer']],
                            ['name' => 'duration_max_ms', 'in' => 'query', 'required' => false, 'description' => 'Maximum duration in milliseconds.', 'schema' => ['type' => 'integer']],
                            ['name' => 'triggered_by', 'in' => 'query', 'required' => false, 'description' => 'Filter by triggering user ID.', 'schema' => ['type' => 'string']],
                            ['name' => 'meta_presence', 'in' => 'query', 'required' => false, 'description' => 'Filter runs with any or no metadata.', 'schema' => ['type' => 'string', 'enum' => ['any', 'none']]],
                            ['name' => 'meta_predicate', 'in' => 'query', 'required' => false, 'description' => 'Combine meta filters with and/or.', 'schema' => ['type' => 'string', 'enum' => ['and', 'or']]],
                            ['name' => 'per_page', 'in' => 'query', 'required' => false, 'description' => 'Items per page.', 'schema' => ['type' => 'integer', 'default' => 50, 'maximum' => 100]],
                            ['name' => 'page', 'in' => 'query', 'required' => false, 'description' => 'Page number.', 'schema' => ['type' => 'integer']],
                            ['name' => 'logs', 'in' => 'query', 'required' => false, 'description' => 'Set to 1 to include console_logs in the response.', 'schema' => ['type' => 'integer', 'enum' => [0, 1], 'default' => 0]],
                            ['name' => 'code', 'in' => 'query', 'required' => false, 'description' => 'Set to 1 to include code_snapshot in the response.', 'schema' => ['type' => 'integer', 'enum' => [0, 1], 'default' => 0]],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Paginated list of runs.',
                                'content' => [
                                    'application/json' => [
                                        'schema' => ['$ref' => '#/components/schemas/PaginatedRuns'],
                                    ],
                                ],
                            ],
                            '401' => ['description' => 'Unauthorized.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                        ],
                    ],
                ],
                '/flows/{id}' => [
                    'get' => [
                        'tags' => ['Flows'],
                        'summary' => 'Get a flow',
                        'description' => 'Returns the current flow definition and configuration, including code and nodal graph data.',
                        'operationId' => 'getFlow',
                        'parameters' => [
                            ['$ref' => '#/components/parameters/id'],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Flow details.',
                                'content' => [
                                    'application/json' => [
                                        'schema' => ['$ref' => '#/components/schemas/FlowDetail'],
                                    ],
                                ],
                            ],
                            '401' => ['description' => 'Unauthorized.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                            '403' => ['description' => 'Forbidden.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                            '404' => ['description' => 'Flow not found.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                        ],
                    ],
                ],
                '/folders' => [
                    'get' => [
                        'tags' => ['Folders'],
                        'summary' => 'List folders',
                        'description' => 'Returns a list of folders for the authenticated user. Supports search by name.',
                        'operationId' => 'listFolders',
                        'parameters' => [
                            ['name' => 'search', 'in' => 'query', 'required' => false, 'description' => 'Search by folder name.', 'schema' => ['type' => 'string']],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'List of folders.',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'array',
                                            'items' => ['$ref' => '#/components/schemas/FolderSummary'],
                                        ],
                                    ],
                                ],
                            ],
                            '401' => ['description' => 'Unauthorized.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                        ],
                    ],
                ],
                '/flows/{id}/trigger' => [
                    'post' => [
                        'tags' => ['Flows'],
                        'summary' => 'Trigger a flow',
                        'description' => 'Dispatches a new run for the given flow and returns immediately. Pass optional JSON input in the request body. Poll `GET /runs/{run_id}` to check completion.',
                        'operationId' => 'triggerFlow',
                        'parameters' => [
                            ['$ref' => '#/components/parameters/id'],
                        ],
                        'requestBody' => [
                            'required' => false,
                            'content' => [
                                'application/json' => [
                                    'schema' => [
                                        'type' => 'object',
                                        'additionalProperties' => true,
                                        'example' => ['key' => 'value'],
                                    ],
                                ],
                            ],
                        ],
                        'responses' => [
                            '202' => [
                                'description' => 'Flow triggered.',
                                'content' => [
                                    'application/json' => [
                                        'schema' => ['$ref' => '#/components/schemas/TriggerResponse'],
                                    ],
                                ],
                            ],
                            '401' => ['description' => 'Unauthorized.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                            '403' => ['description' => 'Forbidden.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                            '404' => ['description' => 'Flow not found.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                            '422' => ['description' => 'Flow is unpublished.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                        ],
                    ],
                ],
                '/flows/{id}/runs' => [
                    'get' => [
                        'tags' => ['Runs'],
                        'summary' => 'List runs',
                        'description' => 'Returns a paginated list of runs for the given flow.',
                        'operationId' => 'listRuns',
                        'parameters' => [
                            ['$ref' => '#/components/parameters/id'],
                            ['name' => 'status', 'in' => 'query', 'required' => false, 'description' => 'Filter by status.', 'schema' => ['type' => 'string', 'enum' => ['pending', 'running', 'success', 'error', 'cancelled']]],
                            ['name' => 'per_page', 'in' => 'query', 'required' => false, 'description' => 'Items per page (default 20).', 'schema' => ['type' => 'integer', 'default' => 20]],
                            ['name' => 'page', 'in' => 'query', 'required' => false, 'description' => 'Page number.', 'schema' => ['type' => 'integer']],
                            ['name' => 'logs', 'in' => 'query', 'required' => false, 'description' => 'Set to 1 to include console_logs in the response.', 'schema' => ['type' => 'integer', 'enum' => [0, 1], 'default' => 0]],
                            ['name' => 'code', 'in' => 'query', 'required' => false, 'description' => 'Set to 1 to include code_snapshot in the response.', 'schema' => ['type' => 'integer', 'enum' => [0, 1], 'default' => 0]],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Paginated list of runs.',
                                'content' => [
                                    'application/json' => [
                                        'schema' => ['$ref' => '#/components/schemas/PaginatedRuns'],
                                    ],
                                ],
                            ],
                            '401' => ['description' => 'Unauthorized.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                            '404' => ['description' => 'Flow not found.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                        ],
                    ],
                ],
                '/flows/{id}/runs/search' => [
                    'get' => [
                        'tags' => ['Runs'],
                        'summary' => 'Search runs',
                        'description' => 'Returns a lightweight list of runs for the given flow, suitable for autocomplete/search.',
                        'operationId' => 'searchRuns',
                        'parameters' => [
                            ['$ref' => '#/components/parameters/id'],
                            ['name' => 'search', 'in' => 'query', 'required' => false, 'description' => 'Search by run ID or status.', 'schema' => ['type' => 'string']],
                            ['name' => 'status', 'in' => 'query', 'required' => false, 'description' => 'Filter by status.', 'schema' => ['type' => 'string', 'enum' => ['pending', 'running', 'success', 'error', 'cancelled']]],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'List of runs.',
                                'content' => [
                                    'application/json' => [
                                        'schema' => [
                                            'type' => 'array',
                                            'items' => ['$ref' => '#/components/schemas/RunSummary'],
                                        ],
                                    ],
                                ],
                            ],
                            '401' => ['description' => 'Unauthorized.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                            '404' => ['description' => 'Flow not found.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                        ],
                    ],
                ],
                '/flows/{id}/runs/{run}' => [
                    'get' => [
                        'tags' => ['Runs'],
                        'summary' => 'Get a run',
                        'description' => 'Returns the full details of a specific run.',
                        'operationId' => 'getRun',
                        'parameters' => [
                            ['$ref' => '#/components/parameters/id'],
                            ['$ref' => '#/components/parameters/run'],
                            ['name' => 'logs', 'in' => 'query', 'required' => false, 'description' => 'Set to 1 to include console_logs in the response.', 'schema' => ['type' => 'integer', 'enum' => [0, 1], 'default' => 0]],
                            ['name' => 'code', 'in' => 'query', 'required' => false, 'description' => 'Set to 1 to include code_snapshot in the response.', 'schema' => ['type' => 'integer', 'enum' => [0, 1], 'default' => 0]],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Run details.',
                                'content' => [
                                    'application/json' => [
                                        'schema' => ['$ref' => '#/components/schemas/Run'],
                                    ],
                                ],
                            ],
                            '401' => ['description' => 'Unauthorized.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                            '404' => ['description' => 'Flow or run not found.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                        ],
                    ],
                ],
                '/flows/{id}/runs/{run}/result' => [
                    'get' => [
                        'tags' => ['Runs'],
                        'summary' => 'Get run result',
                        'description' => 'Returns the output, status and timing of a completed run.',
                        'operationId' => 'getRunResult',
                        'parameters' => [
                            ['$ref' => '#/components/parameters/id'],
                            ['$ref' => '#/components/parameters/run'],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Run result.',
                                'content' => [
                                    'application/json' => [
                                        'schema' => ['$ref' => '#/components/schemas/RunResult'],
                                    ],
                                ],
                            ],
                            '401' => ['description' => 'Unauthorized.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                            '404' => ['description' => 'Flow or run not found.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                        ],
                    ],
                ],
                '/flows/{id}/runs/{run}/continue' => [
                    'post' => [
                        'tags' => ['Runs'],
                        'summary' => 'Continue a waiting run',
                        'description' => 'Continues a running flow paused by `$waitHumanValidation`. The run must currently be waiting for human validation.',
                        'operationId' => 'continueRun',
                        'parameters' => [
                            ['$ref' => '#/components/parameters/id'],
                            ['$ref' => '#/components/parameters/run'],
                        ],
                        'requestBody' => [
                            'required' => true,
                            'content' => [
                                'application/json' => [
                                    'schema' => [
                                        'type' => 'object',
                                        'required' => ['wait_id'],
                                        'properties' => [
                                            'wait_id' => ['type' => 'string', 'format' => 'uuid'],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Run continuation requested.',
                                'content' => [
                                    'application/json' => [
                                        'schema' => ['$ref' => '#/components/schemas/ContinueRunResponse'],
                                    ],
                                ],
                            ],
                            '401' => ['description' => 'Unauthorized.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                            '403' => ['description' => 'Forbidden.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                            '404' => ['description' => 'Flow or run not found.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                            '409' => ['description' => 'Run is not active or not waiting for human validation.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                        ],
                    ],
                ],
                '/flows/{id}/runs/{run}/recording' => [
                    'get' => [
                        'tags' => ['Artifacts'],
                        'summary' => 'Download recording',
                        'description' => 'Downloads the session recording (video/mp4). Returns 404 if no recording exists.',
                        'operationId' => 'downloadRecording',
                        'parameters' => [
                            ['$ref' => '#/components/parameters/id'],
                            ['$ref' => '#/components/parameters/run'],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'The recording file (video/mp4).',
                                'content' => [
                                    'video/mp4' => [
                                        'schema' => ['type' => 'string', 'format' => 'binary'],
                                    ],
                                ],
                            ],
                            '401' => ['description' => 'Unauthorized.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                            '404' => ['description' => 'Flow, run or recording not found.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                        ],
                    ],
                ],
                '/flows/{id}/runs/{run}/recording/lastshot' => [
                    'get' => [
                        'tags' => ['Artifacts'],
                        'summary' => 'Download recording lastshot',
                        'description' => 'Downloads the last frame of the session recording (image/jpeg). Returns 404 if no lastshot exists.',
                        'operationId' => 'downloadRecordingLastshot',
                        'parameters' => [
                            ['$ref' => '#/components/parameters/id'],
                            ['$ref' => '#/components/parameters/run'],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'The recording lastshot file (image/jpeg).',
                                'content' => [
                                    'image/jpeg' => [
                                        'schema' => ['type' => 'string', 'format' => 'binary'],
                                    ],
                                ],
                            ],
                            '401' => ['description' => 'Unauthorized.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                            '404' => ['description' => 'Flow, run or recording lastshot not found.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                        ],
                    ],
                ],
                '/flows/{id}/runs/{run}/artifacts/{type}' => [
                    'get' => [
                        'tags' => ['Artifacts'],
                        'summary' => 'List artifacts',
                        'description' => 'Returns the list of artifact files for a given type (screenshots, downloads).',
                        'operationId' => 'listArtifacts',
                        'parameters' => [
                            ['$ref' => '#/components/parameters/id'],
                            ['$ref' => '#/components/parameters/run'],
                            ['name' => 'type', 'in' => 'path', 'required' => true, 'description' => 'Artifact type.', 'schema' => ['type' => 'string', 'enum' => ['screenshots', 'downloads']]],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'List of artifact files.',
                                'content' => [
                                    'application/json' => [
                                        'schema' => ['$ref' => '#/components/schemas/ArtifactList'],
                                    ],
                                ],
                            ],
                            '401' => ['description' => 'Unauthorized.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                            '404' => ['description' => 'Flow or run not found.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                            '422' => ['description' => 'Invalid artifact type.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                        ],
                    ],
                ],
                '/flows/{id}/runs/{run}/artifacts/{type}/{filename}' => [
                    'get' => [
                        'tags' => ['Artifacts'],
                        'summary' => 'Download an artifact',
                        'description' => 'Downloads a specific artifact file.',
                        'operationId' => 'downloadArtifact',
                        'parameters' => [
                            ['$ref' => '#/components/parameters/id'],
                            ['$ref' => '#/components/parameters/run'],
                            ['name' => 'type', 'in' => 'path', 'required' => true, 'description' => 'Artifact type.', 'schema' => ['type' => 'string', 'enum' => ['screenshots', 'downloads']]],
                            ['name' => 'filename', 'in' => 'path', 'required' => true, 'description' => 'File name to download.', 'schema' => ['type' => 'string']],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'The artifact file.',
                                'content' => [
                                    'application/octet-stream' => [
                                        'schema' => ['type' => 'string', 'format' => 'binary'],
                                    ],
                                ],
                            ],
                            '401' => ['description' => 'Unauthorized.', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
                            '404' => ['description' => 'Not found.'],
                        ],
                    ],
                ],
            ],
        ]);
    }
}
