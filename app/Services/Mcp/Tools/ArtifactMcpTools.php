<?php

namespace App\Services\Mcp\Tools;

use App\Models\Flow;
use App\Models\FlowRun;
use App\Services\FeatureFlags\FeatureFlagService;
use App\Services\Flow\FlowRunSearchService;
use App\Services\Storage\RunArtifactStorage;
use Illuminate\Validation\ValidationException;

/** @phpstan-type Arguments array<string, mixed> */
final class ArtifactMcpTools implements McpToolHandler
{
    public function __construct(
        private readonly RunArtifactStorage $storage,
        private readonly FeatureFlagService $features,
        private readonly FlowRunSearchService $runSearch,
        private readonly McpResourceResolver $resources,
    ) {}

    public function definitions(): array
    {
        $base = [
            'flow_id' => ['type' => 'string', 'description' => 'Flow ID.'],
            'run_id' => ['type' => 'integer', 'minimum' => 1],
        ];

        return [
            ['name' => 'list_artifacts', 'description' => 'List screenshots or downloads for an MCP-enabled flow run.', 'inputSchema' => ['type' => 'object', 'required' => ['flow_id', 'run_id', 'type'], 'properties' => [
                ...$base, 'type' => ['type' => 'string', 'enum' => ['screenshots', 'downloads']],
            ]]],
            ['name' => 'get_latest_screenshot', 'description' => 'Return the latest screenshot URL for a run or flow.', 'inputSchema' => ['type' => 'object', 'required' => ['flow_id'], 'properties' => $base]],
            ['name' => 'download_artifact', 'description' => 'Return a secure URL for a specific run artifact.', 'inputSchema' => ['type' => 'object', 'required' => ['flow_id', 'run_id', 'type', 'filename'], 'properties' => [
                ...$base, 'type' => ['type' => 'string', 'enum' => ['screenshots', 'downloads']], 'filename' => ['type' => 'string'],
            ]]],
            ['name' => 'get_recording', 'description' => 'Return a secure recording URL for a run.', 'inputSchema' => ['type' => 'object', 'required' => ['flow_id', 'run_id'], 'properties' => $base]],
            ['name' => 'get_recording_lastshot', 'description' => 'Return a secure URL for the last recording frame.', 'inputSchema' => ['type' => 'object', 'required' => ['flow_id', 'run_id'], 'properties' => $base]],
        ];
    }

    public function handles(string $name): bool
    {
        return in_array($name, array_column($this->definitions(), 'name'), true);
    }

    public function call(string $name, array $arguments, McpToolContext $context): array
    {
        return match ($name) {
            'list_artifacts' => $this->list($arguments, $context),
            'get_latest_screenshot' => $this->latestScreenshot($arguments, $context),
            'download_artifact' => $this->download($arguments, $context),
            'get_recording' => $this->recording($arguments, $context, false),
            'get_recording_lastshot' => $this->recording($arguments, $context, true),
            default => throw ValidationException::withMessages(['name' => 'Unknown artifact tool.']),
        };
    }

    /** @param Arguments $arguments
     * @return array<string, mixed>
     */
    private function list(array $arguments, McpToolContext $context): array
    {
        [$flow, $run] = $this->resources->run($arguments, $context);
        $type = $this->type($arguments['type'] ?? null);

        return ['artifacts' => $this->files($flow, $run, $type, $context)];
    }

    /** @param Arguments $arguments
     * @return array<string, mixed>
     */
    private function latestScreenshot(array $arguments, McpToolContext $context): array
    {
        $flow = $this->resources->flow(trim(McpToolArguments::string($arguments, 'flow_id')), $context);
        if (isset($arguments['run_id'])) {
            [, $run] = $this->resources->run($arguments, $context);
        } else {
            $run = $this->runSearch->visibleRunsQuery($context->user, $context->workspace->id)->where('flow_id', $flow->id)->first();
        }
        if (! $run instanceof FlowRun) {
            throw ValidationException::withMessages(['run_id' => 'No runs found for this flow.']);
        }
        $files = $this->files($flow, $run, 'screenshots', $context);
        usort($files, fn (array $a, array $b) => strcmp($this->fileValue($b, 'modified_at'), $this->fileValue($a, 'modified_at')));

        return ['run_id' => $run->id, 'screenshot' => $files[0] ?? null];
    }

    /** @param Arguments $arguments
     * @return array<string, mixed>
     */
    private function download(array $arguments, McpToolContext $context): array
    {
        [$flow, $run] = $this->resources->run($arguments, $context);
        $type = $this->type($arguments['type'] ?? null);
        $filename = trim(McpToolArguments::string($arguments, 'filename'));
        $artifact = collect($this->files($flow, $run, $type, $context))->firstWhere('name', $filename);
        if (! $artifact) {
            throw ValidationException::withMessages(['filename' => 'Artifact not found.']);
        }

        return ['artifact' => $artifact, 'authorization' => 'Use the same Bearer MCP token when downloading this URL.'];
    }

    /** @param Arguments $arguments
     * @return array<string, mixed>
     */
    private function recording(array $arguments, McpToolContext $context, bool $lastshot): array
    {
        [$flow, $run] = $this->resources->run($arguments, $context);
        $this->features->abortIfDisabled('recording_enabled');
        $exists = $lastshot ? $this->storage->recordingLastshotExists($run) : $this->storage->recordingExists($run);
        if (! $exists) {
            throw ValidationException::withMessages(['run_id' => $lastshot ? 'Recording lastshot not found.' : 'Recording not found.']);
        }

        $oauth = str_starts_with($context->artifactRouteName, 'mcp.oauth.');
        $routeName = $oauth
            ? ($lastshot ? 'mcp.oauth.recording.lastshot' : 'mcp.oauth.recording')
            : ($lastshot ? 'mcp.recording.lastshot' : 'mcp.recording');
        $parameters = ['id' => $flow->id, 'run' => $run->id];
        if ($oauth) {
            $parameters['workspace'] = $context->workspace->id;
        }

        return [
            'run_id' => $run->id,
            'url' => route($routeName, $parameters),
            'authorization' => 'Use the same Bearer MCP token when downloading this URL.',
        ];
    }

    private function type(mixed $type): string
    {
        if (! is_string($type) || ! in_array($type, ['screenshots', 'downloads'], true)) {
            throw ValidationException::withMessages(['type' => 'Artifact type must be screenshots or downloads.']);
        }

        return $type;
    }

    /** @return list<array<string, mixed>> */
    private function files(Flow $flow, FlowRun $run, string $type, McpToolContext $context): array
    {
        if (! $this->features->enabled('recording_enabled')) {
            return [];
        }

        $oauth = str_starts_with($context->artifactRouteName, 'mcp.oauth.');

        return array_map(function (array $file) use ($flow, $run, $type, $context, $oauth) {
            $parameters = ['id' => $flow->id, 'run' => $run->id, 'type' => $type, 'filename' => $file['name']];
            if ($oauth) {
                $parameters['workspace'] = $context->workspace->id;
            }

            return [...$file, 'url' => route($context->artifactRouteName, $parameters)];
        }, $this->storage->artifactFiles($run, $type));
    }

    /** @param array<string, mixed> $file */
    private function fileValue(array $file, string $key): string
    {
        return is_string($file[$key] ?? null) ? $file[$key] : '';
    }
}
