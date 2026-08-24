<?php

namespace App\Services\Flow\Query;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

final class FlowOwnerRoleProjector
{
    public function one(string $ownerId, string $workspaceId): string
    {
        $role = DB::table('user_workspace')
            ->where('workspace_id', $workspaceId)
            ->where('user_id', $ownerId)
            ->value('role');

        return is_string($role) ? $role : 'member';
    }

    /** @param iterable<array-key, Model> $items */
    public function models(iterable $items, string $workspaceId, string $ownerKey = 'user_id'): void
    {
        $ids = collect($items)->pluck($ownerKey)->filter()->unique()->values()->all();
        if ($ids === []) {
            return;
        }
        $roles = DB::table('user_workspace')->where('workspace_id', $workspaceId)
            ->whereIn('user_id', $ids)->pluck('role', 'user_id')->all();
        foreach ($items as $item) {
            $ownerId = $item->{$ownerKey} ?? null;
            $item->setAttribute('owner_workspace_role', $ownerId ? ($roles[$ownerId] ?? 'member') : 'member');
        }
    }

    /**
     * @param  list<array<string, mixed>>  $trees
     * @param  iterable<array-key, Model>  ...$models
     */
    public function projectTrees(string $workspaceId, array &$trees, iterable ...$models): void
    {
        $treeIds = $this->ownerIds($trees);
        $ids = [];
        foreach ($models as $items) {
            $ids = array_merge($ids, collect($items)->pluck('owner_id')->all());
        }
        $ids = array_values(array_unique(array_filter($ids)));
        $allIds = array_values(array_unique(array_merge($ids, $treeIds)));
        $roles = $allIds === []
            ? []
            : DB::table('user_workspace')
                ->where('workspace_id', $workspaceId)
                ->whereIn('user_id', $allIds)
                ->pluck('role', 'user_id')
                ->all();
        /** @var array<string, string> $roles */
        $this->inject($trees, $roles);
        foreach ($models as $items) {
            foreach ($items as $item) {
                $ownerId = $item->getAttribute('owner_id');
                $item->setAttribute(
                    'owner_workspace_role',
                    is_string($ownerId) ? ($roles[$ownerId] ?? 'member') : 'member',
                );
            }
        }
    }

    /**
     * @param  list<array<string, mixed>>  $trees
     * @return list<string>
     */
    private function ownerIds(array $trees): array
    {
        $ids = [];
        foreach ($trees as $node) {
            foreach (['flows', 'rootFlows'] as $key) {
                $flows = isset($node[$key]) && is_array($node[$key]) ? $node[$key] : [];
                foreach ($flows as $flow) {
                    if (is_array($flow) && isset($flow['owner_id']) && is_string($flow['owner_id'])) {
                        $ids[] = $flow['owner_id'];
                    }
                }
            }
            /** @var list<array<string, mixed>> $children */
            $children = isset($node['children']) && is_array($node['children']) ? array_values($node['children']) : [];
            /** @var list<array<string, mixed>> $tree */
            $tree = isset($node['tree']) && is_array($node['tree']) ? array_values($node['tree']) : [];
            $ids = array_merge($ids, $this->ownerIds($children), $this->ownerIds($tree));
        }

        return $ids;
    }

    /**
     * @param  list<array<string, mixed>>  $trees
     * @param  array<string, string>  $roles
     */
    private function inject(array &$trees, array $roles): void
    {
        foreach ($trees as &$node) {
            foreach (['flows', 'rootFlows'] as $key) {
                if (! isset($node[$key]) || ! is_array($node[$key])) {
                    continue;
                }
                foreach ($node[$key] as &$flow) {
                    if (! is_array($flow)) {
                        continue;
                    }
                    $ownerId = $flow['owner_id'] ?? null;
                    $flow['owner_workspace_role'] = is_string($ownerId)
                        ? ($roles[$ownerId] ?? 'member')
                        : 'member';
                }
                unset($flow);
            }
            if (isset($node['children']) && is_array($node['children'])) {
                /** @var list<array<string, mixed>> $children */
                $children = array_values($node['children']);
                $this->inject($children, $roles);
                $node['children'] = $children;
            }
            if (isset($node['tree']) && is_array($node['tree'])) {
                /** @var list<array<string, mixed>> $tree */
                $tree = array_values($node['tree']);
                $this->inject($tree, $roles);
                $node['tree'] = $tree;
            }
        }
        unset($node);
    }
}
