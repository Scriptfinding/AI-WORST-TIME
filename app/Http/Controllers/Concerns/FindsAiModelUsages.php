<?php

/*
 * Explicit proprietary scope: the paid shared AI model visibility branches in this file implement paid
 * Puppetflow features and are licensed under the Puppetflow Proprietary License.
 * See LICENSE_PROPRIETARY.md.
 */

namespace App\Http\Controllers\Concerns;

use App\Enums\Authorization\Ability;
use App\Models\Flow;
use App\Models\User;
use App\Services\Flow\NodalGraphParameterMatcher;

trait FindsAiModelUsages
{
    /**
     * @return list<array{node: string, parameter: string, value: string}>
     */
    private function aiModelVisualParameterMatches(string $id): array
    {
        return [
            ['node' => '$aiMessage', 'parameter' => 'aiModelId', 'value' => $id],
            ['node' => '$aiControl', 'parameter' => 'aiModelId', 'value' => $id],
        ];
    }

    /** @return list<array<string, mixed>> */
    private function findFlowsUsingAiModel(
        string $id,
        string $workspaceId,
        User $actor,
        bool $includeHidden = false,
    ): array {
        $flows = Flow::query()
            ->where('workspace_id', $workspaceId)
            ->where(function ($query): void {
                $query->whereNotNull('code')
                    ->orWhereNotNull('nodal_graph')
                    ->orWhereNotNull('default_inputs');
            })
            ->get([
                'id', 'name', 'code', 'nodal_graph', 'default_inputs',
                'workspace_id', 'owner_id', 'visibility', 'team_id',
                'icon_type', 'icon_value', 'icon_color', 'icon_upload_path', 'updated_at',
            ]);
        $matcher = app(NodalGraphParameterMatcher::class);
        $results = [];

        foreach ($flows as $flow) {
            if (! $includeHidden && ! $actor->can(Ability::VIEW->value, $flow)) {
                continue;
            }

            $inputKeys = $this->defaultInputKeysWithValue(
                $flow->default_inputs,
                '${aiModels.'.$id.'}',
            );
            $hasUsage = $this->containsAiModelLiteral($flow->code ?? '', $id)
                || $this->graphContainsAiModelLiteral($flow->nodal_graph, $id)
                || $this->containsAiModelInputUsage($flow->code ?? '', $inputKeys)
                || $this->graphContainsAiModelInputUsage($flow->nodal_graph, $inputKeys)
                || $matcher->hasFixedNodeParameter(
                    $flow->nodal_graph,
                    $this->aiModelVisualParameterMatches($id),
                );

            if ($hasUsage) {
                $results[] = [
                    'flow_id' => $flow->id,
                    'flow_name' => $flow->name,
                    'icon_type' => $flow->icon_type,
                    'icon_value' => $flow->icon_value,
                    'icon_color' => $flow->icon_color,
                    'icon_url' => $flow->icon_url,
                ];
            }
        }

        return $results;
    }

    private function containsAiModelLiteral(string $value, string $id): bool
    {
        foreach ($this->aiModelLiteralPatterns($id) as $pattern) {
            if (preg_match($pattern, $value) === 1) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param  array<array-key, mixed>|null  $inputs
     * @return list<string>
     */
    private function defaultInputKeysWithValue(?array $inputs, string $expected): array
    {
        if ($inputs === null) {
            return [];
        }

        $keys = [];
        foreach ($inputs as $key => $value) {
            if (is_string($key) && $value === $expected) {
                $keys[] = $key;
            }
        }

        return $keys;
    }

    /** @param list<string> $inputKeys */
    private function containsAiModelInputUsage(string $value, array $inputKeys): bool
    {
        foreach (['aiMessage', 'aiControl'] as $helper) {
            foreach ($inputKeys as $inputKey) {
                $pattern = '~'.preg_quote('$'.$helper, '~')
                    .'\s*\(\s*'.$this->inputAccessPattern($inputKey).'(?=\s*,)~';
                if (preg_match($pattern, $value) === 1) {
                    return true;
                }
            }
        }

        return false;
    }

    private function inputAccessPattern(string $key): string
    {
        $escaped = preg_quote($key, '~');

        return '(?:'.preg_quote('$input.', '~').$escaped
            .'|'.preg_quote('$input[', '~').'\s*["\']'.$escaped.'["\']\s*'.preg_quote(']', '~').')';
    }

    /**
     * @param  array<array-key, mixed>|null  $graph
     * @param  list<string>  $inputKeys
     */
    private function graphContainsAiModelInputUsage(?array $graph, array $inputKeys): bool
    {
        if ($graph === null || $inputKeys === []) {
            return false;
        }

        if (isset($graph['nodes']) && is_array($graph['nodes'])) {
            foreach ($graph['nodes'] as $node) {
                if (
                    is_array($node)
                    && ($node['deactivated'] ?? false) !== true
                    && $this->graphContainsAiModelInputUsage($node, $inputKeys)
                ) {
                    return true;
                }
            }

            return false;
        }

        foreach ($graph as $value) {
            if (is_string($value) && $this->containsAiModelInputUsage($value, $inputKeys)) {
                return true;
            }
            if (is_array($value) && $this->graphContainsAiModelInputUsage($value, $inputKeys)) {
                return true;
            }
        }

        return false;
    }

    /** @param array<array-key, mixed>|null $graph */
    private function graphContainsAiModelLiteral(?array $graph, string $id): bool
    {
        if ($graph === null) {
            return false;
        }

        if (isset($graph['nodes']) && is_array($graph['nodes'])) {
            foreach ($graph['nodes'] as $node) {
                if (
                    is_array($node)
                    && ($node['deactivated'] ?? false) !== true
                    && $this->graphContainsAiModelLiteral($node, $id)
                ) {
                    return true;
                }
            }

            return false;
        }

        foreach ($graph as $value) {
            if (is_string($value) && $this->containsAiModelLiteral($value, $id)) {
                return true;
            }
            if (is_array($value) && $this->graphContainsAiModelLiteral($value, $id)) {
                return true;
            }
        }

        return false;
    }

    /** @return list<string> */
    private function aiModelLiteralPatterns(string $id): array
    {
        $patterns = [];
        foreach (['aiMessage', 'aiControl'] as $helper) {
            $patterns[] = '~'.preg_quote('$'.$helper, '~').'\s*\(\s*(["\'])'.preg_quote($id, '~').'\1~';
        }
        $patterns[] = '~'.preg_quote('${aiModels.'.$id.'}', '~').'~';

        return $patterns;
    }
}
