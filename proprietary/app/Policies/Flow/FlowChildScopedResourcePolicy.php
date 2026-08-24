<?php

namespace App\Policies\Flow;

use App\Models\Flow;
use App\Policies\Shared\ScopedResourcePolicy;
use Illuminate\Database\Eloquent\Model;

abstract class FlowChildScopedResourcePolicy extends ScopedResourcePolicy
{
    protected function workspaceId(Model $resource): string
    {
        // Prefer the hydrated parent flow: policy checks run in loops on
        // editor pages, and querying here causes an N+1 (one lookup per
        // trigger/action per ability check).
        if ($resource->relationLoaded('flow')) {
            $flow = $resource->getRelation('flow');
            if ($flow instanceof Flow) {
                return $this->stringValue($flow->getAttribute('workspace_id'));
            }
        }

        return $this->stringValue(
            Flow::whereKey($resource->getAttribute('flow_id'))->value('workspace_id'),
        );
    }
}
