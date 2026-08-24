<?php

namespace App\Services\Flow;

use App\Authorization\Visibility\FlowRunVisibility;
use App\Models\FlowRun;
use App\Models\User;
use App\Services\FeatureFlags\FeatureFlagService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class FlowRunSearchService
{
    public const STATUSES = ['pending', 'running', 'success', 'error', 'cancelled'];

    public function __construct(
        private readonly FlowRunVisibility $visibility,
        private readonly FeatureFlagService $features,
        private readonly FlowRunMetadataFilter $metadataFilter,
    ) {}

    /** @return Builder<FlowRun> */
    public function visibleRunsQuery(User $user, ?string $workspaceId = null): Builder
    {
        $query = FlowRun::query();
        $this->visibility->applyForUser($query, $user, $workspaceId);

        return $query
            ->with([
                'flow:id,name,icon_type,icon_value,icon_color,icon_upload_path,timeout_seconds,flow_type,nodal_graph,keyboard_speed,viewport_width,viewport_height,owner_id,workspace_id,team_id',
                'flow.workspace:id',
                'flow.team:id',
                'triggeredBy:id,name',
                'trigger:id,type,label',
            ])
            ->latest();
    }

    /**
     * @param  Builder<FlowRun>  $query
     * @return Builder<FlowRun>
     */
    public function applyFiltersFromRequest(Builder $query, Request $request): Builder
    {
        return $this->applyFilters($query, $request->query());
    }

    /**
     * @param  Builder<FlowRun>  $query
     * @param  array<string, mixed>  $filters
     * @return Builder<FlowRun>
     */
    public function applyFilters(Builder $query, array $filters): Builder
    {
        $dateFrom = $filters['date_from'] ?? null;
        $dateTo = $filters['date_to'] ?? null;

        if ($dateFrom && $dateTo) {
            $query->whereBetween('flow_runs.created_at', [$dateFrom, $dateTo]);
        } elseif ($dateFrom) {
            $query->where('flow_runs.created_at', '>=', $dateFrom);
        } elseif ($dateTo) {
            $query->where('flow_runs.created_at', '<=', $dateTo);
        }

        $statuses = $this->normalizeStatuses($filters);
        if (! empty($statuses)) {
            $query->whereIn('flow_runs.status', $statuses);
        }

        $triggeredBy = $this->normalizeTriggeredBy($filters);
        if ($triggeredBy !== null) {
            $query->where('flow_runs.triggered_by', $triggeredBy);
        }

        $legendValue = $filters['legend'] ?? '';
        $legend = is_scalar($legendValue) ? trim((string) $legendValue) : '';
        if ($legend !== '') {
            $query->where('flow_runs.legend', 'like', "%{$legend}%");
        }

        $durationMin = $filters['duration_min_ms'] ?? null;
        if (is_scalar($durationMin) && $durationMin !== '') {
            $query->where('flow_runs.duration_ms', '>=', max(0, (int) $durationMin));
        }

        $durationMax = $filters['duration_max_ms'] ?? null;
        if (is_scalar($durationMax) && $durationMax !== '') {
            $query->where('flow_runs.duration_ms', '<=', max(0, (int) $durationMax));
        }

        $flowSearchValue = $filters['flow_search'] ?? $filters['search'] ?? '';
        $flowSearch = is_scalar($flowSearchValue) ? trim((string) $flowSearchValue) : '';
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

        if ($this->features->enabled('run_metadata_search_enabled')) {
            $this->applyMetaFilters($query, $filters);
            $this->applyMetaPresenceFilter($query, $filters);
        }

        return $query;
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return list<string>
     */
    public function normalizeStatuses(array $filters): array
    {
        $statuses = $filters['statuses'] ?? [];
        if (! is_array($statuses)) {
            $statuses = [$statuses];
        }

        if (! empty($filters['status'])) {
            $statuses[] = $filters['status'];
        }

        /** @var list<string> $normalized */
        $normalized = array_values(array_intersect($statuses, self::STATUSES));

        return $normalized;
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return list<array{key: non-empty-string, value?: mixed, operator?: mixed}>
     */
    public function normalizeMetaFilters(array $filters): array
    {
        $metaFilters = $filters['meta_filters'] ?? [];
        if (! is_array($metaFilters)) {
            return [];
        }

        return $this->metadataFilter->normalize($metaFilters);
    }

    /** @param array<string, mixed> $filters */
    private function normalizeTriggeredBy(array $filters): ?string
    {
        $id = $filters['triggered_by'] ?? null;
        if (! is_string($id) || $id === '') {
            return null;
        }

        $id = User::where('id', $id)->value('id');

        return is_string($id) ? $id : null;
    }

    /** @param array<string, mixed> $filters */
    private function normalizeMetaPresence(array $filters): ?string
    {
        $presence = $filters['meta_presence'] ?? null;

        return in_array($presence, ['any', 'none'], true) ? $presence : null;
    }

    /**
     * @param  Builder<FlowRun>  $query
     * @param  array<string, mixed>  $filters
     */
    private function applyMetaPresenceFilter(Builder $query, array $filters): void
    {
        $presence = $this->normalizeMetaPresence($filters);
        if (! $presence) {
            return;
        }

        $this->metadataFilter->applyPresence($query, $presence);
    }

    /**
     * @param  Builder<FlowRun>  $query
     * @param  array<string, mixed>  $filters
     */
    private function applyMetaFilters(Builder $query, array $filters): void
    {
        $validFilters = $this->normalizeMetaFilters($filters);
        if (empty($validFilters)) {
            return;
        }

        $this->metadataFilter->applyFilters(
            $query,
            $validFilters,
            $filters['meta_predicate'] ?? 'and',
        );
    }
}
