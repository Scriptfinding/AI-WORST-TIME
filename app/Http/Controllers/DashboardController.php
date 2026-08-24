<?php

namespace App\Http\Controllers;

use App\Authorization\AuthorizationContextFactory;
use App\Authorization\Visibility\FlowRunVisibility;
use App\Authorization\Visibility\FlowVisibility;
use App\Models\Flow;
use App\Models\FlowRun;
use App\Models\User;
use App\Services\FeatureFlags\RunCycleService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private readonly AuthorizationContextFactory $authorizationContexts,
        private readonly FlowVisibility $flowVisibility,
        private readonly FlowRunVisibility $runVisibility,
    ) {}

    public function __invoke(Request $request): Response
    {
        $currentWorkspaceId = $this->workspaceIdFromSession();
        $workspaceId = $currentWorkspaceId;
        /** @var User $user */
        $user = $request->user();
        $context = $this->authorizationContexts->for($user, $workspaceId);

        $flowsQuery = $this->flowVisibility->apply(Flow::query(), $context);

        $intStat = static fn (mixed $value): int => is_numeric($value) ? (int) $value : 0;

        $flowStats = (clone $flowsQuery)
            ->selectRaw('COUNT(*) AS total, SUM(CASE WHEN is_published THEN 1 ELSE 0 END) AS published')
            ->first();
        $totalFlows = $intStat($flowStats?->getAttribute('total'));
        $publishedFlows = $intStat($flowStats?->getAttribute('published'));

        $recentRunsQuery = FlowRun::query();
        $this->runVisibility->apply($recentRunsQuery, $context);
        $recentRuns = $recentRunsQuery
            ->with(['flow:id,name,icon_type,icon_value,icon_color,icon_upload_path,timeout_seconds,flow_type,nodal_graph,keyboard_speed,viewport_width,viewport_height', 'triggeredBy:id,name'])
            ->latest()
            ->take(10)
            ->get();

        $recentRuns->each(function (FlowRun $run) {
            $run->redactSecretsForClient()
                ->makeVisible(['console_logs', 'action_logs', 'code_snapshot']);
        });

        $runsQuery = FlowRun::query();
        $this->runVisibility->apply($runsQuery, $context);

        $runStats = (clone $runsQuery)
            ->selectRaw("
                COUNT(*) AS total,
                SUM(CASE WHEN flow_runs.status = 'error' THEN 1 ELSE 0 END) AS failed,
                SUM(CASE WHEN flow_runs.status = 'pending' THEN 1 ELSE 0 END) AS pending,
                SUM(CASE WHEN flow_runs.status = 'running' THEN 1 ELSE 0 END) AS running
            ")
            ->first();
        $userRunsCount = $intStat($runStats?->getAttribute('total'));
        $failedCount = $intStat($runStats?->getAttribute('failed'));
        $pendingCount = $intStat($runStats?->getAttribute('pending'));
        $runningCount = $intStat($runStats?->getAttribute('running'));

        $operatorSecondsSaved = (clone $runsQuery)
            ->where('flow_runs.status', 'success')
            ->join('flows', 'flow_runs.flow_id', '=', 'flows.id')
            ->sum('flows.operator_seconds');

        $runningRuns = (clone $runsQuery)
            ->whereIn('flow_runs.status', ['running', 'pending'])
            ->with(['flow:id,name,icon_type,icon_value,icon_color,icon_upload_path,timeout_seconds,flow_type,nodal_graph,keyboard_speed,viewport_width,viewport_height', 'triggeredBy:id,name'])
            ->latest()
            ->get();

        $runningRuns->each(function (FlowRun $run) {
            $run->redactSecretsForClient()
                ->makeVisible(['console_logs', 'action_logs', 'code_snapshot']);
        });

        return Inertia::render('Dashboard/Dashboard', [
            'stats' => [
                'totalFlows' => $totalFlows,
                'publishedFlows' => $publishedFlows,
                'totalRuns' => $userRunsCount,
                'failedRuns' => $failedCount,
                'pendingRuns' => $pendingCount,
                'runningRuns' => $runningCount,
                'operatorSecondsSaved' => (int) $operatorSecondsSaved,
                'cycle' => app(RunCycleService::class)->current(),
            ],
            'recentRuns' => $recentRuns,
            'runningRuns' => $runningRuns,
            'recentFlows' => function () use ($flowsQuery, $workspaceId) {
                $recentFlows = (clone $flowsQuery)
                    ->with(['owner:id,name', 'team:id'])
                    ->withCount(['triggers', 'actions'])
                    ->latest('updated_at')
                    ->take(5)
                    ->get();

                $this->injectOwnerWorkspaceRoles($recentFlows, $workspaceId, 'owner_id');

                return $recentFlows;
            },
        ]);
    }
}
