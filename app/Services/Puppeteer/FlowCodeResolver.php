<?php

namespace App\Services\Puppeteer;

use App\Models\Flow;
use App\Models\User;
use App\Services\Flow\Source\FlowSourceService;

final class FlowCodeResolver
{
    public function __construct(private readonly FlowSourceService $sources) {}

    public function resolve(Flow $flow, ?string $codeOverride = null, ?User $actor = null): ?string
    {
        $code = $codeOverride;

        if ($code === null && $flow->source_type === 'repository') {
            $code = $this->sources->resolveCode($flow, $actor);
        }

        if ($code === null && $flow->source_type !== 'repository') {
            $code = $flow->code;
        }

        if (empty($code) && $flow->source_type !== 'repository') {
            $code = $this->sources->resolveCode($flow, $actor);
        }

        if (empty($code)) {
            $diskPath = $this->cliFlowPath($flow);
            if ($diskPath && file_exists($diskPath)) {
                $code = file_get_contents($diskPath);
            }
        }

        return $code ?: null;
    }

    public function cliFlowPath(Flow $flow): ?string
    {
        $configuredDir = config('puppetflow.cli_flows_dir');
        $dir = is_string($configuredDir) ? $configuredDir : '';
        $path = base_path("{$dir}/{$flow->id}/nodeBody.js");

        return file_exists($path) ? $path : null;
    }
}
