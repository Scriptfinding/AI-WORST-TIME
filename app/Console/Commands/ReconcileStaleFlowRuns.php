<?php

namespace App\Console\Commands;

use App\Models\FlowRun;
use App\Services\Flow\FlowRunTerminalizer;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ReconcileStaleFlowRuns extends Command
{
    protected $signature = 'runs:reconcile-stale
        {--grace=120 : Seconds allowed after the flow timeout}
        {--chunk=100 : Maximum active runs processed per invocation}';

    protected $description = 'Terminalize cancelled or timed-out runs whose workers no longer report status';

    public function handle(FlowRunTerminalizer $terminalizer): int
    {
        $grace = $this->positiveOption('grace', 120, true);
        $chunk = $this->positiveOption('chunk', 100);
        $now = now();
        $recovered = 0;

        FlowRun::query()
            ->where('status', 'running')
            ->whereNotNull('running_at')
            ->with(['flow.workspace'])
            ->orderBy('running_at')
            ->orderBy('id')
            ->limit($chunk)
            ->get()
            ->each(function (FlowRun $run) use ($terminalizer, $now, $grace, &$recovered): void {
                try {
                    $status = $terminalizer->recoverStaleRun($run, $now, $grace);
                    if ($status === null) {
                        return;
                    }

                    $recovered++;
                    Log::warning('stale_flow_run_recovered', [
                        'flow_id' => $run->flow_id,
                        'run_id' => $run->id,
                        'status' => $status,
                    ]);
                } catch (\Throwable $exception) {
                    report($exception);
                }
            });

        if ($recovered > 0) {
            $this->info("Recovered {$recovered} stale flow run(s).");
        }

        return self::SUCCESS;
    }

    private function positiveOption(string $name, int $default, bool $allowZero = false): int
    {
        $value = $this->option($name);
        if (! is_numeric($value)) {
            return $default;
        }

        return $allowZero ? max(0, (int) $value) : max(1, (int) $value);
    }
}
