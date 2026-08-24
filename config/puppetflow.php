<?php

$runnerApiInternalUrl = env('RUNNER_API_INTERNAL_URL');
if (! is_string($runnerApiInternalUrl) || $runnerApiInternalUrl === '') {
    $legacyRunnerApiInternalUrl = env('RUNTIME_RUN_API_INTERNAL_URL');
    $runnerApiInternalUrl = is_string($legacyRunnerApiInternalUrl) && $legacyRunnerApiInternalUrl !== ''
        ? (preg_replace('#/runtime-run/?$#', '/runner', $legacyRunnerApiInternalUrl) ?? $legacyRunnerApiInternalUrl)
        : 'http://localhost:8000/api/internal/runner';
}

return [

    'execution_dir' => env('FLOW_EXECUTION_DIR', 'data/execution'),

    'cli_flows_dir' => env('FLOW_CLI_FLOWS_DIR', 'src/flows'),

    'screencast_quality' => (int) env('FLOW_RUN_SCREENCAST_QUALITY', 60),

    'screencast_nth_frame' => (int) env('FLOW_RUN_SCREENCAST_NTH_FRAME', 1),

    'max_flow_timeout_seconds' => max(0, (int) env('FLOW_MAX_TIMEOUT_SECONDS', 0)),

    'queues_counter' => max(1, (int) env('APP_QUEUES_COUNTER', 1)),

    'node_http_request_allow_private' => filter_var(
        env('PUPPETFLOW_NODE_HTTP_REQUEST_ALLOW_PRIVATE', false),
        FILTER_VALIDATE_BOOL,
    ),

    'integration_http_allow_private' => filter_var(
        env('PUPPETFLOW_INTEGRATION_HTTP_ALLOW_PRIVATE', true),
        FILTER_VALIDATE_BOOL,
    ),

    'integration_http_allow_http' => filter_var(
        env('PUPPETFLOW_INTEGRATION_HTTP_ALLOW_HTTP', true),
        FILTER_VALIDATE_BOOL,
    ),

    'trigger_rate_limit_per_minute' => max(1, (int) env('TRIGGER_RATE_LIMIT_PER_MINUTE', 120)),

    'trigger_max_payload_bytes' => max(1024, (int) env('TRIGGER_MAX_PAYLOAD_BYTES', 10485760)),

    'trigger_max_fields' => max(1, (int) env('TRIGGER_MAX_FIELDS', 5000)),

    'trigger_max_depth' => max(1, (int) env('TRIGGER_MAX_DEPTH', 32)),

    'repository_webhook_rate_limit_per_minute' => max(
        1,
        (int) env('REPOSITORY_WEBHOOK_RATE_LIMIT_PER_MINUTE', 300),
    ),

    'repository_webhook_max_payload_bytes' => max(
        1024,
        (int) env('REPOSITORY_WEBHOOK_MAX_PAYLOAD_BYTES', 10485760),
    ),

    'grabber_store_url' => env('PUPPETFLOW_GRABBER_STORE_URL', 'https://chromewebstore.google.com/detail/puppetflow-grabber/behdpfaljjpaeekihhnjfhfhigfbkjdc'),

    'blueprints_api_url' => env('PUPPETFLOW_BLUEPRINTS_API_URL', 'https://puppetflow.com/api/blueprints'),

    'feature_flags' => [
        'snippets_enabled' => filter_var(env('FF_SNIPPETS_ENABLED', true), FILTER_VALIDATE_BOOL),
        'variables_enabled' => filter_var(env('FF_VARIABLES_ENABLED', true), FILTER_VALIDATE_BOOL),
        'mcp_enabled' => filter_var(env('FF_MCP_ENABLED', true), FILTER_VALIDATE_BOOL),
        'messenger_enabled' => filter_var(env('FF_MESSENGER_ENABLED', true), FILTER_VALIDATE_BOOL),
        'live_view_enabled' => filter_var(env('FF_LIVE_VIEW_ENABLED', true), FILTER_VALIDATE_BOOL),
        'mailbox_enabled' => filter_var(env('FF_MAILBOX_ENABLED', true), FILTER_VALIDATE_BOOL),
        'ai_enabled' => filter_var(env('FF_AI_ENABLED', true), FILTER_VALIDATE_BOOL),
        'run_metadata_search_enabled' => filter_var(env('FF_RUN_METADATA_SEARCH_ENABLED', false), FILTER_VALIDATE_BOOL),
        'private_libraries_enabled' => filter_var(env('FF_PRIVATE_LIBRARIES_ENABLED', false), FILTER_VALIDATE_BOOL),
        'vaults_enabled' => filter_var(env('FF_VAULTS_ENABLED', false), FILTER_VALIDATE_BOOL),
        'vcs_enabled' => filter_var(env('FF_VCS_ENABLED', false), FILTER_VALIDATE_BOOL),
        'recording_enabled' => filter_var(env('FF_RECORDING_ENABLED', false), FILTER_VALIDATE_BOOL),
        'teams_enabled' => filter_var(env('FF_TEAMS_ENABLED', false), FILTER_VALIDATE_BOOL),
        'workspace_sharing_enabled' => filter_var(env('FF_WORKSPACE_SHARING_ENABLED', false), FILTER_VALIDATE_BOOL),
        'two_factor_enforcement_enabled' => filter_var(env('FF_TWO_FACTOR_ENFORCEMENT_ENABLED', false), FILTER_VALIDATE_BOOL),
        'whitelabel_enabled' => filter_var(env('FF_WHITELABEL_ENABLED', false), FILTER_VALIDATE_BOOL),
        'sso_enabled' => filter_var(env('FF_SSO_ENABLED', false), FILTER_VALIDATE_BOOL),
        'workspace_limit' => (int) env('FF_WORKSPACE_LIMIT', -1),
        'concurrent_runs_limit' => (int) env('FF_CONCURRENT_RUNS_LIMIT', -1),
        'maximum_retention_limit' => (int) env('FF_MAXIMUM_RETENTION_LIMIT', 0),
        'maximum_timeout_seconds' => (int) env('FF_MAXIMUM_TIMEOUT_SECONDS', env('FLOW_MAX_TIMEOUT_SECONDS', 0)),
        'maximum_retries_limit' => (int) env('FF_MAXIMUM_RETRIES_LIMIT', 5),
        'cycle_epoch' => env('FF_CYCLE_EPOCH'),
        'cycle_freq' => (int) env('FF_CYCLE_FREQ', 0),
        'cycle_runs_limit' => (int) env('FF_CYCLE_RUNS_LIMIT', 0),
        'instance_storage_limit_bytes' => (int) env('FF_INSTANCE_STORAGE_LIMIT_BYTES', 0),
        'promote_disabled_features' => filter_var(env('FF_PROMOTE_DISABLED_FEATURES', true), FILTER_VALIDATE_BOOL),
        'promote_disabled_features_reason' => env(
            'FF_PROMOTE_DISABLED_FEATURES_REASON',
            'Upgrade your plan to unlock this feature.',
        ),
    ],

    'mailbox_smtp_port' => (int) env('MAILBOX_SMTP_PORT', 2525),

    'mailbox_smtp' => [
        'hostname' => env('MAILBOX_SMTP_HOSTNAME', ''),
        'max_data_bytes' => (int) env('MAILBOX_SMTP_MAX_DATA_BYTES', 26214400),
        'max_header_bytes' => (int) env('MAILBOX_SMTP_MAX_HEADER_BYTES', 65536),
        'max_recipients' => (int) env('MAILBOX_SMTP_MAX_RECIPIENTS', 50),
        'max_command_bytes' => (int) env('MAILBOX_SMTP_MAX_COMMAND_BYTES', 4096),
        'idle_timeout_seconds' => (int) env('MAILBOX_SMTP_IDLE_TIMEOUT_SECONDS', 60),
        'data_timeout_seconds' => (int) env('MAILBOX_SMTP_DATA_TIMEOUT_SECONDS', 120),
        'max_connections' => (int) env('MAILBOX_SMTP_MAX_CONNECTIONS', 200),
        'max_connections_per_ip' => (int) env('MAILBOX_SMTP_MAX_CONNECTIONS_PER_IP', 10),
        'max_aggregate_data_bytes' => (int) env('MAILBOX_SMTP_MAX_AGGREGATE_DATA_BYTES', 67108864),
        'max_mime_depth' => (int) env('MAILBOX_SMTP_MAX_MIME_DEPTH', 8),
        'max_mime_parts' => (int) env('MAILBOX_SMTP_MAX_MIME_PARTS', 100),
        'starttls' => [
            'enabled' => filter_var(env('MAILBOX_SMTP_STARTTLS_ENABLED', false), FILTER_VALIDATE_BOOL),
            'required' => filter_var(env('MAILBOX_SMTP_STARTTLS_REQUIRED', false), FILTER_VALIDATE_BOOL),
            'certificate_path' => env('MAILBOX_SMTP_TLS_CERT_PATH', ''),
            'private_key_path' => env('MAILBOX_SMTP_TLS_KEY_PATH', ''),
            'handshake_timeout_seconds' => (int) env('MAILBOX_SMTP_TLS_HANDSHAKE_TIMEOUT_SECONDS', 10),
        ],
    ],

    'mailbox_delivery' => [
        'retry_after_seconds' => (int) env('MAILBOX_DELIVERY_RETRY_AFTER_SECONDS', 30),
        'max_attempts' => (int) env('MAILBOX_DELIVERY_MAX_ATTEMPTS', 10),
        'window_seconds' => (int) env('MAILBOX_DELIVERY_WINDOW_SECONDS', 300),
        'scrub_after_seconds' => (int) env('MAILBOX_RUN_MESSAGE_SCRUB_AFTER_SECONDS', 3600),
        'retention_seconds' => (int) env('MAILBOX_RUN_MESSAGE_RETENTION_SECONDS', 604800),
        'email_payload_retention_seconds' => (int) env('MAILBOX_EMAIL_PAYLOAD_RETENTION_SECONDS', 604800),
    ],

    'runner_api' => [
        'internal_url' => $runnerApiInternalUrl,
        'secret' => env('RUNNER_API_SECRET') ?: env('RUNTIME_RUN_API_SECRET') ?: env('APP_KEY'),
        'key_id' => env('RUNNER_API_KEY_ID', env('RUNTIME_RUN_API_KEY_ID', 'v1')),
        'clock_skew_seconds' => (int) env('RUNNER_API_CLOCK_SKEW_SECONDS', env('RUNTIME_RUN_API_CLOCK_SKEW_SECONDS', 30)),
        'max_token_ttl_seconds' => (int) env(
            'RUNNER_API_MAX_TOKEN_TTL_SECONDS',
            env('RUNTIME_RUN_API_MAX_TOKEN_TTL_SECONDS', \App\Services\Runtime\RunnerCapabilityService::MAX_TOKEN_TTL_SECONDS),
        ),
        'rate_limit_per_minute' => (int) env('RUNNER_API_RATE_LIMIT_PER_MINUTE', env('RUNTIME_RUN_API_RATE_LIMIT_PER_MINUTE', 120)),
        'mailbox_lease_seconds' => (int) env('RUNNER_MAILBOX_LEASE_SECONDS', env('RUNTIME_RUN_MAILBOX_LEASE_SECONDS', 30)),
        'mailbox_message_ttl_seconds' => (int) env('RUNNER_MAILBOX_MESSAGE_TTL_SECONDS', env('RUNTIME_RUN_MAILBOX_MESSAGE_TTL_SECONDS', 3600)),
    ],

    'managed_mailbox' => [
        'enabled' => filter_var(env('MANAGED_MAILBOX_ENABLED', false), FILTER_VALIDATE_BOOL),
        'name' => env('MANAGED_MAILBOX_NAME', 'Shared Mailbox'),
        'domain' => env('MANAGED_MAILBOX_DOMAIN', ''),
    ],

];
