<?php

namespace App\Console\Commands;

use App\Models\FlowTrigger;
use App\Services\Flow\FlowRunnerService;
use App\Services\Licensing\LicenseRuntimeGuard;
use Cron\CronExpression;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

class RunScheduledTriggers extends Command
{
    protected $signature = 'triggers:run-scheduled';

    protected $description = 'Evaluate and fire cron-based triggers that are due';

    public function handle(FlowRunnerService $runner, LicenseRuntimeGuard $licenses): void
    {
        try {
            $licenses->ensure('scheduled triggers');
        } catch (\Throwable $e) {
            $this->error($e->getMessage());

            return;
        }

        $now = Carbon::now();

        $triggers = FlowTrigger::where('type', 'cron')
            ->where('is_active', true)
            ->with(['flow', 'user'])
            ->get();

        $fired = 0;

        foreach ($triggers as $trigger) {
            try {
                $cronExpr = $trigger->config['cron_expression'] ?? null;

                if (! is_string($cronExpr) || $cronExpr === '') {
                    continue;
                }

                $cron = new CronExpression($cronExpr);

                $userTz = $trigger->user->timezone ?? config('app.timezone', 'UTC');
                $userTz = is_string($userTz) || is_int($userTz) ? $userTz : 'UTC';
                $nowInUserTz = $now->copy()->setTimezone($userTz);

                if (! $cron->isDue($nowInUserTz)) {
                    continue;
                }

                if ($trigger->last_triggered_at) {
                    $previousRun = Carbon::parse($trigger->last_triggered_at);
                    if ($previousRun->diffInSeconds($now) < 30) {
                        continue;
                    }
                }

                $flow = $trigger->flow;

                if (! $flow) {
                    continue;
                }
                $owner = $trigger->user;
                if (! $owner) {
                    Log::warning("Cron trigger {$trigger->id} skipped: its owner no longer exists.");

                    continue;
                }
                $input = $trigger->input_template ?? [];

                $runner->dispatch(
                    $flow,
                    $owner,
                    $input,
                    'schedule',
                    null,
                    $trigger->id,
                );

                $trigger->update(['last_triggered_at' => $now]);
                $fired++;
            } catch (AuthorizationException $e) {
                Log::info("Cron trigger {$trigger->id} skipped: {$e->getMessage()}");
            } catch (\Throwable $e) {
                Log::error("Cron trigger {$trigger->id} failed: {$e->getMessage()}");
            }
        }

        if ($fired > 0) {
            $this->info("Fired {$fired} cron trigger(s).");
        }
    }
}
