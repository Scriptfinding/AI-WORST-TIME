<?php

namespace App\Services\Puppeteer;

use App\Models\Flow;
use App\Models\User;
use App\Services\Flow\FlowRunProxyRouter;
use App\Services\Storage\RunArtifactStorage;
use App\Services\Variable\VariableResolverService;

final class PuppeteerCliRunBootstrapper
{
    public function __construct(
        private readonly PuppeteerRunspaceBootstrapper $runspaces,
        private readonly PuppeteerRuntimeExporter $exporter,
        private readonly PuppeteerEnvironmentBuilder $environments,
        private readonly PuppeteerProcessRunner $processes,
        private readonly FlowRunProxyRouter $proxyRouter,
        private readonly VariableResolverService $variables,
        private readonly RunArtifactStorage $artifactStorage,
    ) {}

    /**
     * @param  array<array-key, mixed>  $input
     * @return array{command: list<string>, env: array<string, string|false>, cwd: string, sandbox: array{dir: string}}
     */
    public function bootstrap(Flow $flow, array $input, string $codePath): array
    {
        $basePath = $flow->getFlowArtifactsBasePath().'/_cli_run';
        $tmpDir = "{$basePath}/tmp";
        if (! is_dir($tmpDir)) {
            mkdir($tmpDir, 0775, true);
        }
        $sandbox = $this->runspaces->bootstrapSandbox($basePath);
        $inputPath = "{$sandbox['dir']}/_run-input.json";
        $payloadPath = "{$sandbox['dir']}/_run-payload.js";
        $channelsPath = "{$sandbox['dir']}/_run-channels.json";
        $watchersPath = "{$sandbox['dir']}/_run-watchers.json";
        $snippetsPath = "{$sandbox['dir']}/_run-snippets.js";
        $payload = file_get_contents($codePath);
        if ($payload === false) {
            throw new \RuntimeException("Unable to read flow code at {$codePath}.");
        }

        $this->runspaces->writePrivateFile($inputPath, (json_encode($input, JSON_PRETTY_PRINT) ?: '')."\n");
        $this->runspaces->writePrivateFile($payloadPath, $payload);
        $this->runspaces->writePrivateFile($channelsPath, $this->exporter->channels($flow, allAccess: true));
        $this->runspaces->writePrivateFile($watchersPath, $this->exporter->watchers($flow, allAccess: true));
        $this->runspaces->writePrivateFile($snippetsPath, $this->exporter->snippets($flow, allAccess: true));

        $files = [
            'input' => $inputPath,
            'payload' => $payloadPath,
            'output' => '',
            'error' => '',
            'channels' => $channelsPath,
            'watchers' => $watchersPath,
            'snippets' => $snippetsPath,
        ];
        $owner = $flow->owner;
        if (! $owner instanceof User) {
            throw new \LogicException('Flow owner could not be resolved for proxy routing.');
        }
        $env = $this->environments->build(
            $flow,
            $files,
            ['tmp' => $tmpDir],
            sandbox: $sandbox,
            proxySnapshot: $this->proxyRouter->resolve($flow, $owner),
        );
        $env['PUPPETFLOW_RUN_ARTIFACTS_BASE_PATH'] = $basePath;
        $varsEnv = $this->variables->buildVarsEnv(null, $flow->workspace_id, allAccess: true);
        if ($varsEnv !== []) {
            $env['PUPPETFLOW_VARS_ENV'] = json_encode($varsEnv) ?: '';
        }

        return [
            'command' => $this->processes->command($flow, $sandbox, quiet: false),
            'env' => $env,
            'cwd' => $this->artifactStorage->absoluteUserPath($flow->owner_id),
            'sandbox' => $sandbox,
        ];
    }

    /** @param array{sandbox: array{dir: string}} $bootstrapped */
    public function cleanup(array $bootstrapped): void
    {
        $dir = $bootstrapped['sandbox']['dir'];
        foreach ([
            '_run-input.json',
            '_run-payload.js',
            '_run-channels.json',
            '_run-watchers.json',
            '_run-snippets.js',
        ] as $file) {
            @unlink("{$dir}/{$file}");
        }
        $this->runspaces->cleanupSandbox($bootstrapped['sandbox']);
    }
}
