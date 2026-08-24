<?php

namespace App\Services\Puppeteer;

use App\Models\Flow;
use App\Models\FlowRun;
use App\Services\Storage\RunArtifactStorage;
use Illuminate\Contracts\Process\InvokedProcess;
use Illuminate\Contracts\Process\ProcessResult;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;

final class PuppeteerProcessRunner
{
    public function __construct(
        private readonly RunArtifactStorage $artifactStorage,
        private readonly RuntimeSecretManager $secrets,
    ) {}

    /**
     * @param  list<string>  $command
     * @param  array<string, string|false>  $env
     * @param  array<int, array{level: string, message: string, ts: string}>  $consoleLogs
     */
    public function run(
        Flow $flow,
        array $command,
        array $env,
        string $tag,
        FlowRun $run,
        array &$consoleLogs,
        string $runtimeSecretsPath,
        ?callable $isCancelled = null,
    ): ProcessResult {
        $timeout = $flow->getEffectiveTimeoutSeconds();
        $lastFlush = microtime(true);
        $deadline = microtime(true) + $timeout;
        $carry = ['out' => '', 'stderr' => ''];
        $invoked = Process::timeout($timeout + 30)
            ->path($this->artifactStorage->absoluteUserPath($flow->owner_id))
            ->env($env)
            ->start($command);

        try {
            while ($invoked->running()) {
                $this->consumeLatest($invoked, $carry, $tag, $consoleLogs, $run, $runtimeSecretsPath);
                $now = microtime(true);
                if ($now - $lastFlush >= 2.0) {
                    $run->update(['console_logs' => $consoleLogs]);
                    $lastFlush = $now;
                }
                if ($now >= $deadline) {
                    $this->terminate($invoked, $tag, "Timeout reached ({$timeout}s)", 'Timeout grace period expired');
                    throw new \RuntimeException("Flow run timed out after {$timeout} seconds.");
                }
                if ($isCancelled && $isCancelled()) {
                    $this->terminate($invoked, $tag, 'Cancellation detected', 'Grace period expired');
                    $by = Cache::get("flow_run_killed_by:{$run->id}");
                    throw new \RuntimeException(is_scalar($by) ? "Cancelled by user {$by}." : 'Cancelled by user.');
                }
                usleep(250_000);
            }
        } finally {
            $this->consumeLatest($invoked, $carry, $tag, $consoleLogs, $run, $runtimeSecretsPath);
            $this->flush('out', $carry['out'], $tag, $consoleLogs, $run, $runtimeSecretsPath);
            $this->flush('stderr', $carry['stderr'], $tag, $consoleLogs, $run, $runtimeSecretsPath);
        }

        return $invoked->wait();
    }

    /** @param array{dir: string} $sandbox
     * @return list<string>
     */
    public function command(Flow $flow, array $sandbox, bool $quiet = true): array
    {
        $id = addslashes($flow->id);
        $sandboxDir = str_replace("'", "\\'", $sandbox['dir']);
        $quietValue = $quiet ? 'true' : 'false';
        $bootstrap = "require('{$sandboxDir}/src/run.js')('{$sandboxDir}', '{$id}', {$quietValue});";

        return ['node', '-e', $bootstrap];
    }

    /**
     * @param  array{out: string, stderr: string}  $carry
     * @param  array<int, array{level: string, message: string, ts: string}>  $consoleLogs
     */
    private function consumeLatest(
        InvokedProcess $process,
        array &$carry,
        string $tag,
        array &$consoleLogs,
        FlowRun $run,
        string $secretsPath,
    ): void {
        foreach (['out' => $process->latestOutput(), 'stderr' => $process->latestErrorOutput()] as $type => $buffer) {
            if ($buffer !== '') {
                $this->consume($type, $buffer, $carry[$type], $tag, $consoleLogs, $run, $secretsPath);
            }
        }
    }

    /** @param array<int, array{level: string, message: string, ts: string}> $consoleLogs */
    private function consume(
        string $type,
        string $buffer,
        string &$carry,
        string $tag,
        array &$consoleLogs,
        FlowRun $run,
        string $secretsPath,
    ): void {
        $carry .= $buffer;
        while (($newline = strpos($carry, "\n")) !== false) {
            $line = substr($carry, 0, $newline);
            $carry = substr($carry, $newline + 1);
            $this->recordLine(
                $type,
                str_ends_with($line, "\r") ? substr($line, 0, -1) : $line,
                $tag,
                $consoleLogs,
                $run,
                $secretsPath,
            );
        }
    }

    /** @param array<int, array{level: string, message: string, ts: string}> $consoleLogs */
    private function flush(
        string $type,
        string &$carry,
        string $tag,
        array &$consoleLogs,
        FlowRun $run,
        string $secretsPath,
    ): void {
        if ($carry === '') {
            return;
        }
        $line = str_ends_with($carry, "\r") ? substr($carry, 0, -1) : $carry;
        $carry = '';
        $this->recordLine($type, $line, $tag, $consoleLogs, $run, $secretsPath);
    }

    /** @param array<int, array{level: string, message: string, ts: string}> $consoleLogs */
    private function recordLine(
        string $type,
        string $line,
        string $tag,
        array &$consoleLogs,
        FlowRun $run,
        string $secretsPath,
    ): void {
        if ($line === '') {
            return;
        }
        $this->secrets->merge($run, $secretsPath);
        $line = $this->secrets->redact($run, $line) ?? $line;
        if ($type === 'stderr') {
            $level = 'warn';
            Log::warning("{$tag} {$line}");
        } elseif (str_starts_with($line, '[DEBUG] ')) {
            $level = 'debug';
            $line = substr($line, 8);
            Log::debug("{$tag} {$line}");
        } elseif (str_starts_with($line, '[WARN] ')) {
            $level = 'warn';
            $line = substr($line, 7);
            Log::warning("{$tag} {$line}");
        } elseif (str_starts_with($line, '[ERROR] ')) {
            $level = 'error';
            $line = substr($line, 8);
            Log::error("{$tag} {$line}");
        } else {
            $level = 'info';
            Log::info("{$tag} {$line}");
        }
        $consoleLogs[] = ['level' => $level, 'message' => $line, 'ts' => now()->toISOString() ?? ''];
    }

    private function terminate(InvokedProcess $process, string $tag, string $reason, string $killReason): void
    {
        Log::info("{$tag} {$reason}, sending SIGTERM to process {$process->id()}");
        $process->signal(SIGTERM);
        $deadline = microtime(true) + 20;
        while ($process->running() && microtime(true) < $deadline) {
            usleep(500_000);
        }
        if ($process->running()) {
            Log::info("{$tag} {$killReason}, sending SIGKILL to process {$process->id()}");
            $process->signal(SIGKILL);
            $deadline = microtime(true) + 5;
            while ($process->running() && microtime(true) < $deadline) {
                usleep(100_000);
            }
        }
    }
}
