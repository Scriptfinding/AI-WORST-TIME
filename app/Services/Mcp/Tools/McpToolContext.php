<?php

namespace App\Services\Mcp\Tools;

use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceMcpSetting;

final readonly class McpToolContext
{
    public function __construct(
        public User $user,
        public Workspace $workspace,
        public WorkspaceMcpSetting $setting,
        public string $artifactRouteName,
    ) {}
}
