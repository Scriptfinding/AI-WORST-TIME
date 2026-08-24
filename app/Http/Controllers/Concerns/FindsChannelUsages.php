<?php

/*
 * Explicit proprietary scope: the paid shared channel visibility branches in this file implement paid
 * Puppetflow features and are licensed under the Puppetflow Proprietary License.
 * See LICENSE_PROPRIETARY.md.
 */

namespace App\Http\Controllers\Concerns;

use App\Enums\Authorization\Ability;
use App\Models\Flow;
use App\Models\User;
use App\Services\Flow\NodalGraphParameterMatcher;

trait FindsChannelUsages
{
    /**
     * @return list<string>
     */
    private function channelIdPatterns(string $id): array
    {
        return [
            '~'.preg_quote('$notify', '~').'\s*\(\s*(["\'])'.preg_quote($id, '~').'\1~',
            '~'.preg_quote('$waitHumanValidation', '~').'\s*\(\s*(["\'])'.preg_quote($id, '~').'\1~',
            '~'.preg_quote('${channels.'.$id, '~').'(?=[}.])~',
        ];
    }

    /**
     * @return list<array{node: string, parameter: string, value: string}>
     */
    private function channelVisualParameterMatches(string $id): array
    {
        return [
            ['node' => '$notify', 'parameter' => 'channelId', 'value' => $id],
            ['node' => '$waitHumanValidation', 'parameter' => 'channelId', 'value' => $id],
        ];
    }

    /**
     * @param  list<string>  $channelIds
     * @return list<array<string, mixed>>
     */
    private function findFlowsUsingChannels(array $channelIds, string $workspaceId, User $actor): array
    {
        $flows = Flow::where('workspace_id', $workspaceId)
            ->where(function ($q) {
                $q->whereNotNull('code')->orWhereNotNull('nodal_graph');
            })
            ->get([
                'id', 'name', 'code', 'nodal_graph',
                'workspace_id', 'owner_id', 'visibility', 'team_id',
                'icon_type', 'icon_value', 'icon_color', 'icon_upload_path', 'updated_at',
            ]);

        $allPatterns = [];
        foreach ($channelIds as $id) {
            array_push($allPatterns, ...$this->channelIdPatterns($id));
        }

        $results = [];
        foreach ($flows as $flow) {
            if (! $actor->can(Ability::VIEW->value, $flow)) {
                continue;
            }

            $nodalGraph = is_array($flow->nodal_graph) ? json_encode($flow->nodal_graph) : '';
            $hasVisualParameterUsage = is_array($flow->nodal_graph)
                && collect($channelIds)->contains(fn ($id) => app(NodalGraphParameterMatcher::class)->hasFixedNodeParameter(
                    $flow->nodal_graph,
                    $this->channelVisualParameterMatches($id),
                ));
            foreach ($allPatterns as $pattern) {
                if ($hasVisualParameterUsage || preg_match($pattern, $flow->code ?? '') === 1 || ($nodalGraph && preg_match($pattern, $nodalGraph) === 1)) {
                    $results[$flow->id] = [
                        'flow_id' => $flow->id,
                        'flow_name' => $flow->name,
                        'icon_type' => $flow->icon_type,
                        'icon_value' => $flow->icon_value,
                        'icon_color' => $flow->icon_color,
                        'icon_url' => $flow->icon_url,
                    ];
                    break;
                }
            }
        }

        return array_values($results);
    }
}
