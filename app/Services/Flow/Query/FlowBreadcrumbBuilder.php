<?php

namespace App\Services\Flow\Query;

use App\Models\Flow;
use App\Models\Folder;

final class FlowBreadcrumbBuilder
{
    /** @return list<array<string, mixed>> */
    public function folders(?Folder $folder): array
    {
        return $this->folderChain($folder);
    }

    /** @return list<array<string, mixed>> */
    private function folderChain(?Folder $folder): array
    {
        $breadcrumbs = [];
        $current = $folder;
        while ($current) {
            array_unshift($breadcrumbs, [
                'id' => $current->id,
                'name' => $current->name,
                'team_id' => $current->team_id,
                'is_shared' => (bool) $current->is_shared,
                'parent_id' => $current->parent_id,
                'owner_id' => $current->owner_id,
            ]);
            $current = $current->parent;
        }

        return $breadcrumbs;
    }

    /** @return list<array<string, mixed>> */
    public function flow(Flow $flow): array
    {
        if (in_array($flow->visibility, ['workspace', 'team'], true)) {
            $crumbs = $this->folderChain($flow->workspaceFolder);
            foreach ($crumbs as &$crumb) {
                $folderId = is_string($crumb['id']) ? $crumb['id'] : '';
                $crumb['href'] = '/flows?view=workspace&folder_id='.$folderId;
            }
            unset($crumb);

            $workspace = ['id' => null, 'name' => 'Workspace', 'href' => '/flows?view=workspace', 'icon' => 'workspace'];
            if ($flow->visibility === 'team' && $flow->team) {
                if ($crumbs !== [] && ! empty($crumbs[0]['team_id'])) {
                    $root = array_shift($crumbs);
                    $team = ['id' => null, 'name' => $flow->team->name, 'href' => $root['href'], 'icon' => 'team'];
                } else {
                    $team = ['id' => null, 'name' => $flow->team->name, 'href' => '/flows?view=workspace', 'icon' => 'team'];
                }
                array_unshift($crumbs, $workspace, $team);
            } else {
                array_unshift($crumbs, $workspace);
            }
            $this->siblings($crumbs, $flow->workspace_id, true);

            return $crumbs;
        }

        $crumbs = $this->folderChain($flow->folder);
        array_unshift($crumbs, ['id' => null, 'name' => 'Personal', 'href' => '/flows', 'icon' => 'personal']);
        $this->siblings($crumbs, $flow->workspace_id, false);

        return $crumbs;
    }

    /** @param list<array<string, mixed>> $crumbs */
    private function siblings(array &$crumbs, string $workspaceId, bool $workspaceView): void
    {
        foreach ($crumbs as &$crumb) {
            if ($crumb['id'] === null) {
                $crumb['siblingFolders'] = [];

                continue;
            }
            $query = Folder::where('workspace_id', $workspaceId)
                ->where('parent_id', $crumb['parent_id'] ?? null)
                ->where('id', '!=', $crumb['id'])
                ->orderBy('sort_order');
            if ($workspaceView) {
                ! empty($crumb['team_id'])
                    ? $query->where('team_id', $crumb['team_id'])
                    : $query->whereNull('team_id')->where('is_shared', true);
            } else {
                $query->personal()->where('owner_id', $crumb['owner_id'] ?? null);
            }
            $crumb['siblingFolders'] = $query->get(['id', 'name'])->map(fn (Folder $sibling) => [
                'id' => $sibling->id,
                'name' => $sibling->name,
                'href' => $workspaceView
                    ? '/flows?view=workspace&folder_id='.$sibling->id
                    : '/flows?folder_id='.$sibling->id,
            ])->all();
        }
        unset($crumb);
    }
}
