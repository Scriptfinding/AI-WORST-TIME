<?php

namespace App\Http\Controllers\Trigger;

use App\Http\Controllers\Controller;
use App\Models\Flow;
use App\Models\FlowTrigger;
use App\Models\User;
use App\Services\Flow\FlowRunnerService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TriggerIncomingController extends Controller
{
    public function __construct(
        private FlowRunnerService $runner
    ) {}

    public function __invoke(Request $request, string $token): JsonResponse
    {
        $maxPayloadBytes = $this->configLimit('puppetflow.trigger_max_payload_bytes', 10 * 1024 * 1024);
        abort_if(strlen($request->getContent()) > $maxPayloadBytes, 413, 'Trigger payload is too large.');

        $trigger = FlowTrigger::where('token', $token)
            ->where('type', 'webhook')
            ->where('is_active', true)
            ->first();

        if (! $trigger) {
            return response()->json(['error' => 'Invalid or inactive trigger.'], 404);
        }

        /** @var Flow $flow */
        $flow = $trigger->flow;

        $input = $trigger->input_template ?? [];

        $config = $trigger->config ?? [];
        if (! empty($config['merge_post_data'])) {
            $postData = $this->resolvePayload($request);
            $this->assertPayloadComplexity($postData);
            $input = array_merge($input, $postData);
        }

        $webhookInfo = [
            'incoming' => [
                'source_ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'content_type' => $request->header('Content-Type'),
                'received_at' => now()->toISOString(),
            ],
        ];

        $user = $trigger->user;
        if (! $user instanceof User) {
            return response()->json(['error' => 'Trigger owner no longer exists.'], 422);
        }

        try {
            $run = $this->runner->dispatch(
                $flow,
                $user,
                $input,
                'webhook',
                null,
                $trigger->id,
                $webhookInfo,
            );
        } catch (AuthorizationException $e) {
            return response()->json(
                ['error' => $e->getMessage()],
                $e->status() ?? 403,
            );
        }
        $trigger->update(['last_triggered_at' => now()]);

        return response()->json([
            'status' => $run->status,
            'run_id' => $run->id,
            'flow_id' => $flow->id,
        ]);
    }

    /** @return array<array-key, mixed> */
    private function resolvePayload(Request $request): array
    {
        $data = $request->all();

        if (! empty($data)) {
            return $data;
        }

        $raw = $request->getContent();

        if (! empty($raw)) {
            $decoded = json_decode($raw, true);
            if (is_array($decoded)) {
                return $decoded;
            }

            return ['_raw' => $raw];
        }

        return [];
    }

    /** @param array<array-key, mixed> $payload */
    private function assertPayloadComplexity(array $payload): void
    {
        $maxFields = $this->configLimit('puppetflow.trigger_max_fields', 5000);
        $maxDepth = $this->configLimit('puppetflow.trigger_max_depth', 32);
        $items = 0;
        $walk = function (array $values, int $depth) use (&$walk, &$items, $maxDepth, $maxFields): void {
            abort_if($depth > $maxDepth, 422, 'Trigger payload is nested too deeply.');

            foreach ($values as $value) {
                $items++;
                abort_if($items > $maxFields, 422, 'Trigger payload contains too many fields.');
                if (is_array($value)) {
                    $walk($value, $depth + 1);
                }
            }
        };

        $walk($payload, 1);
    }

    private function configLimit(string $key, int $default): int
    {
        $value = config($key, $default);

        return is_numeric($value) ? max(1, (int) $value) : $default;
    }
}
