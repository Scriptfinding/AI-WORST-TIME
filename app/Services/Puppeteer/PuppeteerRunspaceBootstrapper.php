<?php

namespace App\Services\Puppeteer;

use App\Enums\Flow\FlowRunArtifactTypeEnum;
use App\Models\Flow;
use App\Models\FlowRun;
use App\Models\MailboxWatcher;
use App\Services\Mailbox\MailboxRunQueueService;
use App\Services\Storage\FlowCookieStorage;

final class PuppeteerRunspaceBootstrapper
{
    public function __construct(
        private readonly PuppeteerRuntimeExporter $exporter,
        private readonly MailboxRunQueueService $mailboxRunQueue,
        private readonly FlowCookieStorage $cookieStorage,
    ) {}

    /** @param array<array-key, mixed> $resolvedInput */
    public function bootstrap(Flow $flow, FlowRun $run, array $resolvedInput): PuppeteerRunspace
    {
        $directories = $this->createDirectories($run);
        $files = [];
        /** @var array<string, string> $cookieJars */
        $cookieJars = [];
        $cookiesHydrated = false;

        try {
            $cookieJars = $this->cookieStorage->hydrate(
                $flow,
                $run->triggered_by,
                $directories['cookies'],
            );
            $cookiesHydrated = true;
            $files = $this->filePaths($directories);
            $this->createFiles($flow, $run, $files, $resolvedInput);
        } catch (\Throwable $exception) {
            if ($cookiesHydrated) {
                $this->cookieStorage->persist(
                    $flow,
                    $run->triggered_by,
                    $directories['cookies'],
                    $cookieJars,
                );
            }
            $this->cleanupAll($files);
            throw $exception;
        }

        return new PuppeteerRunspace(
            $directories,
            $files,
            ['dir' => $run->getFlowRunArtifactsBasePath().'/sandbox'],
            $cookieJars,
        );
    }

    public function persistCookies(Flow $flow, FlowRun $run, PuppeteerRunspace $runspace): void
    {
        $this->cookieStorage->persist(
            $flow,
            $run->triggered_by,
            $runspace->directories['cookies'],
            $runspace->cookieJars,
        );
    }

    /** @return array{dir: string} */
    public function bootstrapSandbox(string $basePath): array
    {
        $sandboxDir = "{$basePath}/sandbox";
        $srcDir = "{$sandboxDir}/src";
        if (! is_dir($srcDir)) {
            mkdir($srcDir, 0775, true);
        }
        foreach (glob(base_path('src/sandbox/*.js')) ?: [] as $file) {
            copy($file, "{$srcDir}/".basename($file));
        }

        return ['dir' => $sandboxDir];
    }

    /** @param array{dir: string} $sandbox */
    public function cleanupSandbox(array $sandbox): void
    {
        $dir = $sandbox['dir'];
        if (! $dir || ! is_dir($dir)) {
            return;
        }
        foreach (glob("{$dir}/src/*.js") ?: [] as $file) {
            @unlink($file);
        }
        @rmdir("{$dir}/src");
        @rmdir($dir);
    }

    /** @param array<string, string> $files */
    public function cleanupInputs(array $files): void
    {
        foreach (['input', 'payload', 'channels', 'watchers', 'snippets', 'runtime_secrets'] as $key) {
            @unlink($files[$key] ?? '');
        }
        $this->removePrivateFile($files['mailbox_claims'] ?? '');
    }

    /** @param array<string, string> $files */
    public function cleanupAll(array $files): void
    {
        foreach ($files as $file) {
            @unlink($file);
        }
    }

    public function writePrivateFile(string $path, string $contents): void
    {
        file_put_contents($path, $contents, LOCK_EX);
        @chmod($path, 0600);
    }

    /** @return array<string, string> */
    private function createDirectories(FlowRun $run): array
    {
        $directories = [];
        $basePath = $run->getFlowRunArtifactsBasePath();
        $directories['cookies'] = "{$basePath}/cookies";
        if (! is_dir($directories['cookies'])) {
            mkdir($directories['cookies'], 0770, true);
        }
        foreach (FlowRunArtifactTypeEnum::cases() as $type) {
            $directories[$type->value] = "{$basePath}/{$type->value}";
            if (! is_dir($directories[$type->value])) {
                mkdir($directories[$type->value], 0775, true);
            }
        }

        return $directories;
    }

    /** @param array<string, string> $directories
     * @return array<string, string>
     */
    private function filePaths(array $directories): array
    {
        $tmp = $directories['tmp'];

        return [
            'input' => "{$tmp}/_run-input.json",
            'payload' => "{$tmp}/_run-payload.js",
            'channels' => "{$tmp}/_run-channels.json",
            'watchers' => "{$tmp}/_run-watchers.json",
            'snippets' => "{$tmp}/_run-snippets.js",
            'output' => "{$tmp}/_run-output.json",
            'internal_output' => "{$tmp}/_run-internal-output.json",
            'error' => "{$tmp}/_run-error.json",
            'action_logs' => "{$tmp}/_run-action-logs.json",
            'runtime_secrets' => "{$tmp}/_run-secrets.jsonl",
            'mailbox_claims' => "{$tmp}/_run-mailbox-claims.jsonl",
        ];
    }

    /**
     * @param  array<string, string>  $files
     * @param  array<array-key, mixed>  $resolvedInput
     */
    private function createFiles(Flow $flow, FlowRun $run, array $files, array $resolvedInput): void
    {
        $channelSecrets = [];
        $channels = $this->exporter->channels($flow, $run->triggered_by, $channelSecrets);
        if ($channelSecrets !== []) {
            $run->update(['resolved_secrets' => array_values(array_unique([
                ...(is_array($run->resolved_secrets) ? $run->resolved_secrets : []),
                ...$channelSecrets,
            ]))]);
        }

        $this->writePrivateFile($files['input'], $this->inputContent($flow, $run, $resolvedInput));
        $this->writePrivateFile($files['payload'], $run->code_snapshot ?? $flow->code ?? '');
        $this->writePrivateFile($files['channels'], $channels);
        $watchers = $this->exporter->watchers($flow, $run->triggered_by);
        $this->writePrivateFile($files['watchers'], $watchers);
        $this->snapshotWatchers($flow, $run, $watchers);
        $this->writePrivateFile($files['snippets'], $this->exporter->snippets($flow, $run->triggered_by));
        foreach (['output', 'internal_output', 'error', 'action_logs', 'runtime_secrets', 'mailbox_claims'] as $key) {
            $this->writePrivateFile($files[$key], '');
        }
    }

    /** @param array<array-key, mixed> $resolvedInput */
    private function inputContent(Flow $flow, FlowRun $run, array $resolvedInput): string
    {
        $viewport = $flow->getEffectiveViewport();
        $effectiveKeyboardSpeed = $flow->getEffectiveKeyboardSpeed();
        $rawKeyboardSpeed = $resolvedInput['$keyboardSpeed'] ?? $effectiveKeyboardSpeed;
        $keyboardSpeed = is_numeric($rawKeyboardSpeed) && (float) $rawKeyboardSpeed >= 0
            ? (float) $rawKeyboardSpeed
            : $effectiveKeyboardSpeed;
        $rawViewportWidth = $resolvedInput['$viewportWidth'] ?? $viewport['width'];
        $viewportWidth = is_numeric($rawViewportWidth) && (int) $rawViewportWidth > 0
            ? (int) $rawViewportWidth
            : $viewport['width'];
        $rawViewportHeight = $resolvedInput['$viewportHeight'] ?? $viewport['height'];
        $viewportHeight = is_numeric($rawViewportHeight) && (int) $rawViewportHeight > 0
            ? (int) $rawViewportHeight
            : $viewport['height'];
        $input = array_merge($resolvedInput, [
            '$keyboardSpeed' => $keyboardSpeed,
            '$viewportWidth' => $viewportWidth,
            '$viewportHeight' => $viewportHeight,
            '$context' => [
                'run_id' => $run->id,
                'flow_id' => $flow->id,
            ],
        ]);

        return (json_encode($input, JSON_PRETTY_PRINT) ?: '')."\n";
    }

    private function snapshotWatchers(Flow $flow, FlowRun $run, string $content): void
    {
        $decoded = json_decode($content, true);
        $ids = is_array($decoded) ? array_keys($decoded) : [];
        $authorized = [];
        if ($ids !== []) {
            foreach (MailboxWatcher::query()->where('flow_id', $flow->id)->whereIn('id', $ids)
                ->get(['id', 'mailbox_id']) as $watcher) {
                $authorized[] = [
                    'id' => $watcher->id,
                    'mailbox_id' => $watcher->mailbox_id,
                ];
            }
        }
        $this->mailboxRunQueue->snapshotAuthorizedWatchers($run, $authorized);
    }

    private function removePrivateFile(string $path): void
    {
        if ($path === '' || ! is_file($path)) {
            return;
        }
        @chmod($path, 0600);
        @file_put_contents($path, '', LOCK_EX);
        @unlink($path);
    }
}
