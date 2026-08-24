<?php

namespace App\Console\Commands;

use App\Models\Flow;
use App\Models\FlowRun as FlowRunModel;
use App\Models\Snippet;
use App\Services\Flow\InputResourceReferenceResolver;
use App\Services\Licensing\LicenseRuntimeGuard;
use App\Services\Puppeteer\PuppeteerService;
use App\Services\Variable\VariableResolverService;
use Illuminate\Console\Command;

class FlowRun extends Command
{
    protected $signature = 'flow:run
        {--id= : The flow ID to run}
        {--i|input-run= : Optional FlowRun ID to copy input from}
        {--r|keepRunCode : Use the code_snapshot from the input run}
        {--f|keepFlowCode : Use the saved code from the flow instead of the run code_snapshot}
        {--p|pinokio : Run with Pinokio enabled}
        {--s|sandbox : Run in sandboxed environment (requires flow in DB)}';

    protected $description = 'Run a flow locally with a visible browser';

    public function handle(LicenseRuntimeGuard $licenses): int
    {
        try {
            $licenses->ensure('local flow runner');
        } catch (\Throwable $e) {
            $this->error($e->getMessage());

            return self::FAILURE;
        }

        $id = $this->option('id');

        if (! is_string($id) || $id === '') {
            $this->error('The --id option is required.');

            return self::FAILURE;
        }

        $flow = Flow::where('id', $id)->first();
        $flowsDir = config('puppetflow.cli_flows_dir');
        $flowsDir = is_string($flowsDir) ? $flowsDir : '';
        $bodyPath = base_path($flowsDir."/{$id}/nodeBody.js");
        $runId = $this->option('input-run');
        $keepRunCode = $this->option('keepRunCode');
        $keepFlowCode = $this->option('keepFlowCode');
        $run = null;

        if ($runId) {
            $run = FlowRunModel::find($runId);
            if (! $run) {
                $this->error("FlowRun #{$runId} not found.");

                return self::FAILURE;
            }
        }

        if ($keepRunCode && $run) {
            if (! $run->code_snapshot) {
                $this->error("FlowRun #{$runId} has no code_snapshot.");

                return self::FAILURE;
            }
            if (! is_dir(dirname($bodyPath))) {
                mkdir(dirname($bodyPath), 0755, true);
            }
            file_put_contents($bodyPath, $run->code_snapshot);
            $this->info("Using code_snapshot from FlowRun #{$runId} → {$bodyPath}");
        } elseif ($keepFlowCode) {
            if (! $flow || ! $flow->code) {
                $this->error("No flow found in DB for ID '{$id}'.");

                return self::FAILURE;
            }
            if (! is_dir(dirname($bodyPath))) {
                mkdir(dirname($bodyPath), 0755, true);
            }
            file_put_contents($bodyPath, $flow->code);
            $this->info("Fetched from DB → {$bodyPath}");
        } else {
            if (! file_exists($bodyPath)) {
                $this->error("No local nodeBody.js found at {$bodyPath}.");

                return self::FAILURE;
            }
            $this->info("Using local {$bodyPath}");
        }

        $input = ['$context' => ['flow_id' => $id, 'enable_breakpoint' => true]];

        if ($run) {
            $input = array_merge($run->input ?? [], $input);
            $this->info("Loaded input from FlowRun #{$runId}");
        }

        $input = app(InputResourceReferenceResolver::class)->resolve($input);

        if ($flow) {
            $input = app(VariableResolverService::class)
                ->resolve($input, null, $flow->workspace_id, allAccess: true);
        }

        $inputPath = base_path('data/run-input.json');
        $dir = dirname($inputPath);
        if (! is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        file_put_contents($inputPath, json_encode($input, JSON_PRETTY_PRINT)."\n");
        $this->info("Written {$inputPath}");

        if ($this->option('sandbox')) {
            if (! $flow) {
                $this->error('Sandbox mode requires a flow in DB (need owner_id for user directory).');

                return self::FAILURE;
            }

            $service = app(PuppeteerService::class);
            $cliRun = $service->bootstrapCliRun($flow, $input, $bodyPath);

            $this->info("Sandbox root: {$cliRun['cwd']}");
            $this->info("Starting sandboxed browser for: {$id}");

            $process = proc_open(
                $cliRun['command'],
                [STDIN, STDOUT, STDERR],
                $pipes,
                $cliRun['cwd'],
                [...getenv(), ...$cliRun['env'], 'PINOKIO_ENABLED' => 'false'],
            );

            if (! is_resource($process)) {
                $this->error('Failed to start node process.');

                return self::FAILURE;
            }

            $exitCode = proc_close($process);
            $service->cleanupCliRun($cliRun);

            return $exitCode === 0 ? self::SUCCESS : self::FAILURE;
        }

        $snippetsPath = base_path('data/run-snippets.js');
        $channelsPath = base_path('data/run-channels.json');
        $watchersPath = base_path('data/run-watchers.json');
        if ($flow) {
            $service = app(PuppeteerService::class);

            $snippetsContent = $service->buildSnippetsContent($flow, allAccess: true);
            file_put_contents($snippetsPath, $snippetsContent);
            $snippetCount = Snippet::where('workspace_id', $flow->workspace_id)
                ->where('is_active', true)
                ->where('stale', false)
                ->count();
            $this->info("Loaded {$snippetCount} snippet(s) → {$snippetsPath}");

            $channelsContent = $service->buildChannelsContent($flow, allAccess: true);
            file_put_contents($channelsPath, $channelsContent);
            $decodedChannels = json_decode($channelsContent, true);
            $channelCount = is_array($decodedChannels) ? count($decodedChannels) : 0;
            $this->info("Loaded {$channelCount} notification channel(s) → {$channelsPath}");

            $watchersContent = $service->buildWatchersContent($flow, allAccess: true);
            file_put_contents($watchersPath, $watchersContent);
        }

        $this->info("Starting browser for flow: {$id}");

        $env = [...getenv(), 'PINOKIO_ENABLED' => $this->option('pinokio') ? 'true' : 'false'];
        if ($flow && file_exists($snippetsPath)) {
            $env['RUN_SNIPPETS_PATH'] = $snippetsPath;
        }
        if ($flow && file_exists($channelsPath)) {
            $env['RUN_CHANNELS_PATH'] = $channelsPath;
        }
        if ($flow && file_exists($watchersPath)) {
            $env['RUN_WATCHERS_PATH'] = $watchersPath;
        }
        if ($flow) {
            $varsEnv = app(VariableResolverService::class)
                ->buildVarsEnv(null, $flow->workspace_id, allAccess: true);
            if (! empty($varsEnv)) {
                $env['PUPPETFLOW_VARS_ENV'] = json_encode($varsEnv);
                $this->info('Loaded '.count($varsEnv).' variable(s) into $vars');
            }
        }

        $process = proc_open(
            ['node', 'main.js'],
            [STDIN, STDOUT, STDERR],
            $pipes,
            base_path(),
            $env,
        );

        if (! is_resource($process)) {
            $this->error('Failed to start node process.');

            return self::FAILURE;
        }

        $exitCode = proc_close($process);

        return $exitCode === 0 ? self::SUCCESS : self::FAILURE;
    }
}
