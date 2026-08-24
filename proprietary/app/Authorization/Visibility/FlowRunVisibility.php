<?php

namespace App\Authorization\Visibility;

use App\Authorization\AuthorizationContext;
use App\Authorization\ScopeEvaluator;
use App\Models\FlowRun;
use App\Models\User;
use App\Services\FeatureFlags\FeatureFlagService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

final class FlowRunVisibility
{
    public function __construct(
        private readonly FlowVisibility $flows,
        private readonly ScopeEvaluator $scopes,
        private readonly FeatureFlagService $features,
    ) {}

    /**
     * @param  Builder<FlowRun>  $query
     * @return Builder<FlowRun>
     */
    public function apply(Builder $query, AuthorizationContext $context): Builder
    {
        $query->whereHas('flow', function (Builder $flow) use ($context) {
            $this->flows->apply($flow, $context);
        });

        if ($this->scopes->isAdministrator($context)) {
            return $query;
        }

        $query->where(function (Builder $runs) use ($context) {
            $runs->where('flow_runs.triggered_by', $context->user->id)
                ->orWhereHas('flow', fn (Builder $flow) => $flow
                    ->where('flows.workspace_id', $context->workspaceId)
                    ->where('flows.owner_id', $context->user->id));
        });

        return $query;
    }

    /**
     * @param  Builder<FlowRun>  $query
     * @return Builder<FlowRun>
     */
    public function applyForUser(Builder $query, User $user, ?string $workspaceId = null): Builder
    {
        $query->whereHas('flow', function (Builder $flow) use ($user, $workspaceId) {
            $this->flows->applyForUser($flow, $user, $workspaceId);
        });

        if ($user->isAdmin()) {
            return $query;
        }

        $query->where(function (Builder $runs) use ($user) {
            $runs->where('flow_runs.triggered_by', $user->id)
                ->orWhereHas('flow', function (Builder $flow) use ($user) {
                    $flow->where('flows.owner_id', $user->id);

                    if ($this->features->workspaceSharingEnabled()) {
                        $flow->orWhereIn('flows.workspace_id', DB::table('user_workspace')
                            ->select('user_workspace.workspace_id')
                            ->where('user_workspace.user_id', $user->id)
                            ->where('user_workspace.role', 'admin'));
                    }
                });
        });

        return $query;
    }
}
