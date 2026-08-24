<?php

namespace App\Services\Puppeteer;

use App\Enums\Flow\FlowRunArtifactTypeEnum;
use App\Models\Flow;
use App\Models\FlowRun;
use App\Services\BrowserStream\BrowserStreamTokenService;
use App\Services\FeatureFlags\FeatureFlagService;
use App\Services\Runtime\RunnerCapabilityService;
use App\Services\Storage\RunArtifactStorage;
use App\Support\Flow\PinokioConfig;

final class PuppeteerEnvironmentBuilder
{
    public function __construct(
        private readonly PinokioConfig $pinokioConfig,
        private readonly FeatureFlagService $features,
        private readonly RunnerCapabilityService $runnerCapabilities,
        private readonly BrowserStreamTokenService $streamTokens,
        private readonly RunArtifactStorage $artifactStorage,
    ) {}

    /**
     * @param  array<string, string>  $files
     * @param  array<string, string>  $directories
     * @param  array{dir: string}|null  $sandbox
     * @param  array<string, mixed>|null  $proxySnapshot
     * @return array<string, string|false>
     */
    public function build(
        Flow $flow,
        array $files,
        array $directories,
        ?FlowRun $run = null,
        ?array $sandbox = null,
        ?array $proxySnapshot = null,
    ): array {
        $recordingEnabled = $this->features->enabled('recording_enabled');
        $workspace = $flow->workspace()->first([
            'id', 'debug_log_object_depth', 'debug_log_array_limit',
        ]);
        if ($workspace === null) {
            throw new \LogicException('Flow workspace could not be resolved.');
        }

        $env = [
            'RUN_INPUT_PATH' => $files['input'],
            'RUN_OUTPUT_PATH' => $files['output'],
            'RUN_INTERNAL_OUTPUT_PATH' => $files['internal_output'] ?? '',
            'RUN_ACTION_LOGS_PATH' => $files['action_logs'] ?? '',
            'RUN_PAYLOAD_PATH' => $files['payload'],
            'RUN_ERROR_PATH' => $files['error'],
            'RUN_CHANNELS_PATH' => $files['channels'],
            'RUN_WATCHERS_PATH' => $files['watchers'],
            'RUN_SNIPPETS_PATH' => $files['snippets'],
            'RUN_SECRETS_PATH' => $files['runtime_secrets'] ?? '',
            'RUN_MAILBOX_CLAIMS_PATH' => $files['mailbox_claims'] ?? '',
            'INCLUDE_INPUT_IN_OUTPUT' => ($flow->include_input_in_output ?? false) ? 'true' : 'false',
            'INCLUDE_CONTEXT_IN_OUTPUT' => ($flow->include_context_in_output ?? true) ? 'true' : 'false',
            'EXPORT_ARTIFACTS_DOWNLOADS' => ($flow->export_artifacts_downloads ?? true) ? 'true' : 'false',
            'EXPORT_ARTIFACTS_SCREENSHOTS' => ($flow->export_artifacts_screenshots ?? true) ? 'true' : 'false',
            'EXPORT_ARTIFACTS_RECORDING' => ($flow->export_artifacts_recording ?? true) ? 'true' : 'false',
            'RECORDING_ENABLED' => $recordingEnabled ? 'true' : 'false',
            'FLOW_RUN_SCREENCAST_QUALITY' => $this->scalarConfig('puppetflow.screencast_quality', '60'),
            'FLOW_RUN_SCREENCAST_NTH_FRAME' => $this->scalarConfig('puppetflow.screencast_nth_frame', '1'),
            'ARTIFACTS_LIST' => implode(',', FlowRunArtifactTypeEnum::getStringList()),
            'ARTIFACTS_EXPORTABLE_LIST' => implode(',', array_map(
                static fn (FlowRunArtifactTypeEnum|string $type): string => $type instanceof FlowRunArtifactTypeEnum
                    ? $type->value
                    : $type,
                FlowRunArtifactTypeEnum::getExportables(true),
            )),
            'FLOW_EXECUTION_DIR' => $this->stringConfig('puppetflow.execution_dir'),
            'FLOW_CLI_FLOWS_DIR' => $this->stringConfig('puppetflow.cli_flows_dir'),
            'PUPPETFLOW_ARTIFACTS_BASE_PATH' => $flow->getFlowArtifactsBasePath(),
            'PUPPETFLOW_RUN_ARTIFACTS_BASE_PATH' => $run?->getFlowRunArtifactsBasePath() ?? '',
            'FLOW_INTERNAL_ID' => (string) $flow->id,
            'FLOW_OWNER_ID' => (string) $flow->owner_id,
            'RUNNER_LOG_DEPTH' => (string) min(20, max(0, $workspace->debug_log_object_depth)),
            'RUNNER_LOG_ARRAY_LIMIT' => (string) min(1000, max(1, $workspace->debug_log_array_limit)),
            'PUPPETFLOW_NODE_HTTP_REQUEST_ALLOW_PRIVATE' => config('puppetflow.node_http_request_allow_private', false) ? 'true' : 'false',
            'APP_URL' => $this->stringConfig('app.url'),
            ...$this->pinokioConfig->toEnv(),
        ];

        foreach (['downloading' => 'PINOKIO_DOWNLOADING_PATH', 'downloads' => 'PINOKIO_DOWNLOADS_PATH'] as $key => $name) {
            if (isset($directories[$key])) {
                $env[$name] = $directories[$key];
            }
        }
        if ($sandbox) {
            $env += [
                'NODE_PATH' => base_path('node_modules'),
                'SANDBOX_USER_ROOT' => $this->artifactStorage->absoluteUserPath($flow->owner_id),
                'SANDBOX_NODE_MODULES_PATH' => base_path('node_modules'),
                'SANDBOX_APP_DIR' => $sandbox['dir'],
                'TMPDIR' => $directories['tmp'],
            ];
        }

        $env['FLOW_TIMEOUT_MS'] = (string) ($flow->getEffectiveTimeoutSeconds() * 1000);
        $viewport = $flow->getEffectiveViewport();
        $env['VIEWPORT_WIDTH'] = (string) $viewport['width'];
        $env['VIEWPORT_HEIGHT'] = (string) $viewport['height'];
        if ($flow->disable_web_security !== null) {
            $env['BROWSER_DISABLE_WEB_SECURITY'] = $flow->disable_web_security ? 'true' : 'false';
        }

        if ($run && $this->features->enabled('live_view_enabled')) {
            $token = $this->streamTokens->issue(
                $run,
                BrowserStreamTokenService::ROLE_PRODUCER,
                $flow->getEffectiveTimeoutSeconds() + 30,
            );
            $env += [
                'STREAM_SERVER_URL' => $this->stringConfig(
                    'services.browser_stream.internal_url',
                    'http://localhost:6080',
                ),
                'STREAM_RUN_ID' => (string) $run->id,
                'STREAM_TOKEN' => $token['token'],
                'STREAM_TOKEN_EXPIRES_AT' => (string) $token['expires'],
            ];
        }

        $effectiveProxySnapshot = $run instanceof FlowRun ? $run->proxy_snapshot : $proxySnapshot;
        if (is_array($effectiveProxySnapshot)) {
            $this->addProxy($env, $effectiveProxySnapshot, $run);
        }
        if ($run) {
            $this->addRunnerCapability($env, $flow, $run);
        }
        if ($run && $recordingEnabled) {
            $basePath = $run->getFlowRunArtifactsBasePath();
            $env['RECORDING_PATH'] = "{$basePath}/recording/recording.mp4";
            $env['RECORDING_COMPLETION_MARKER_PATH'] = "{$basePath}/.recording-complete";
        }

        return $this->isolate($env);
    }

    /**
     * @param  array<string, string|false>  $env
     * @param  array<string, mixed>  $snapshot
     */
    private function addProxy(array &$env, array $snapshot, ?FlowRun $run): void
    {
        if (($snapshot['mode'] ?? null) !== 'proxy') {
            return;
        }

        $server = $snapshot['server'] ?? null;
        if (! is_string($server) || $server === '') {
            throw new \LogicException('The flow run proxy snapshot is invalid.');
        }
        $username = is_string($snapshot['username'] ?? null) ? $snapshot['username'] : '';
        $password = is_string($snapshot['password'] ?? null) ? $snapshot['password'] : '';
        $env['RUNNER_PROXY_SERVER'] = $server;
        $env['RUNNER_PROXY_USERNAME'] = $username;
        $env['RUNNER_PROXY_PASSWORD'] = $password;

        if ($run) {
            $current = $run->getAttribute('resolved_secrets');
            $run->update(['resolved_secrets' => array_values(array_unique([
                ...(is_array($current) ? $current : []),
                ...array_filter([$username, $password], fn (string $value): bool => $value !== ''),
            ]))]);
        }
    }

    /** @param array<string, string|false> $env */
    private function addRunnerCapability(array &$env, Flow $flow, FlowRun $run): void
    {
        $token = $this->runnerCapabilities->issue(
            $run,
            $flow->getEffectiveTimeoutSeconds() + RunnerCapabilityService::TOKEN_GRACE_SECONDS,
            [
                RunnerCapabilityService::SCOPE_MAILBOX_CLAIM,
                RunnerCapabilityService::SCOPE_MAILBOX_RENEW,
                RunnerCapabilityService::SCOPE_AI_EXECUTE,
                RunnerCapabilityService::SCOPE_WAITING_DECLARE,
                RunnerCapabilityService::SCOPE_WAITING_CONSUME,
                RunnerCapabilityService::SCOPE_WAITING_CLEAR,
            ],
        );
        $env['RUNNER_API_URL'] = rtrim($this->stringConfig(
            'puppetflow.runner_api.internal_url',
            'http://localhost:8000/api/internal/runner',
        ), '/');
        $env['RUNNER_API_TOKEN'] = $token['token'];
        $current = $run->getAttribute('resolved_secrets');
        $run->update(['resolved_secrets' => array_values(array_unique([
            ...(is_array($current) ? $current : []),
            $token['token'],
        ]))]);
    }

    /** @param array<string, string|false> $runtimeEnv
     * @return array<string, string|false>
     */
    private function isolate(array $runtimeEnv): array
    {
        $inherited = getenv();
        $process = array_filter($_ENV, fn ($value, $name) => is_string($name) && is_string($value), ARRAY_FILTER_USE_BOTH);
        $isolated = array_fill_keys(array_unique([...array_keys($inherited), ...array_keys($process)]), false);
        foreach ([
            'PATH', 'HOME', 'LANG', 'LC_ALL', 'TZ', 'SSL_CERT_FILE', 'SSL_CERT_DIR',
            'NODE_EXTRA_CA_CERTS', 'HTTP_PROXY', 'HTTPS_PROXY', 'NO_PROXY',
            'http_proxy', 'https_proxy', 'no_proxy',
        ] as $name) {
            $value = $inherited[$name] ?? $process[$name] ?? null;
            if ($value !== null && $value !== '') {
                $isolated[$name] = $value;
            }
        }

        return array_replace($isolated, $runtimeEnv);
    }

    private function stringConfig(string $key, string $default = ''): string
    {
        $value = config($key, $default);

        return is_string($value) ? $value : $default;
    }

    private function scalarConfig(string $key, string $default): string
    {
        $value = config($key, $default);

        return is_scalar($value) ? (string) $value : $default;
    }
}
