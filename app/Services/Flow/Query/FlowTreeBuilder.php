<?php

namespace App\Services\Flow\Query;

use App\Authorization\AuthorizationContext;
use App\Authorization\AuthorizationContextFactory;
use App\Authorization\ScopeEvaluator;
use App\Authorization\Visibility\FlowVisibility;
use App\Authorization\Visibility\FolderVisibility;
use App\Models\Flow;
use App\Models\Folder;
use App\Models\User;
use App\Models\WorkspaceTeam;
use App\Services\FeatureFlags\FeatureFlagService;
use Illuminate\Support\Collection;

final class FlowTreeBuilder
{
    private const FLOW_COLUMNS = [
        'id', 'name', 'visibility', 'folder_id',
        'workspace_folder_id', 'owner_id', 'team_id', 'icon_type',
        'icon_value', 'icon_color', 'icon_upload_path', 'library_reference',
    ];

    public function __construct(
        private readonly FeatureFlagService $features,
        private readonly AuthorizationContextFactory $contexts,
        private readonly ScopeEvaluator $scopes,
        private readonly FlowVisibility $flowVisibility,
        private readonly FolderVisibility $folderVisibility,
    ) {}

    /**
     * Returns all workspace team IDs for administrators or the user's team IDs otherwise.
     *
     * @return list<string>
     */
    public function visibleTeamIds(AuthorizationContext $context, string $workspaceId): array
    {
        $teamIds = $this->scopes->isAdministrator($context)
            ? WorkspaceTeam::where('workspace_id', $workspaceId)->pluck('id')->all()
            : $context->teamIds;

        return array_values(array_filter($teamIds, static fn (mixed $id): bool => is_string($id)));
    }

    /** @return list<array<string, mixed>> */
    public function personal(string $workspaceId, User $user): array
    {
        $context = $this->contexts->for($user, $workspaceId);
        $folders = Folder::query();
        $this->folderVisibility->apply($folders, $context);
        $folders->personal()
            ->where('owner_id', $user->id);
        $folders = $folders->orderBy('sort_order')
            ->get(['id', 'name', 'parent_id']);
        if ($folders->isEmpty()) {
            return [];
        }

        $flows = Flow::query();
        $this->flowVisibility->apply($flows, $context);
        $flows->whereIn('visibility', $this->ownerFallbackVisibilities())
            ->where('owner_id', $user->id)
            ->whereIn('folder_id', $folders->pluck('id'))
            ->orderBy('name');
        $flows = $flows
            ->get(self::FLOW_COLUMNS);

        return $this->tree($folders, $flows, 'folder_id');
    }

    /** @return list<array<string, mixed>> */
    public function users(string $workspaceId, User $user): array
    {
        $context = $this->contexts->for($user, $workspaceId);
        if (! $context->isInstanceAdmin()) {
            return [];
        }

        $folders = Folder::query();
        $this->folderVisibility->apply($folders, $context);
        $folders = $folders->personal()
            ->where('owner_id', '!=', $user->id)
            ->orderBy('sort_order')
            ->get(['id', 'name', 'parent_id', 'owner_id']);

        $flows = Flow::query();
        $this->flowVisibility->apply($flows, $context);
        $flows = $flows->whereIn('visibility', $this->ownerFallbackVisibilities())
            ->where('owner_id', '!=', $user->id)
            ->orderBy('name')
            ->get(self::FLOW_COLUMNS);

        $ownerIds = $folders->pluck('owner_id')
            ->merge($flows->pluck('owner_id'))
            ->filter()
            ->unique()
            ->values();
        $owners = User::whereIn('id', $ownerIds)->orderBy('name')->get(['id', 'name']);

        return array_values($owners->map(function (User $owner) use ($folders, $flows): array {
            $ownerFolders = $folders->where('owner_id', $owner->id)->values();
            $ownerFolderIds = $ownerFolders->pluck('id');
            $ownerFlows = $flows->where('owner_id', $owner->id)->values();
            $folderFlows = $ownerFlows->whereIn('folder_id', $ownerFolderIds)->values();
            $rootFlows = $ownerFlows->whereNull('folder_id')->values();

            return [
                'id' => $owner->id,
                'name' => $owner->name,
                'tree' => $this->tree($ownerFolders, $folderFlows, 'folder_id'),
                'rootFlows' => array_values($rootFlows->map(fn (Flow $flow) => $this->flow($flow))->all()),
            ];
        })->all());
    }

    /** @return list<array<string, mixed>> */
    public function workspace(string $workspaceId, User $user): array
    {
        $context = $this->contexts->for($user, $workspaceId);
        $folders = Folder::query();
        $this->folderVisibility->apply($folders, $context);
        $folders = $folders->workspaceScope()
            ->with('owner:id,name')
            ->orderBy('sort_order')
            ->get(['id', 'name', 'parent_id', 'owner_id']);
        if ($folders->isEmpty()) {
            return [];
        }

        $flows = Flow::query();
        $this->flowVisibility->apply($flows, $context);
        $flows = $flows->where('visibility', 'workspace')
            ->whereIn('workspace_folder_id', $folders->pluck('id'))
            ->orderBy('name')
            ->get(self::FLOW_COLUMNS);

        return $this->tree($folders, $flows, 'workspace_folder_id', true);
    }

    /**
     * @param  list<string>  $teamIds
     * @return list<array<string, mixed>>
     */
    public function teams(string $workspaceId, User $user, array $teamIds): array
    {
        if ($teamIds === []) {
            return [];
        }

        $context = $this->contexts->for($user, $workspaceId);
        $teams = WorkspaceTeam::where('workspace_id', $workspaceId)
            ->whereIn('id', $teamIds)
            ->get();
        $folders = Folder::query();
        $this->folderVisibility->apply($folders, $context);
        $folders = $folders
            ->where('is_shared', true)
            ->whereIn('team_id', $teams->pluck('id'))
            ->orderBy('sort_order')
            ->get(['id', 'name', 'parent_id', 'team_id']);

        $flows = Flow::query();
        $this->flowVisibility->apply($flows, $context);
        $flows = $flows
            ->where('visibility', 'team')
            ->whereIn('team_id', $teams->pluck('id'))
            ->orderBy('name')
            ->get(self::FLOW_COLUMNS);

        $result = [];
        foreach ($teams as $team) {
            $teamFolders = $folders->where('team_id', $team->id)->values();
            $teamFolderIds = $teamFolders->pluck('id')->all();
            $root = $teamFolders->whereNull('parent_id')->first();
            $teamFlows = $flows->filter(fn (Flow $flow): bool => $flow->workspace_folder_id !== null
                && $flow->team_id === $team->id
                && in_array($flow->workspace_folder_id, $teamFolderIds, true));
            $rootFlows = $flows->filter(fn (Flow $flow): bool => $flow->team_id === $team->id
                && (
                    $flow->workspace_folder_id === null
                    || ($root && $flow->workspace_folder_id === $root->id)
                ));

            $result[] = [
                'id' => $team->id,
                'name' => $team->name,
                'root_folder_id' => $root?->id,
                'tree' => $root ? $this->tree($teamFolders, $teamFlows, 'workspace_folder_id', false, $root->id) : [],
                'rootFlows' => $rootFlows->map(fn (Flow $flow) => $this->flow($flow))->all(),
            ];
        }

        return $result;
    }

    /** @return list<string> */
    public function ownerFallbackVisibilities(): array
    {
        $visibilities = ['owner'];
        if (! $this->features->workspaceSharingEnabled()) {
            $visibilities[] = 'workspace';
        }
        if (! $this->features->teamsEnabled()) {
            $visibilities[] = 'team';
        }

        return $visibilities;
    }

    /**
     * @param  Collection<int, Folder>  $folders
     * @param  Collection<int, Flow>  $flows
     * @return list<array<string, mixed>>
     */
    private function tree(
        Collection $folders,
        Collection $flows,
        string $folderKey,
        bool $includeOwner = false,
        ?string $startParent = null,
    ): array {
        $grouped = [];
        foreach ($flows as $flow) {
            $grouped[$flow->{$folderKey}][] = $this->flow($flow);
        }
        $build = function (?string $parentId) use ($folders, $grouped, $includeOwner, &$build): array {
            $children = $parentId === null
                ? $folders->whereNull('parent_id')
                : $folders->where('parent_id', $parentId);

            return $children->values()->map(function (Folder $folder) use ($grouped, $includeOwner, &$build) {
                $node = [
                    'id' => $folder->id,
                    'name' => $folder->name,
                    'parent_id' => $folder->parent_id,
                    'children' => $build($folder->id),
                    'flows' => $grouped[$folder->id] ?? [],
                ];
                if ($includeOwner) {
                    $node['owner_name'] = $folder->owner?->name;
                }
                if ($folder->team_id !== null) {
                    $node['team_id'] = $folder->team_id;
                }

                return $node;
            })->all();
        };

        return array_values($build($startParent));
    }

    /** @return array<string, mixed> */
    private function flow(Flow $flow): array
    {
        return [
            'id' => $flow->id,
            'name' => $flow->name,
            'visibility' => $flow->visibility,
            'folder_id' => $flow->folder_id,
            'workspace_folder_id' => $flow->workspace_folder_id,
            'owner_id' => $flow->owner_id,
            'team_id' => $flow->team_id,
            'icon_type' => $flow->icon_type,
            'icon_value' => $flow->icon_value,
            'icon_color' => $flow->icon_color,
            'icon_url' => $flow->icon_url,
        ];
    }
}
