<?php

namespace App\Services\Flow;

use App\Models\Flow;
use App\Models\FlowRun;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Assigns each run to a worker queue. The choice is serialized behind a
 * transaction-level advisory lock and persisted on the run before the lock
 * is released, so two runs dispatched at the exact same instant can never
 * both land on a queue while another one is free.
 */
final class FlowRunQueueRouter
{
    public function assign(FlowRun $run, Flow $flow): string
    {
        $queuesCounter = config()->integer('puppetflow.queues_counter', 1);

        $pinned = $flow->queue_index;
        if (is_int($pinned) && $pinned >= 1 && $pinned <= $queuesCounter) {
            $this->persist($run, $pinned);

            return (string) $pinned;
        }

        if ($queuesCounter === 1) {
            $this->persist($run, 1);

            return '1';
        }

        return (string) $this->assignSerialized($run, $queuesCounter);
    }

    /**
     * Serializes the pick-and-persist critical section. On PostgreSQL the
     * advisory lock is released at commit, so the next dispatcher always
     * sees the assignment we just wrote. Other drivers (sqlite, mysql)
     * fall back to a cache mutex around the transaction.
     */
    private function assignSerialized(FlowRun $run, int $queuesCounter): int
    {
        $route = function () use ($run, $queuesCounter): int {
            $index = $this->leastLoadedQueueIndex($run, $queuesCounter);
            $this->persist($run, $index);

            return $index;
        };

        if (DB::connection()->getDriverName() === 'pgsql') {
            return DB::transaction(function () use ($route): int {
                DB::statement("SELECT pg_advisory_xact_lock(hashtext('puppetflow:queues'), hashtext('routing'))");

                return $route();
            });
        }

        $index = Cache::lock('puppetflow:queues:routing', 10)->block(
            10,
            fn (): int => DB::transaction($route),
        );
        if (! is_int($index)) {
            throw new \LogicException('Queue routing lock returned an invalid result.');
        }

        return $index;
    }

    /**
     * Active runs (pending or running) already assigned to a queue are the
     * backlog. Ties resolve to the lowest index so the outcome stays
     * deterministic under concurrency.
     */
    private function leastLoadedQueueIndex(FlowRun $run, int $queuesCounter): int
    {
        $backlogs = FlowRun::query()
            ->whereKeyNot($run->getKey())
            ->whereIn('status', ['pending', 'running'])
            ->whereNotNull('queue_index')
            ->groupBy('queue_index')
            ->selectRaw('queue_index, COUNT(*) AS backlog')
            ->pluck('backlog', 'queue_index');

        $best = 1;
        $smallest = PHP_INT_MAX;
        for ($index = 1; $index <= $queuesCounter; $index++) {
            $raw = $backlogs[$index] ?? $backlogs[(string) $index] ?? 0;
            $backlog = is_numeric($raw) ? (int) $raw : 0;
            if ($backlog < $smallest) {
                $smallest = $backlog;
                $best = $index;
            }
        }

        return $best;
    }

    private function persist(FlowRun $run, int $index): void
    {
        $run->forceFill(['queue_index' => $index])->save();
    }
}
