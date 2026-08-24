<?php

namespace App\Services\FeatureFlags;

use App\Models\FlowRun;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

/**
 * Subscription cycle runs quota.
 *
 * A cycle is anchored to a reference date (cycle_epoch) and repeats every
 * cycle_freq days. The current cycle is the window containing now(); runs
 * classified as production count against cycle_runs_limit
 * (0 = no limit).
 * All three values resolve through FeatureFlagService, so a signed license
 * token overrides the FF_CYCLE_* env configuration.
 */
class RunCycleService
{
    public function __construct(
        private FeatureFlagService $featureFlags,
    ) {}

    /**
     * @return array{used: int, limit: int|null, exceeded: bool, starts_at: string, ends_at: string}|null
     *                                                                                                    Null when no cycle is configured (missing/invalid epoch or freq).
     */
    public function current(): ?array
    {
        $window = $this->currentWindow();
        if ($window === null) {
            return null;
        }

        [$start, $end] = $window;

        $limit = $this->currentLimit();
        $used = $this->usageForWindow($start, $end);

        return [
            'used' => $used,
            'limit' => $limit,
            'exceeded' => $limit !== null && $used >= $limit,
            'starts_at' => $start->toIso8601String(),
            'ends_at' => $end->toIso8601String(),
        ];
    }

    public function quotaExceeded(): bool
    {
        return (bool) ($this->current()['exceeded'] ?? false);
    }

    /**
     * Atomically reserve one production run in the current cycle.
     *
     * @return array{used: int, limit: int|null, exceeded: bool, reserved: bool, starts_at: string, ends_at: string}|null
     */
    public function reserve(): ?array
    {
        $window = $this->currentWindow();
        if ($window === null) {
            return null;
        }

        [$start, $end] = $window;
        $limit = $this->currentLimit();

        return DB::transaction(function () use ($start, $end, $limit): array {
            $this->ensureUsageRow($start, $end);
            $usage = DB::table('run_cycle_usages')
                ->where('starts_at', $start)
                ->where('ends_at', $end)
                ->lockForUpdate()
                ->first();
            if ($usage === null) {
                throw new \RuntimeException('Unable to reserve the current run cycle.');
            }

            $used = (int) $usage->used;
            if ($limit !== null && $used >= $limit) {
                return [
                    'used' => $used,
                    'limit' => $limit,
                    'exceeded' => true,
                    'reserved' => false,
                    'starts_at' => $start->toIso8601String(),
                    'ends_at' => $end->toIso8601String(),
                ];
            }

            $used++;
            DB::table('run_cycle_usages')
                ->where('id', $usage->id)
                ->update([
                    'used' => $used,
                    'updated_at' => now(),
                ]);

            return [
                'used' => $used,
                'limit' => $limit,
                'exceeded' => $limit !== null && $used >= $limit,
                'reserved' => true,
                'starts_at' => $start->toIso8601String(),
                'ends_at' => $end->toIso8601String(),
            ];
        }, 3);
    }

    /**
     * Release a production run while the caller holds its row lock.
     */
    public function releaseCancelledRun(FlowRun $run): bool
    {
        if (
            (string) $run->status !== 'cancelled'
            || ! (bool) $run->is_production
            || $run->created_at === null
        ) {
            return false;
        }

        $usage = DB::table('run_cycle_usages')
            ->where('starts_at', '<=', $run->created_at)
            ->where('ends_at', '>', $run->created_at)
            ->orderByDesc('starts_at')
            ->lockForUpdate()
            ->first();
        if ($usage === null || (int) $usage->used <= 0) {
            return false;
        }

        DB::table('run_cycle_usages')
            ->where('id', $usage->id)
            ->update([
                'used' => (int) $usage->used - 1,
                'updated_at' => now(),
            ]);

        return true;
    }

    /**
     * @return array{0: CarbonImmutable, 1: CarbonImmutable}|null
     */
    private function currentWindow(): ?array
    {
        $flags = $this->featureFlags->all();

        $freqValue = $flags['cycle_freq'] ?? 0;
        $freq = is_int($freqValue) ? $freqValue : (is_numeric($freqValue) ? (int) $freqValue : 0);
        $epochValue = $flags['cycle_epoch'] ?? '';
        $rawEpoch = is_scalar($epochValue) ? trim((string) $epochValue) : '';
        if ($freq <= 0 || $rawEpoch === '') {
            return null;
        }

        try {
            $epoch = CarbonImmutable::parse($rawEpoch);
        } catch (\Throwable) {
            return null;
        }

        $now = CarbonImmutable::now();
        // Number of full cycles elapsed since the epoch. Negative when the
        // epoch is in the future: floor still yields the window containing now.
        $elapsed = (int) floor($epoch->diffInDays($now, false) / $freq);

        $start = $epoch->addDays($elapsed * $freq);
        $end = $start->addDays($freq);

        return [$start, $end];
    }

    private function currentLimit(): ?int
    {
        $limitValue = $this->featureFlags->all()['cycle_runs_limit'] ?? 0;
        $limit = is_int($limitValue) ? $limitValue : (is_numeric($limitValue) ? (int) $limitValue : 0);

        return $limit > 0 ? $limit : null;
    }

    private function usageForWindow(CarbonImmutable $start, CarbonImmutable $end): int
    {
        $used = DB::table('run_cycle_usages')
            ->where('starts_at', $start)
            ->where('ends_at', $end)
            ->value('used');

        if (is_numeric($used)) {
            return (int) $used;
        }

        $this->ensureUsageRow($start, $end);

        $used = DB::table('run_cycle_usages')
            ->where('starts_at', $start)
            ->where('ends_at', $end)
            ->value('used');

        return is_numeric($used) ? (int) $used : 0;
    }

    private function ensureUsageRow(CarbonImmutable $start, CarbonImmutable $end): void
    {
        if (
            DB::table('run_cycle_usages')
                ->where('starts_at', $start)
                ->where('ends_at', $end)
                ->exists()
        ) {
            return;
        }

        $historicalUsage = FlowRun::query()
            ->where('created_at', '>=', $start)
            ->where('created_at', '<', $end)
            ->where('is_production', true)
            ->where('status', '!=', 'cancelled')
            ->count();

        DB::table('run_cycle_usages')->insertOrIgnore([
            'starts_at' => $start,
            'ends_at' => $end,
            'used' => $historicalUsage,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
