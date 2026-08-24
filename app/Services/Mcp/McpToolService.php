<?php

namespace App\Services\Mcp;

use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceMcpSetting;
use App\Services\Mcp\Tools\ArtifactMcpTools;
use App\Services\Mcp\Tools\FlowMcpTools;
use App\Services\Mcp\Tools\McpToolContext;
use App\Services\Mcp\Tools\McpToolHandler;
use App\Services\Mcp\Tools\RunMcpTools;
use App\Services\Mcp\Tools\TeamMcpTools;
use App\Services\Mcp\Tools\WorkspaceMcpTools;
use Illuminate\Validation\ValidationException;

/**
 * @phpstan-type McpArguments array<string, mixed>
 * @phpstan-type McpToolDefinition array{name: string, description: string, inputSchema: array<string, mixed>}
 */
final class McpToolService
{
    private const DEFAULT_TOOLS = [
        'search_flows',
        'search_runs',
        'get_flow_details',
        'run_flow',
        'get_run',
        'get_run_result',
        'list_artifacts',
        'get_latest_screenshot',
        'download_artifact',
        'continue_human_validation',
    ];

    /** @var list<McpToolHandler> */
    private array $handlers;

    public function __construct(
        FlowMcpTools $flows,
        RunMcpTools $runs,
        ArtifactMcpTools $artifacts,
        WorkspaceMcpTools $workspace,
        TeamMcpTools $teams,
    ) {
        $this->handlers = [$flows, $runs, $artifacts, $workspace, $teams];
    }

    /** @return list<McpToolDefinition> */
    public function listTools(?WorkspaceMcpSetting $setting = null): array
    {
        $tools = $this->allTools();
        if (! $setting) {
            return $tools;
        }
        $enabled = $this->enabledToolNames($setting);

        return array_values(array_filter($tools, fn (array $tool) => in_array($tool['name'], $enabled, true)));
    }

    /** @return list<McpToolDefinition> */
    public function allTools(): array
    {
        return array_merge(...array_map(
            fn (McpToolHandler $handler) => $handler->definitions(),
            $this->handlers,
        ));
    }

    /**
     * @param  McpArguments  $arguments
     * @return array<string, mixed>
     */
    public function call(
        string $name,
        array $arguments,
        User $user,
        Workspace $workspace,
        WorkspaceMcpSetting $setting,
        string $artifactRouteName = 'mcp.artifacts.download',
    ): array {
        if (! in_array($name, $this->enabledToolNames($setting), true)) {
            throw ValidationException::withMessages(['name' => 'MCP tool is disabled for this workspace.']);
        }

        $handler = collect($this->handlers)->first(fn (McpToolHandler $candidate) => $candidate->handles($name));
        if (! $handler instanceof McpToolHandler) {
            throw ValidationException::withMessages(['name' => 'Unknown MCP tool.']);
        }

        return $handler->call(
            $name,
            $arguments,
            new McpToolContext($user, $workspace, $setting, $artifactRouteName),
        );
    }

    /** @return list<string> */
    public function allToolNames(): array
    {
        return array_column($this->allTools(), 'name');
    }

    /** @return list<string> */
    public function defaultToolNames(): array
    {
        return array_values(array_intersect(self::DEFAULT_TOOLS, $this->allToolNames()));
    }

    /** @return list<string> */
    public function enabledToolNames(WorkspaceMcpSetting $setting): array
    {
        $all = $this->allToolNames();
        $enabled = $setting->enabled_tools;
        if (! is_array($enabled)) {
            return $this->defaultToolNames();
        }
        $enabled = array_map(
            fn (mixed $name) => $name === 'execute_flow' ? 'run_flow' : $name,
            $enabled,
        );

        return array_values(array_filter(array_intersect($enabled, $all), 'is_string'));
    }
}
