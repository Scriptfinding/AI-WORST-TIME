<?php

namespace App\Services\Flow\Query;

use App\Models\Flow;
use App\Models\FlowRun;
use App\Models\User;
use App\Services\FeatureFlags\FeatureFlagService;
use App\Services\Flow\FlowRunMetadataFilter;
use Illuminate\Http\Request;

final class FlowRunProjection
{
    public function __construct(
        private readonly FlowRunMetadataFilter $metadataFilter,
        private readonly FeatureFlagService $features,
    ) {}

    /** @return array{runs: mixed, stats: mixed} */
    public function get(Request $request, Flow $flow, User $user, bool $canViewRuns): array
    {
        if ($canViewRuns) {
            $flow->load('latestRun.triggeredBy:id,name');
        } else {
            $flow->setRelation('latestRun', $flow->runs()
                ->with('triggeredBy:id,name')->where('triggered_by', $user->id)->latest()->first());
        }
        $latestRun = $flow->getRelation('latestRun');
        if ($latestRun instanceof FlowRun) {
            $latestRun->redactSecretsForClient()->makeVisible(['internal_meta']);
        }

        $query = $flow->runs()->getQuery()
            ->with(['triggeredBy:id,name', 'trigger:id,type,label'])->latest();
        if (! $canViewRuns) {
            $query->where('triggered_by', $user->id);
        }
        $from = $request->input('date_from');
        $to = $request->input('date_to');
        if ($from && $to) {
            $query->whereBetween('created_at', [$from, $to]);
        } elseif ($from) {
            $query->where('created_at', '>=', $from);
        } elseif ($to) {
            $query->where('created_at', '<=', $to);
        }
        $statuses = $request->input('statuses', []);
        if (is_array($statuses) && $statuses !== []) {
            $query->whereIn('status', array_intersect(
                $statuses,
                ['pending', 'running', 'success', 'error', 'cancelled'],
            ));
        }
        $metadataEnabled = $this->features->enabled('run_metadata_search_enabled');
        $this->metadataFilter->applyPresence($query, $metadataEnabled ? $request->input('meta_presence') : null);
        $filters = $metadataEnabled ? $request->input('meta_filters', []) : [];
        if (is_array($filters)) {
            $this->metadataFilter->applyFilters($query, $filters, $request->input('meta_predicate', 'and'));
        }
        $runs = $query->paginate(perPage: max(min($request->integer('per_page', 20), 100), 1));
        $runs->getCollection()->each(fn (FlowRun $run) => $run->redactSecretsForClient()
            ->makeVisible(['console_logs', 'action_logs', 'code_snapshot', 'internal_meta']));

        $statsQuery = $canViewRuns ? $flow->runs() : $flow->runs()->where('triggered_by', $user->id);
        $stats = $statsQuery->selectRaw('count(*) as total')
            ->selectRaw("coalesce(sum(case when status = 'success' then 1 else 0 end), 0) as success")
            ->selectRaw("coalesce(sum(case when status = 'error' then 1 else 0 end), 0) as failed")
            ->selectRaw("coalesce(sum(case when status = 'cancelled' then 1 else 0 end), 0) as cancelled")
            ->selectRaw('coalesce(sum(duration_ms), 0) as total_duration_ms')->first();

        return compact('runs', 'stats');
    }
}
