<?php

namespace App\Policies\Flow;

use App\Enums\Authorization\Ability;
use App\Models\FlowRun;
use App\Models\User;

final class FlowRunPolicy
{
    public function view(User $user, FlowRun $run): bool
    {
        $flow = $run->flow;

        return $flow !== null
            && (
                $run->triggered_by === $user->id
                || $user->can(Ability::VIEW_RUNS->value, $flow)
            );
    }

    public function delete(User $user, FlowRun $run): bool
    {
        return $run->flow !== null && $user->can(Ability::UPDATE->value, $run->flow);
    }

    public function continueRun(User $user, FlowRun $run): bool
    {
        return $this->canControl($user, $run);
    }

    public function killRun(User $user, FlowRun $run): bool
    {
        return $this->canControl($user, $run);
    }

    private function canControl(User $user, FlowRun $run): bool
    {
        $flow = $run->flow;

        return $flow !== null
            && (
                (
                    $run->triggered_by === $user->id
                    && $user->can(Ability::VIEW->value, $flow)
                )
                || $user->can(Ability::UPDATE->value, $flow)
            );
    }
}
