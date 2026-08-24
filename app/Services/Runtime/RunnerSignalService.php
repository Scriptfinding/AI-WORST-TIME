<?php

namespace App\Services\Runtime;

use App\Models\FlowRun;
use Illuminate\Support\Facades\DB;

class RunnerSignalService
{
    public const RESULT_ACCEPTED = 'accepted';

    public const RESULT_INACTIVE = 'inactive';

    public const RESULT_NOT_WAITING = 'not_waiting';

    public const RESULT_PENDING = 'pending';

    public const RESULT_STALE = 'stale';

    public const RESULT_CONTINUED = 'continued';

    public function declareWaiting(FlowRun $run, string $waitId, ?string $validationMessage = null): string
    {
        return DB::transaction(function () use ($run, $waitId, $validationMessage): string {
            $locked = $this->lockRun($run);
            if (! $locked instanceof FlowRun || $locked->getAttribute('status') !== 'running') {
                return self::RESULT_INACTIVE;
            }

            $currentWaitId = $locked->getAttribute('runtime_wait_id');
            if (is_string($currentWaitId) && $currentWaitId !== '') {
                return hash_equals($currentWaitId, $waitId)
                    ? self::RESULT_ACCEPTED
                    : self::RESULT_STALE;
            }

            $locked->update([
                'runtime_wait_id' => $waitId,
                'runtime_validation_message' => $validationMessage,
                'runtime_waiting_at' => now(),
                'runtime_continue_requested_at' => null,
                'runtime_consumed_wait_id' => null,
                'runtime_consumed_at' => null,
            ]);

            return self::RESULT_ACCEPTED;
        }, 3);
    }

    public function requestContinuation(FlowRun $run, string $waitId): string
    {
        return DB::transaction(function () use ($run, $waitId): string {
            $locked = $this->lockRun($run);
            if (! $locked instanceof FlowRun || $locked->getAttribute('status') !== 'running') {
                return self::RESULT_INACTIVE;
            }

            $currentWaitId = $locked->getAttribute('runtime_wait_id');
            if (! is_string($currentWaitId) || $currentWaitId === '') {
                $consumedWaitId = $locked->getAttribute('runtime_consumed_wait_id');
                if (is_string($consumedWaitId) && hash_equals($consumedWaitId, $waitId)) {
                    return self::RESULT_ACCEPTED;
                }

                return self::RESULT_NOT_WAITING;
            }
            if (! hash_equals($currentWaitId, $waitId)) {
                return self::RESULT_STALE;
            }
            if ($locked->getAttribute('runtime_continue_requested_at') !== null) {
                return self::RESULT_ACCEPTED;
            }

            $locked->update(['runtime_continue_requested_at' => now()]);

            return self::RESULT_ACCEPTED;
        }, 3);
    }

    public function consumeContinuation(FlowRun $run, string $waitId): string
    {
        return DB::transaction(function () use ($run, $waitId): string {
            $locked = $this->lockRun($run);
            if (! $locked instanceof FlowRun || $locked->getAttribute('status') !== 'running') {
                return self::RESULT_INACTIVE;
            }

            $currentWaitId = $locked->getAttribute('runtime_wait_id');
            if (! is_string($currentWaitId) || ! hash_equals($currentWaitId, $waitId)) {
                $consumedWaitId = $locked->getAttribute('runtime_consumed_wait_id');

                if (is_string($consumedWaitId) && hash_equals($consumedWaitId, $waitId)) {
                    return self::RESULT_CONTINUED;
                }

                return self::RESULT_STALE;
            }
            if ($locked->getAttribute('runtime_continue_requested_at') === null) {
                return self::RESULT_PENDING;
            }

            $locked->update([
                'runtime_wait_id' => null,
                'runtime_validation_message' => null,
                'runtime_waiting_at' => null,
                'runtime_continue_requested_at' => null,
                'runtime_consumed_wait_id' => $waitId,
                'runtime_consumed_at' => now(),
            ]);

            return self::RESULT_CONTINUED;
        }, 3);
    }

    public function clearWaiting(FlowRun $run, string $waitId): bool
    {
        return DB::transaction(function () use ($run, $waitId): bool {
            $locked = $this->lockRun($run);
            if (! $locked instanceof FlowRun) {
                return false;
            }
            $currentWaitId = $locked->getAttribute('runtime_wait_id');
            if (! is_string($currentWaitId) || ! hash_equals($currentWaitId, $waitId)) {
                return false;
            }

            $this->clearColumns($locked);

            return true;
        }, 3);
    }

    public function expireWaiting(FlowRun $run): void
    {
        FlowRun::query()
            ->whereKey($run->getKey())
            ->where(function ($query): void {
                $query->whereNotNull('runtime_wait_id')
                    ->orWhereNotNull('runtime_consumed_wait_id');
            })
            ->update([
                'runtime_wait_id' => null,
                'runtime_validation_message' => null,
                'runtime_waiting_at' => null,
                'runtime_continue_requested_at' => null,
                'runtime_consumed_wait_id' => null,
                'runtime_consumed_at' => null,
            ]);
    }

    private function lockRun(FlowRun $run): ?FlowRun
    {
        return FlowRun::query()->whereKey($run->getKey())->lockForUpdate()->first();
    }

    private function clearColumns(FlowRun $run): void
    {
        $run->update([
            'runtime_wait_id' => null,
            'runtime_validation_message' => null,
            'runtime_waiting_at' => null,
            'runtime_continue_requested_at' => null,
        ]);
    }
}
