<?php

/*
 * Explicit proprietary scope: paid replay exposure and licensed run-retention
 * branches in this controller are licensed under the Puppetflow Proprietary
 * License. See LICENSE_PROPRIETARY.md.
 */

namespace App\Http\Controllers\Flow;

use App\Authorization\AuthorizationContextFactory;
use App\Authorization\Visibility\FlowRunVisibility;
use App\Enums\Authorization\Ability;
use App\Http\Controllers\Controller;
use App\Models\FlowRun;
use App\Models\User;
use App\Services\FeatureFlags\FeatureFlagService;
use App\Services\Flow\ArtifactCleanupService;
use App\Services\Flow\FlowRunMetadataFilter;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FlowRunsPageController extends Controller
{
    private const STATUSES = ['pending', 'running', 'success', 'error', 'cancelled'];

    private const ACTIVE_STATUSES = ['pending', 'running'];

    private const TERMINATED_STATUSES = ['success', 'error', 'cancelled'];

    public function __construct(
        private readonly ArtifactCleanupService $artifactCleanup,
        private readonly AuthorizationContextFactory $authorizationContexts,
        private readonly FlowRunVisibility $runVisibility,
        private readonly FlowRunMetadataFilter $metadataFilter,
    ) {}

    public function __invoke(Request $request): Response
    {
        $baseQuery = $this->visibleRunsQuery($request);
        $runUsers = (clone $baseQuery)
            ->reorder()
            ->whereNotNull('flow_runs.triggered_by')
            ->join('users', 'users.id', '=', 'flow_runs.triggered_by')
            ->select('users.id', 'users.name')
            ->distinct()
            ->orderBy('users.name')
            ->get()
            ->map(function (FlowRun $runUser): array {
                /** @var string $id */
                $id = $runUser->getAttribute('id');
                /** @var string $name */
                $name = $runUser->getAttribute('name');

                return ['id' => $id, 'name' => $name];
            })
            ->values();
        $filteredQuery = $this->applyFilters($baseQuery, $request);

        $perPage = min(max($request->integer('per_page', 50), 1), 100);

        $runningRuns = (clone $filteredQuery)
            ->whereIn('flow_runs.status', self::ACTIVE_STATUSES)
            ->paginate(perPage: $perPage, pageName: 'running_page')
            ->withQueryString();

        $terminatedRuns = (clone $filteredQuery)
            ->whereIn('flow_runs.status', self::TERMINATED_STATUSES)
            ->paginate(perPage: $perPage, pageName: 'terminated_page')
            ->withQueryString();

        $runningRuns->getCollection()->each(function (FlowRun $run): void {
            $run->redactSecretsForClient()
                ->makeVisible(['console_logs', 'action_logs', 'code_snapshot']);
        });
        $terminatedRuns->getCollection()->each(function (FlowRun $run): void {
            $run->redactSecretsForClient()
                ->makeVisible(['console_logs', 'action_logs', 'code_snapshot']);
        });

        $stats = (clone $filteredQuery)
            ->reorder()
            ->selectRaw(
                "COUNT(*) AS total,
                SUM(CASE WHEN flow_runs.status = 'pending' THEN 1 ELSE 0 END) AS pending,
                SUM(CASE WHEN flow_runs.status = 'running' THEN 1 ELSE 0 END) AS running,
                SUM(CASE WHEN flow_runs.status = 'success' THEN 1 ELSE 0 END) AS success,
                SUM(CASE WHEN flow_runs.status = 'error' THEN 1 ELSE 0 END) AS error,
                SUM(CASE WHEN flow_runs.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled"
            )
            ->first();

        return Inertia::render('Flow/Runs/Runs', [
            'runningRuns' => $runningRuns,
            'terminatedRuns' => $terminatedRuns,
            'runUsers' => $runUsers,
            'stats' => [
                'total' => $this->statistic($stats?->getAttribute('total')),
                'pending' => $this->statistic($stats?->getAttribute('pending')),
                'running' => $this->statistic($stats?->getAttribute('running')),
                'success' => $this->statistic($stats?->getAttribute('success')),
                'error' => $this->statistic($stats?->getAttribute('error')),
                'cancelled' => $this->statistic($stats?->getAttribute('cancelled')),
            ],
            'concurrentRunsLimit' => app(FeatureFlagService::class)->limit('concurrent_runs_limit'),
            'filters' => [
                'statuses' => $this->normalizeStatuses($request),
                'date_from' => $request->input('date_from'),
                'date_to' => $request->input('date_to'),
                'legend' => $request->input('legend'),
                'duration_min_ms' => $request->input('duration_min_ms'),
                'duration_max_ms' => $request->input('duration_max_ms'),
                'flow_search' => $request->input('flow_search'),
                'triggered_by' => $this->triggeredById($request),
                'meta_filters' => $this->normalizeMetaFilters($request),
                'meta_predicate' => $request->input('meta_predicate', 'and'),
                'meta_presence' => $this->normalizeMetaPresence($request),
                'per_page' => $perPage,
            ],
        ]);
    }

    public function destroyBatch(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer'],
        ]);

        /** @var \Illuminate\Database\Eloquent\Collection<int, FlowRun> $runs */
        $runs = $this->visibleRunsQuery($request)
            ->whereIn('flow_runs.id', $validated['ids'])
            ->get();

        /** @var User $user */
        $user = $request->user();
        foreach ($runs as $run) {
            if (! $user->can(Ability::DELETE->value, $run)) {
                abort(403);
            }
        }

        if ($runs->contains(fn (FlowRun $run): bool => in_array($run->status, self::ACTIVE_STATUSES, true))) {
            return back()->with('error', 'Cannot delete active runs.');
        }

        $this->artifactCleanup->deleteRuns($runs);

        return back()->with('success', "Deleted {$runs->count()} run(s).");
    }

    /** @return Builder<FlowRun> */
    private function visibleRunsQuery(Request $request): Builder
    {
        $currentWorkspaceId = $this->workspaceIdFromSession();
        $workspaceId = $currentWorkspaceId;
        /** @var User $user */
        $user = $request->user();
        $context = $this->authorizationContexts->for($user, $workspaceId);

        $query = FlowRun::query();
        $this->runVisibility->apply($query, $context);

        return $query
            ->with([
                'flow:id,name,icon_type,icon_value,icon_color,icon_upload_path,timeout_seconds,flow_type,nodal_graph,keyboard_speed,viewport_width,viewport_height,owner_id,workspace_id',
                'triggeredBy:id,name',
                'trigger:id,type,label',
            ])
            ->latest('flow_runs.created_at');
    }

    /**
     * @param  Builder<FlowRun>  $query
     * @return Builder<FlowRun>
     */
    private function applyFilters(Builder $query, Request $request): Builder
    {
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');

        if ($dateFrom && $dateTo) {
            $query->whereBetween('flow_runs.created_at', [$dateFrom, $dateTo]);
        } elseif ($dateFrom) {
            $query->where('flow_runs.created_at', '>=', $dateFrom);
        } elseif ($dateTo) {
            $query->where('flow_runs.created_at', '<=', $dateTo);
        }

        $statuses = $this->normalizeStatuses($request);
        if (! empty($statuses)) {
            $query->whereIn('flow_runs.status', $statuses);
        }

        $triggeredBy = $this->normalizeTriggeredBy($request);
        if ($triggeredBy !== null) {
            $query->where('flow_runs.triggered_by', $triggeredBy);
        }

        $legend = trim($request->string('legend')->toString());
        if ($legend !== '') {
            $query->where('flow_runs.legend', 'like', "%{$legend}%");
        }

        $durationMin = $request->integer('duration_min_ms');
        if ($request->has('duration_min_ms')) {
            $query->where('flow_runs.duration_ms', '>=', max(0, $durationMin));
        }

        $durationMax = $request->integer('duration_max_ms');
        if ($request->has('duration_max_ms')) {
            $query->where('flow_runs.duration_ms', '<=', max(0, $durationMax));
        }

        $flowSearch = trim($request->string('flow_search')->toString());
        if ($flowSearch !== '') {
            $query->where(function (Builder $searchQuery) use ($flowSearch) {
                if (ctype_digit($flowSearch)) {
                    $searchQuery->whereRaw('CAST(flow_runs.id AS TEXT) LIKE ?', ["%{$flowSearch}%"]);
                }

                $searchQuery->orWhereHas('flow', function (Builder $flowQuery) use ($flowSearch) {
                    $flowQuery->where('name', 'like', "%{$flowSearch}%")
                        ->orWhere('id', 'like', "%{$flowSearch}%");
                });
            });
        }

        $this->applyMetaFilters($query, $request);
        $this->applyMetaPresenceFilter($query, $request);

        return $query;
    }

    /** @return list<string> */
    private function normalizeStatuses(Request $request): array
    {
        $statuses = $request->input('statuses', []);
        if (! is_array($statuses)) {
            $statuses = [$statuses];
        }

        return array_values(array_filter(
            $statuses,
            fn (mixed $status): bool => is_string($status) && in_array($status, self::STATUSES, true),
        ));
    }

    private function normalizeTriggeredBy(Request $request): ?string
    {
        $id = $request->input('triggered_by');
        if (! is_string($id) || $id === '') {
            return null;
        }

        $id = User::where('id', $id)->value('id');

        return is_string($id) ? $id : null;
    }

    private function triggeredById(Request $request): ?string
    {
        $id = $request->input('triggered_by');

        return is_string($id) && $id !== '' ? $id : null;
    }

    /** @return list<array{key: string, operator?: string, value?: string}> */
    private function normalizeMetaFilters(Request $request): array
    {
        if (! app(FeatureFlagService::class)->enabled('run_metadata_search_enabled')) {
            return [];
        }

        $metaFilters = $request->input('meta_filters', []);
        if (! is_array($metaFilters)) {
            return [];
        }

        return $this->metadataFilter->normalize($metaFilters);
    }

    private function normalizeMetaPresence(Request $request): ?string
    {
        if (! app(FeatureFlagService::class)->enabled('run_metadata_search_enabled')) {
            return null;
        }

        $presence = $request->input('meta_presence');

        return in_array($presence, ['any', 'none'], true) ? $presence : null;
    }

    /** @param Builder<FlowRun> $query */
    private function applyMetaPresenceFilter(Builder $query, Request $request): void
    {
        $presence = $this->normalizeMetaPresence($request);
        if (! $presence) {
            return;
        }

        $this->metadataFilter->applyPresence($query, $presence);
    }

    /** @param Builder<FlowRun> $query */
    private function applyMetaFilters(Builder $query, Request $request): void
    {
        $validFilters = $this->normalizeMetaFilters($request);
        if (empty($validFilters)) {
            return;
        }

        $this->metadataFilter->applyFilters(
            $query,
            $validFilters,
            $request->input('meta_predicate', 'and'),
        );
    }

    private function statistic(mixed $value): int
    {
        return is_numeric($value) ? (int) $value : 0;
    }
}
