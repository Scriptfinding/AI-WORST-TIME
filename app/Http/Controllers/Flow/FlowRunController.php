<?php

/*
 * Portions of this file implement the paid Puppetflow video replay
 * (recording) feature and are licensed under the Puppetflow Proprietary
 * License. See LICENSE_PROPRIETARY.md.
 */

namespace App\Http\Controllers\Flow;

use App\Authorization\AuthorizationContextFactory;
use App\Authorization\Visibility\FlowRunVisibility;
use App\Enums\Authorization\Ability;
use App\Enums\Flow\FlowRunArtifactTypeEnum;
use App\Http\Controllers\Controller;
use App\Models\Flow;
use App\Models\FlowRun;
use App\Models\FlowUserInput;
use App\Models\User;
use App\Services\BrowserStream\BrowserStreamTokenService;
use App\Services\FeatureFlags\FeatureFlagService;
use App\Services\Flow\ArtifactCleanupService;
use App\Services\Flow\FlowRunnerService;
use App\Services\Flow\FlowRunProductionService;
use App\Services\Flow\Query\FlowTreeBuilder;
use App\Services\Runtime\RunnerSignalService;
use App\Services\Storage\ArtifactResponseFactory;
use App\Services\Storage\RunArtifactQueryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class FlowRunController extends Controller
{
    public function __construct(
        private FlowRunnerService $runner,
        private ArtifactCleanupService $artifactCleanup,
        private readonly FlowRunVisibility $runVisibility,
        private readonly BrowserStreamTokenService $streamTokens,
        private readonly RunArtifactQueryService $artifactQueries,
        private readonly ArtifactResponseFactory $artifactResponses,
        private readonly RunnerSignalService $runtimeSignals,
        private readonly FeatureFlagService $features,
        private readonly FlowRunProductionService $productionRuns,
        private readonly FlowTreeBuilder $trees,
        private readonly AuthorizationContextFactory $contexts,
    ) {}

    private function authorizeRunAccess(
        Flow $flow,
        FlowRun $run,
        Ability $ability = Ability::VIEW,
    ): void {
        $this->assertFlowInCurrentWorkspace($flow);
        abort_unless($run->flow_id === $flow->id, 404);
        $this->authorize($ability->value, $run);
    }

    private function authorizeFlowAccess(Flow $flow, Ability $ability): void
    {
        $this->assertFlowInCurrentWorkspace($flow);
        $this->authorize($ability->value, $flow);
    }

    private function assertFlowInCurrentWorkspace(Flow $flow): void
    {
        $currentWorkspaceId = $this->workspaceIdFromSession();
        abort_unless($flow->workspace_id === $currentWorkspaceId, 404);
    }

    public function store(Request $request, Flow $flow): RedirectResponse
    {
        $this->authorizeFlowAccess($flow, Ability::EXECUTE);

        $validated = $request->validate([
            'input' => 'nullable|array',
            'code_override' => 'nullable|string|max:2000000',
            'is_rerun' => 'nullable|boolean',
        ]);
        if (isset($validated['code_override'])) {
            $this->authorizeFlowAccess($flow, Ability::UPDATE);
        }

        /** @var User $user */
        $user = $request->user();

        $input = $validated['input'] ?? [];

        if (empty($validated['is_rerun'])) {
            FlowUserInput::updateOrCreate(
                ['flow_id' => $flow->id, 'user_id' => $user->id],
                ['input' => $input ?: null],
            );
        }

        $this->runner->dispatch(
            $flow,
            $user,
            $input,
            'manual',
            $validated['code_override'] ?? null,
        );

        return back()->with('success', 'Flow run queued.');
    }

    public function index(Request $request, Flow $flow): JsonResponse
    {
        $this->authorizeFlowAccess($flow, Ability::VIEW);

        $runsQuery = FlowRun::query()
            ->where('flow_id', $flow->id)
            ->with(['triggeredBy:id,name', 'trigger:id,type,label'])
            ->latest();
        /** @var User $user */
        $user = $request->user();
        $this->runVisibility->applyForUser($runsQuery, $user, $flow->workspace_id);

        $paginated = $runsQuery->paginate(20);
        // Lists trust the backfilled has_recording column; the live artifact
        // check is reserved for the show/download endpoints.
        $recordingEnabled = $this->features->enabled('recording_enabled');
        $paginated->getCollection()->each(function (FlowRun $run) use ($recordingEnabled) {
            $run->setAttribute('has_recording', $recordingEnabled && $run->has_recording);
            $run->redactSecretsForClient()
                ->makeVisible(['console_logs', 'action_logs', 'code_snapshot']);
        });

        return response()->json($paginated);
    }

    public function show(Flow $flow, FlowRun $run): JsonResponse
    {
        $this->authorizeFlowAccess($flow, Ability::VIEW);
        $this->authorizeRunAccess($flow, $run);

        $run->load(['triggeredBy:id,name', 'trigger:id,type,label']);
        $run->setAttribute(
            'has_recording',
            $this->features->enabled('recording_enabled') && $run->recordingExists(),
        );
        $run->redactSecretsForClient()
            ->makeVisible(['console_logs', 'action_logs', 'code_snapshot']);

        return response()->json($run);
    }

    public function artifacts(Flow $flow, FlowRun $run, string $type): JsonResponse
    {
        $this->features->abortIfDisabled('recording_enabled');
        $this->authorizeFlowAccess($flow, Ability::VIEW);
        $this->authorizeRunAccess($flow, $run);

        if (! in_array($type, FlowRunArtifactTypeEnum::getArtifactApiTypes(true))) {
            return response()->json(['error' => 'Invalid artifact type.'], 422);
        }

        return response()->json($this->artifactQueries->artifactFiles($run, $type));
    }

    public function downloadArtifact(Flow $flow, FlowRun $run, string $type, string $filename): \Symfony\Component\HttpFoundation\Response
    {
        $this->features->abortIfDisabled('recording_enabled');
        $this->authorizeFlowAccess($flow, Ability::VIEW);
        $this->authorizeRunAccess($flow, $run);

        if (! in_array($type, FlowRunArtifactTypeEnum::getArtifactApiTypes(true))) {
            abort(404);
        }

        $response = $this->artifactResponses->makeForRun($run, $type, $filename);
        if ($response === null) {
            abort(404);
        }

        return $response;
    }

    public function kill(Request $request, Flow $flow, FlowRun $run): RedirectResponse
    {
        $this->authorizeRunAccess($flow, $run, Ability::KILL_RUN);

        /** @var User $user */
        $user = $request->user();
        $userName = $user->name;
        $cancellation = DB::transaction(function () use ($run, $userName): ?string {
            $lockedRun = FlowRun::query()
                ->whereKey($run->getKey())
                ->where('flow_id', $run->flow_id)
                ->lockForUpdate()
                ->first();

            if (! $lockedRun || ! in_array($lockedRun->status, ['pending', 'running'], true)) {
                return null;
            }

            if ($lockedRun->status === 'pending') {
                $lockedRun->update([
                    'status' => 'cancelled',
                    'cancellation_requested_at' => now(),
                    'error_message' => "Cancelled by user {$userName}.",
                ]);
                $this->productionRuns->handleLockedTerminalRun($lockedRun);

                return 'cancelled';
            }

            $lockedRun->update([
                'cancellation_requested_at' => now(),
            ]);

            return 'requested';
        });
        $requested = $cancellation !== null;

        if ($requested) {
            Cache::put("flow_run_kill:{$run->id}", true, 600);
            Cache::put("flow_run_killed_by:{$run->id}", $userName, 600);
        }

        return $requested
            ? back()->with('success', 'Run cancellation requested.')
            : back()->with('error', 'Run is not active.');
    }

    public function continueRun(Request $request, Flow $flow, FlowRun $run): JsonResponse|RedirectResponse
    {
        $this->authorizeRunAccess($flow, $run, Ability::CONTINUE_RUN);
        $validated = $request->validate(['wait_id' => ['required', 'uuid']]);
        $result = $this->runtimeSignals->requestContinuation($run, $validated['wait_id']);
        if ($result !== RunnerSignalService::RESULT_ACCEPTED) {
            $message = match ($result) {
                RunnerSignalService::RESULT_INACTIVE => 'Run is not active.',
                default => 'Run is not waiting for this validation request.',
            };

            return $request->expectsJson()
                ? response()->json(['message' => $message], 409)
                : back()->with('error', $message);
        }

        return $request->expectsJson()
            ? response()->json(['continue_requested' => true])
            : back()->with('success', 'Run will continue.');
    }

    public function waitStatus(Flow $flow, FlowRun $run): JsonResponse
    {
        $this->authorizeFlowAccess($flow, Ability::VIEW);
        $this->authorizeRunAccess($flow, $run);

        $waitId = $run->runtimeWaitId();

        return response()->json([
            'waiting' => $waitId !== null,
            'wait_id' => $waitId,
            'validation_message' => $waitId !== null ? $run->runtimeValidationMessage() : null,
        ]);
    }

    public function streamToken(Request $request, Flow $flow, FlowRun $run): JsonResponse
    {
        $this->features->abortIfDisabled('live_view_enabled');
        $this->authorizeFlowAccess($flow, Ability::VIEW);
        $this->authorizeRunAccess($flow, $run, Ability::VIEW);

        /** @var User $user */
        $user = $request->user();
        $canControl = $user->can(Ability::CONTINUE_RUN->value, $run);
        $role = $canControl
            ? BrowserStreamTokenService::ROLE_CONTROLLER
            : BrowserStreamTokenService::ROLE_VIEWER;
        $token = $this->streamTokens->issue($run, $role);

        return response()
            ->json([
                'url' => $this->streamTokens->publicUrl($run, $role),
                'protocol' => $this->streamTokens->protocol($token),
                'can_control' => $canControl,
                'expires_at' => $token['expires'],
            ])
            ->header('Cache-Control', 'no-store, private');
    }

    public function destroy(Flow $flow, FlowRun $run): RedirectResponse
    {
        $this->authorizeRunAccess($flow, $run, Ability::DELETE);

        if (in_array($run->status, ['pending', 'running'])) {
            return back()->with('error', 'Cannot delete an active run.');
        }

        $this->artifactCleanup->deleteRun($run);

        return back()->with('success', 'Run deleted.');
    }

    public function destroyBatch(Request $request, Flow $flow): RedirectResponse
    {
        $this->authorizeFlowAccess($flow, Ability::UPDATE);

        $validated = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer',
        ]);

        if ($flow->runs()
            ->whereIn('id', $validated['ids'])
            ->whereIn('status', ['pending', 'running'])
            ->exists()) {
            return back()->with('error', 'Cannot delete active runs.');
        }

        /** @var \Illuminate\Database\Eloquent\Collection<int, FlowRun> $runs */
        $runs = $flow->runs()
            ->whereIn('id', $validated['ids'])
            ->get();

        $this->artifactCleanup->deleteRuns($runs);

        return back()->with('success', "Deleted {$runs->count()} run(s).");
    }

    public function destroyAll(Flow $flow): RedirectResponse
    {
        $this->authorizeFlowAccess($flow, Ability::UPDATE);

        if ($flow->runs()->whereIn('status', ['pending', 'running'])->exists()) {
            return back()->with('error', 'Cannot clear runs while a run is active.');
        }

        $count = $this->artifactCleanup->deleteAllRuns($flow);

        return back()->with('success', "Cleared {$count} run(s).");
    }

    public function recording(Flow $flow, FlowRun $run): \Symfony\Component\HttpFoundation\Response
    {
        $this->features->abortIfDisabled('recording_enabled');
        $this->authorizeFlowAccess($flow, Ability::VIEW);
        $this->authorizeRunAccess($flow, $run);

        $response = $this->artifactResponses->makeRecording($run);
        if ($response === null) {
            abort(404);
        }

        return $response;
    }

    public function recordingLastshot(Flow $flow, FlowRun $run): \Symfony\Component\HttpFoundation\Response
    {
        $this->features->abortIfDisabled('recording_enabled');
        $this->authorizeFlowAccess($flow, Ability::VIEW);
        $this->authorizeRunAccess($flow, $run);

        $response = $this->artifactResponses->makeRecording($run, true);
        if ($response === null) {
            abort(404);
        }

        return $response;
    }

    public function recordingPlayer(Request $request, Flow $flow, FlowRun $run): Response
    {
        $this->features->abortIfDisabled('recording_enabled');
        $this->authorizeFlowAccess($flow, Ability::VIEW);
        $this->authorizeRunAccess($flow, $run);

        $hasFile = $this->artifactQueries->recordingExists($run);

        $run->redactSecretsForClient()->makeVisible(['action_logs']);
        $workspaceId = $flow->workspace_id;
        $user = $request->user();
        if (! $user instanceof User) {
            abort(401);
        }
        $context = $this->contexts->for($user, $workspaceId);

        return Inertia::render('Flow/RecordingPlayer/RecordingPlayerPage', [
            'flow' => $flow,
            'run' => $run,
            'recordingUrl' => $hasFile ? route('flows.runs.recording', [$flow, $run]) : null,
            'personalTree' => $this->trees->personal($workspaceId, $user),
            'workspaceTree' => $this->trees->workspace($workspaceId, $user),
            'teamTrees' => $this->trees->teams($workspaceId, $user, $this->trees->visibleTeamIds($context, $workspaceId)),
        ]);
    }

    public function recordingPlayerShort(Request $request, FlowRun $run): RedirectResponse
    {
        $this->features->abortIfDisabled('recording_enabled');
        $flow = $run->flow;
        abort_unless($flow instanceof Flow, 404);
        $currentWorkspaceId = $this->workspaceIdFromSession();
        abort_unless($flow->workspace_id === $currentWorkspaceId, 404);
        abort_unless($run->flow_id === $flow->id, 404);
        /** @var User $user */
        $user = $request->user();
        abort_unless($user->can(Ability::VIEW->value, $flow), 404);
        abort_unless($user->can(Ability::VIEW->value, $run), 404);

        return redirect()->route('flows.runs.recording.player', [$flow, $run]);
    }
}
