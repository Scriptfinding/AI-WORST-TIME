<?php

/*
 * Explicit proprietary scope: the replay recording endpoints and artifact exposure in this file implement paid
 * Puppetflow features and are licensed under the Puppetflow Proprietary License.
 * See LICENSE_PROPRIETARY.md.
 */

namespace App\Http\Controllers\Api;

use App\Authorization\AuthorizationContextFactory;
use App\Authorization\Visibility\FlowRunVisibility;
use App\Enums\Authorization\Ability;
use App\Enums\Flow\FlowRunArtifactTypeEnum;
use App\Http\Controllers\Api\Concerns\ResolvesFlow;
use App\Http\Controllers\Controller;
use App\Models\Flow;
use App\Models\FlowRun;
use App\Models\User;
use App\Services\FeatureFlags\FeatureFlagService;
use App\Services\Runtime\RunnerSignalService;
use App\Services\Storage\ArtifactResponseFactory;
use App\Services\Storage\RunArtifactQueryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Symfony\Component\HttpFoundation\Response;

class RunApiController extends Controller
{
    use ResolvesFlow;

    public function __construct(
        private readonly AuthorizationContextFactory $authorizationContexts,
        private readonly FlowRunVisibility $runVisibility,
        private readonly RunArtifactQueryService $artifactQueries,
        private readonly ArtifactResponseFactory $artifactResponses,
        private readonly RunnerSignalService $runtimeSignals,
        private readonly FeatureFlagService $features,
    ) {}

    public function index(Request $request, string $id): JsonResponse
    {
        [$flow, $error] = $this->authorizeFlow($request, $id);
        if ($error) {
            return $error;
        }
        /** @var Flow $flow */
        $query = FlowRun::where('flow_id', $flow->id)
            ->with(['triggeredBy:id,name', 'trigger:id'])
            ->latest();
        /** @var User $user */
        $user = $request->user();
        $this->runVisibility->apply(
            $query,
            $this->authorizationContexts->for($user, $flow->workspace_id),
        );

        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        $paginated = $query->paginate(min(max($request->integer('per_page', 20), 1), 100));

        $this->applyVisibleFields($request, $paginated->getCollection());

        return response()->json($paginated);
    }

    public function show(Request $request, string $id, FlowRun $run): JsonResponse
    {
        [$flow, $error] = $this->authorizeFlow($request, $id);
        if ($error) {
            return $error;
        }
        /** @var Flow $flow */
        $this->authorizeRun($request, $flow, $run);

        $run->load(['triggeredBy:id,name', 'trigger:id']);

        $this->applyVisibleFields($request, collect([$run]));

        $data = $run->toArray();
        $waitId = $run->runtimeWaitId();
        $data['waiting_for_human_validation'] = $waitId !== null;
        $data['human_validation_wait_id'] = $waitId;
        $data['artifacts'] = $this->buildArtifacts($flow, $run);

        return response()->json($data);
    }

    public function result(Request $request, string $id, FlowRun $run): JsonResponse
    {
        [$flow, $error] = $this->authorizeFlow($request, $id);
        if ($error) {
            return $error;
        }
        /** @var Flow $flow */
        $this->authorizeRun($request, $flow, $run);
        $run->redactSecretsForClient();
        $output = $run->output;

        return response()->json([
            'run_id' => $run->id,
            'status' => $run->status,
            'output' => $output,
            'error_message' => $run->error_message,
            'duration_ms' => $run->duration_ms,
        ]);
    }

    public function continueRun(Request $request, string $id, FlowRun $run): JsonResponse
    {
        [$flow, $error] = $this->authorizeFlow($request, $id);
        if ($error) {
            return $error;
        }
        /** @var Flow $flow */
        $this->authorizeRun($request, $flow, $run, Ability::CONTINUE_RUN);
        $validated = $request->validate(['wait_id' => ['required', 'uuid']]);
        $result = $this->runtimeSignals->requestContinuation($run, $validated['wait_id']);
        if ($result !== RunnerSignalService::RESULT_ACCEPTED) {
            return response()->json(['error' => match ($result) {
                RunnerSignalService::RESULT_INACTIVE => 'Run is not active.',
                default => 'Run is not waiting for this validation request.',
            }], 409);
        }

        return response()->json([
            'run_id' => $run->id,
            'status' => $run->status,
            'continue_requested' => true,
        ]);
    }

    public function artifacts(Request $request, string $id, FlowRun $run, string $type): JsonResponse
    {
        $this->features->abortIfDisabled('recording_enabled');
        [$flow, $error] = $this->authorizeFlow($request, $id);
        if ($error) {
            return $error;
        }
        /** @var Flow $flow */
        $this->authorizeRun($request, $flow, $run);

        if (! in_array($type, FlowRunArtifactTypeEnum::getArtifactApiTypes(true))) {
            return response()->json(['error' => 'Invalid artifact type.'], 422);
        }

        return response()->json($this->artifactQueries->artifactFiles($run, $type));
    }

    public function recording(Request $request, string $id, FlowRun $run): Response
    {
        $this->features->abortIfDisabled('recording_enabled');
        [$flow, $error] = $this->authorizeFlow($request, $id);
        if ($error) {
            return $error;
        }
        /** @var Flow $flow */
        $this->authorizeRun($request, $flow, $run);

        $response = $this->artifactResponses->makeRecording($run);
        if ($response === null) {
            abort(404);
        }

        return $response;
    }

    public function recordingLastshot(Request $request, string $id, FlowRun $run): Response
    {
        $this->features->abortIfDisabled('recording_enabled');
        [$flow, $error] = $this->authorizeFlow($request, $id);
        if ($error) {
            return $error;
        }
        /** @var Flow $flow */
        $this->authorizeRun($request, $flow, $run);

        $response = $this->artifactResponses->makeRecording($run, true);
        if ($response === null) {
            abort(404);
        }

        return $response;
    }

    public function downloadArtifact(Request $request, string $id, FlowRun $run, string $type, string $filename): Response
    {
        $this->features->abortIfDisabled('recording_enabled');
        [$flow, $error] = $this->authorizeFlow($request, $id);
        if ($error) {
            return $error;
        }
        /** @var Flow $flow */
        $this->authorizeRun($request, $flow, $run);

        if (! in_array($type, FlowRunArtifactTypeEnum::getArtifactApiTypes(true))) {
            abort(404);
        }

        $response = $this->artifactResponses->makeForRun($run, $type, $filename);
        if ($response === null) {
            abort(404);
        }

        return $response;
    }

    /**
     * @return array<string, mixed>
     */
    private function buildArtifacts(Flow $flow, FlowRun $run): array
    {
        if (! $this->features->enabled('recording_enabled')) {
            return [];
        }

        /** @var string $configuredAppUrl */
        $configuredAppUrl = config('app.url', '');
        $appUrl = rtrim($configuredAppUrl, '/');
        $base = "{$appUrl}/api/v1/flows/{$flow->id}/runs/{$run->id}";

        $downloads = $this->artifactQueries->artifactFiles($run, 'downloads');
        $screenshots = $this->artifactQueries->artifactFiles($run, 'screenshots');

        $mapFiles = fn (array $files, string $type) => array_map(
            fn (array $f) => [
                ...$f,
                'url' => $base."/artifacts/{$type}/".$this->encodeArtifactPath($f['name']),
            ],
            $files,
        );

        return [
            'downloads' => $mapFiles($downloads, 'downloads'),
            'screenshots' => $mapFiles($screenshots, 'screenshots'),
            'recording' => $run->recordingExists()
                ? [
                    'file' => $base.'/recording',
                    'player' => $appUrl.'/flows/'.$flow->id.'/runs/'.$run->id.'/recording/player',
                    'lastshot' => $run->recordingLastshotExists() ? $base.'/recording/lastshot' : null,
                ]
                : null,
        ];
    }

    private function encodeArtifactPath(string $path): string
    {
        return implode('/', array_map(rawurlencode(...), explode('/', $path)));
    }

    /**
     * @param  Collection<int, FlowRun>  $runs
     */
    private function applyVisibleFields(Request $request, Collection $runs): void
    {
        $makeVisible = [];
        if ($request->boolean('logs')) {
            $makeVisible[] = 'console_logs';
        }
        if ($request->boolean('code')) {
            $makeVisible[] = 'code_snapshot';
        }

        // Lists trust the backfilled has_recording column; buildArtifacts on
        // the show endpoint still performs the live artifact check.
        $recordingEnabled = $this->features->enabled('recording_enabled');
        $runs->each(function (FlowRun $run) use ($makeVisible, $recordingEnabled) {
            $run->setAttribute('has_recording', $recordingEnabled && $run->has_recording);
            $run->redactSecretsForClient();
            if ($makeVisible !== []) {
                $run->makeVisible($makeVisible);
            }
        });
    }

    private function authorizeRun(
        Request $request,
        Flow $flow,
        FlowRun $run,
        Ability $ability = Ability::VIEW,
    ): void {
        abort_unless($run->flow_id === $flow->id, 404);
        /** @var User $user */
        $user = $request->user();
        abort_unless($user->can($ability->value, $run), 404);
    }

    /**
     * @return array{0: Flow|null, 1: JsonResponse|null}
     */
    private function authorizeFlow(Request $request, string $id): array
    {
        /** @var User $user */
        $user = $request->user();
        $flow = $this->resolveFlow($id, $user);

        if (! $flow) {
            return [null, response()->json(['error' => 'Flow not found.'], 404)];
        }

        if (! $this->canAccessFlow($user, $flow)) {
            return [null, response()->json(['error' => 'Forbidden.'], 403)];
        }

        return [$flow, null];
    }
}
