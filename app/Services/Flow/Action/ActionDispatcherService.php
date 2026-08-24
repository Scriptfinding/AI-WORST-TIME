<?php

namespace App\Services\Flow\Action;

use App\Authorization\AuthorizationContextFactory;
use App\Authorization\Visibility\SharedResourceVisibility;
use App\Models\Flow;
use App\Models\FlowAction;
use App\Models\FlowRun;
use App\Models\User;
use App\Services\Security\PublicHttpTargetGuard;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ActionDispatcherService
{
    public function __construct(
        private readonly AuthorizationContextFactory $authorizationContexts,
        private readonly SharedResourceVisibility $sharedVisibility,
        private readonly PublicHttpTargetGuard $publicTargets,
    ) {}

    public function dispatchActions(Flow $flow, FlowRun $run): void
    {
        if (! $run->triggered_by) {
            return;
        }

        $user = User::find($run->triggered_by);
        if (! $user) {
            return;
        }

        $actionsQuery = FlowAction::query()
            ->select('flow_actions.*')
            ->join('flows', 'flows.id', '=', 'flow_actions.flow_id')
            ->where('flow_actions.flow_id', $flow->id)
            ->where('flow_actions.is_active', true);
        $this->sharedVisibility->applyUse(
            $actionsQuery,
            $this->authorizationContexts->for($user, $flow->workspace_id),
            workspaceColumn: 'flows.workspace_id',
            ownerColumn: 'flow_actions.user_id',
            scopeColumn: 'flow_actions.scope',
            teamColumn: 'flow_actions.team_id',
        );
        $actions = $actionsQuery->get();

        if ($actions->isEmpty()) {
            return;
        }

        $results = [];
        $triggeredActionIds = [];

        foreach ($actions as $action) {
            if ($run->status === 'error' && ! $action->fire_on_error) {
                continue;
            }

            $result = $this->executeAction($action, $flow, $run);
            $results[] = $result;
            $triggeredActionIds[] = $action->id;
        }

        if ($triggeredActionIds !== []) {
            FlowAction::query()
                ->whereIn('id', $triggeredActionIds)
                ->update(['last_triggered_at' => now()]);
        }

        if (! empty($results)) {
            $run->update(['action_results' => $run->redactResolvedSecrets($results)]);
        }
    }

    /** @return array<string, mixed> */
    private function executeAction(FlowAction $action, Flow $flow, FlowRun $run): array
    {
        $base = [
            'action_id' => $action->id,
            'type' => $action->type,
            'label' => $action->label,
        ];

        return array_merge($base, $this->executeWebhookAction($action, $flow, $run));
    }

    /** @return array<string, mixed> */
    private function executeWebhookAction(FlowAction $action, Flow $flow, FlowRun $run): array
    {
        $rawConfig = $action->getAttribute('config');
        $config = is_array($rawConfig) ? $rawConfig : [];
        $url = $config['url'] ?? null;

        if (! is_string($url) || $url === '') {
            return ['success' => false, 'error' => 'No URL configured'];
        }

        $output = $run->output;
        if (is_array($output) && isset($output['$artifacts']) && is_array($output['$artifacts'])) {
            $artifacts = $output['$artifacts'];
            $showScreenshots = $action->export_artifacts_screenshots ?? $flow->export_artifacts_screenshots ?? true;
            $showDownloads = $action->export_artifacts_downloads ?? $flow->export_artifacts_downloads ?? true;
            $showRecording = $action->export_artifacts_recording ?? $flow->export_artifacts_recording ?? true;

            if (! $showScreenshots) {
                unset($artifacts['screenshots']);
            }
            if (! $showDownloads) {
                unset($artifacts['downloads']);
            }
            if (! $showRecording) {
                unset($artifacts['recording']);
            }

            if (empty($artifacts)) {
                unset($output['$artifacts']);
            } else {
                $output['$artifacts'] = $artifacts;
            }
        }

        $payload = [
            'flow_id' => $flow->id,
            'run_id' => $run->id,
            'status' => $run->status,
            'output' => $run->redactResolvedSecrets($output),
            'error_message' => $run->redactResolvedSecrets($run->error_message),
        ];
        $credentialValues = $this->webhookCredentialValues($config, $url);

        try {
            $request = Http::timeout(30)
                ->withOptions($this->publicTargets->requestOptions($url));

            $secret = $config['secret'] ?? null;
            if (is_string($secret) && $secret !== '') {
                $encodedPayload = json_encode($payload);
                $signature = hash_hmac('sha256', $encodedPayload === false ? '' : $encodedPayload, $secret);
                $request = $request->withHeaders(['X-Webhook-Signature' => $signature]);
            }

            $headers = $config['headers'] ?? [];
            if (is_array($headers) && $headers !== []) {
                /** @var array<string, string> $customHeaders */
                $customHeaders = [];
                foreach ($headers as $header) {
                    if (! is_array($header)) {
                        continue;
                    }

                    $key = $header['key'] ?? null;
                    $value = $header['value'] ?? null;
                    if (
                        is_string($key)
                        && $key !== ''
                        && is_string($value)
                        && ! in_array(strtolower($key), [
                            'connection',
                            'content-length',
                            'host',
                            'proxy-authorization',
                            'transfer-encoding',
                        ], true)
                    ) {
                        $customHeaders[$key] = $value;
                    }
                }
                $request = $request->withHeaders($customHeaders);
            }

            $response = $request->post($url, $payload);

            if ($response->failed()) {
                Log::warning("Action webhook failed for flow {$flow->id}: HTTP {$response->status()}");
            }

            return [
                'success' => $response->successful(),
                'status' => $response->status(),
                'sent_at' => now()->toISOString(),
            ];
        } catch (\Throwable $e) {
            $redactedMessage = $run->redactResolvedSecrets($e->getMessage());
            $error = $this->redactWebhookValue(
                is_string($redactedMessage) ? $redactedMessage : $e->getMessage(),
                $credentialValues,
            );
            Log::error("Action webhook error for flow {$flow->id}: {$error}");

            return [
                'success' => false,
                'error' => $error,
                'sent_at' => now()->toISOString(),
            ];
        }
    }

    /**
     * @param  array<string, mixed>  $config
     * @return list<string>
     */
    private function webhookCredentialValues(array $config, string $url): array
    {
        $values = [$url, $config['secret'] ?? null];
        $urlParts = parse_url($url);

        if (is_array($urlParts)) {
            $values[] = $urlParts['user'] ?? null;
            $values[] = $urlParts['pass'] ?? null;

            if (isset($urlParts['query'])) {
                parse_str($urlParts['query'], $query);
                array_walk_recursive($query, function (mixed $value) use (&$values): void {
                    $values[] = $value;
                });
            }
        }

        $headers = $config['headers'] ?? [];
        foreach (is_array($headers) ? $headers : [] as $header) {
            if (is_array($header)) {
                $values[] = $header['value'] ?? null;
            }
        }

        $values = array_values(array_filter(
            $values,
            fn (mixed $value) => is_string($value) && $value !== '',
        ));
        usort($values, fn (string $left, string $right) => strlen($right) <=> strlen($left));

        return array_values(array_unique($values));
    }

    /** @param list<string> $credentials */
    private function redactWebhookValue(string $value, array $credentials): string
    {
        return str_replace($credentials, '[REDACTED]', $value);
    }
}
