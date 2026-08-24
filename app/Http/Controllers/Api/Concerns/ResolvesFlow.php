<?php

namespace App\Http\Controllers\Api\Concerns;

use App\Authorization\Visibility\FlowVisibility;
use App\Enums\Authorization\Ability;
use App\Models\Flow;
use App\Models\User;

trait ResolvesFlow
{
    protected function resolveFlow(string $id, User $user): ?Flow
    {
        $query = Flow::query();
        app(FlowVisibility::class)->applyForUser($query, $user);

        return $query->where('id', $id)->first();
    }

    protected function canAccessFlow(User $user, Flow $flow): bool
    {
        return $user->can(Ability::VIEW->value, $flow);
    }
}
