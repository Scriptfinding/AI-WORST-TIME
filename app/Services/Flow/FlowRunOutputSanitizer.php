<?php

/*
 * Explicit proprietary scope: licensed run output and replay metadata shaping implement paid Puppetflow features
 * and are licensed under the Puppetflow Proprietary License. See LICENSE_PROPRIETARY.md.
 */

namespace App\Services\Flow;

use App\Models\Flow;
use App\Models\FlowRun;

final class FlowRunOutputSanitizer
{
    /**
     * @param  array<array-key, mixed>  $result
     * @return array<array-key, mixed>
     */
    public function cleanOutput(array $result, Flow $flow): array
    {
        $result = $this->stripInternalFields($result);

        if (! ($flow->include_context_in_output ?? true)) {
            unset($result['$context']);
        }
        if (! ($flow->include_input_in_output ?? false)) {
            unset($result['$input']);
        }

        return $result;
    }

    /** @param array<array-key, mixed> $result */
    public function extractLegend(array $result): ?string
    {
        $context = $result['$context'] ?? null;
        $legend = is_array($context) ? ($context['legend'] ?? null) : null;

        return is_string($legend) && $legend !== '' ? $legend : null;
    }

    /**
     * @param  array<array-key, mixed>  $result
     * @return array<array-key, mixed>|null
     */
    public function extractMeta(array $result): ?array
    {
        $context = $result['$context'] ?? null;
        $meta = is_array($context) ? ($context['meta'] ?? null) : null;
        if (! is_array($meta)) {
            return null;
        }

        $meta = $this->stripInternalFields($meta);

        return $meta !== [] ? $meta : null;
    }

    /**
     * @param  array<array-key, mixed>|null  $internalOutput
     * @return array<array-key, mixed>|null
     */
    public function extractInternalMeta(?array $internalOutput): ?array
    {
        if ($internalOutput === null || $internalOutput === []) {
            return null;
        }

        $internalOutput = $this->stripInternalFields($internalOutput);

        return $internalOutput !== [] ? $internalOutput : null;
    }

    /** @return array<array-key, mixed>|null */
    public function extractActionLogs(FlowRun $run, bool $createPath = true): ?array
    {
        $path = $run->getFlowRunArtifactsBasePath($createPath).'/tmp/_run-action-logs.json';
        if (! file_exists($path)) {
            return null;
        }

        $json = file_get_contents($path);
        @unlink($path);
        $decoded = is_string($json) ? json_decode($json, true) : null;

        return is_array($decoded) && $decoded !== [] ? $decoded : null;
    }

    /**
     * @param  array<array-key, mixed>  $value
     * @return array<array-key, mixed>
     */
    private function stripInternalFields(array $value): array
    {
        unset($value['__nodal_preview']);

        foreach ($value as $key => $item) {
            if (is_array($item)) {
                $value[$key] = $this->stripInternalFields($item);
            }
        }

        return $value;
    }
}
