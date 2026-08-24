<?php

namespace App\Services\Flow\Query;

use App\Authorization\AuthorizationContext;
use App\Authorization\AuthorizationContextFactory;
use App\Authorization\OnBehalfOwnerResolver;
use App\Authorization\ScopeEvaluator;
use App\Authorization\Visibility\FlowVisibility;
use App\Authorization\Visibility\FolderVisibility;
use App\Enums\Authorization\Ability;
use App\Models\Flow;
use App\Models\Folder;
use App\Models\User;
use App\Models\WorkspaceTeam;
use App\Services\FeatureFlags\FeatureFlagService;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

final class FlowExplorerQuery
{
    public function __construct(
        private readonly AuthorizationContextFactory $contexts,
        private readonly FlowVisibility $visibility,
        private readonly FolderVisibility $folderVisibility,
        private readonly ScopeEvaluator $scopes,
        private readonly FeatureFlagService $features,
        private readonly FlowTreeBuilder $trees,
        private readonly FlowBreadcrumbBuilder $breadcrumbs,
        private readonly FlowOwnerRoleProjector $roles,
        private readonly OnBehalfOwnerResolver $onBehalfOwners,
    ) {}

    public function render(Request $request, string $workspaceId, User $user): Response
    {
        $context = $this->contexts->for($user, $workspaceId);
        $teamIds = $this->scopes->isAdministrator($context)
            ? WorkspaceTeam::where('workspace_id', $workspaceId)->pluck('id')->all()
            : $context->teamIds;
        /** @var list<string> $teamIds */
        $teamIds = array_values($teamIds);
        $workspaceAllowed = $this->scopes->isAdministrator($context)
            || ($this->features->workspaceSharingEnabled() && $context->isWorkspaceMember);
        $folderId = trim($request->string('folder_id')->toString());
        $search = $request->string('search')->toString();
        $view = $request->string('view')->toString();
        $everywhere = $request->boolean('search_everywhere') && $search !== '';
        $currentFolder = $folderId !== ''
            ? Folder::where('workspace_id', $workspaceId)
                ->where('id', $folderId)
                ->with(['owner:id,name', 'team:id'])
                ->first()
            : null;
        abort_if($folderId !== '' && ! $currentFolder, 404);
        $folderId = $currentFolder?->id;
        if ($currentFolder) {
            abort_unless($user->can(Ability::VIEW->value, $currentFolder), 404);
        }
        $personalOwner = $user;
        if ($view !== 'workspace') {
            // Instance admins can browse another member's personal space.
            $requestedOwnerId = $currentFolder && ! $currentFolder->is_shared
                ? $currentFolder->owner_id
                : null;
            if ($requestedOwnerId === null) {
                $requestedOwnerId = trim($request->string('owner_id')->toString()) ?: null;
            }
            if ($requestedOwnerId !== null) {
                $requestedOwnerId = User::workspaceMemberId($requestedOwnerId, $workspaceId);
                abort_unless($requestedOwnerId !== null, 404);
            }
            $personalOwner = $this->onBehalfOwners->resolveOrFallback($user, $workspaceId, $requestedOwnerId);
        }

        $flows = Flow::query()
            ->select([
                'id', 'name', 'description', 'workspace_id',
                'folder_id', 'workspace_folder_id', 'owner_id', 'is_published',
                'last_run_at', 'updated_at', 'visibility', 'team_id', 'icon_type',
                'icon_value', 'icon_color', 'icon_upload_path', 'library_reference',
            ])
            ->with('team:id')
            ->withCount(['triggers', 'actions']);
        if ($everywhere) {
            $flows->with([
                'owner:id,name',
                'folder:id,name',
                'workspaceFolder:id,name,team_id',
                'workspaceFolder.team:id',
            ]);
            $this->visibility->apply($flows, $context);
            $flows->where(fn ($query) => $query->where('name', 'like', "%{$search}%")
                ->orWhere('description', 'like', "%{$search}%")
                ->orWhere('id', 'like', "%{$search}%"));
            $folders = $this->folders(
                $context,
                $user,
                $personalOwner->id,
                $teamIds,
                $folderId,
                $view,
                $workspaceAllowed,
            );
        } elseif ($view === 'workspace') {
            $flows->whereIn('visibility', ['workspace', 'team'])
                ->with([
                    'owner:id,name',
                    'folder:id,name',
                    'workspaceFolder:id,name,team_id',
                    'workspaceFolder.team:id',
                ]);
            $this->visibility->apply($flows, $context);
            if ($folderId) {
                $flows->where('workspace_folder_id', $folderId);
            } elseif (! $search) {
                $flows->whereNull('workspace_folder_id');
            }
            if ($search) {
                $flows->where(fn ($query) => $query->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('id', 'like', "%{$search}%"));
            }
            $folders = $this->workspaceFolders($context, $user, $teamIds, $folderId, $workspaceAllowed);
        } elseif ($view === 'users') {
            $this->visibility->apply($flows, $context);
            $flows->whereRaw('1 = 0');
            $folders = Folder::query()->whereRaw('1 = 0')->get();
        } else {
            $this->visibility->apply($flows, $context);
            $flows->whereIn('visibility', $this->trees->ownerFallbackVisibilities())
                ->where('owner_id', $personalOwner->id)
                ->with(['owner:id,name', 'folder:id,name', 'workspaceFolder:id,name,team_id']);
            if ($folderId) {
                $flows->where('folder_id', $folderId);
            } elseif (! $search) {
                $flows->whereNull('folder_id');
            }
            if ($search) {
                $flows->where(fn ($query) => $query->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('id', 'like', "%{$search}%"));
            }
            $folders = $this->folders(
                $context,
                $user,
                $personalOwner->id,
                $teamIds,
                $folderId,
                $view,
                $workspaceAllowed,
            );
        }

        $paginated = $flows->latest('updated_at')->paginate(20)->withQueryString();
        $personalTree = $this->trees->personal($workspaceId, $user);
        $userTrees = $this->trees->users($workspaceId, $user);
        $workspaceTree = $this->trees->workspace($workspaceId, $user);
        $teamTrees = $this->trees->teams($workspaceId, $user, $teamIds);
        $canReusePersonalPage = $view !== 'workspace'
            && $view !== 'users'
            && ! $everywhere
            && $personalOwner->id === $user->id
            && $folderId === null
            && $search === ''
            && $paginated->currentPage() === 1
            && $paginated->total() <= $paginated->perPage();
        $rootFlows = $canReusePersonalPage
            ? collect($paginated->items())->sortBy('name')->values()
            : $this->personalRootFlows($context, $user);
        $workspaceRootFlows = $workspaceAllowed ? $this->workspaceRootFlows($context) : collect();

        $combinedTrees = [...$workspaceTree, ...$teamTrees];
        $this->roles->projectTrees(
            $workspaceId,
            $combinedTrees,
            $paginated->items(),
            $rootFlows,
            $workspaceRootFlows,
        );
        $workspaceCount = count($workspaceTree);
        $workspaceTree = array_slice($combinedTrees, 0, $workspaceCount);
        $teamTrees = array_slice($combinedTrees, $workspaceCount);
        $this->roles->projectTrees($workspaceId, $userTrees);

        return Inertia::render('Flow/FlowExplorer/FlowExplorer', [
            'flows' => $paginated,
            'folders' => $folders,
            'currentFolder' => $currentFolder,
            'breadcrumbs' => $this->breadcrumbs->folders($currentFolder),
            'folderTree' => $personalTree,
            'userTrees' => $userTrees,
            'workspaceTree' => $workspaceTree,
            'teamTrees' => $teamTrees,
            'rootFlows' => $rootFlows,
            'workspaceRootFlows' => $workspaceRootFlows,
            'filters' => [
                'search' => $search,
                'folder_id' => $currentFolder?->id,
                'view' => $view,
                'owner_id' => $personalOwner->id === $user->id ? null : $personalOwner->id,
                'search_everywhere' => $everywhere ? '1' : null,
            ],
            'personalOwner' => [
                'id' => $personalOwner->id,
                'name' => $personalOwner->name,
            ],
        ]);
    }

    /**
     * @param  list<string>  $teamIds
     * @return Collection<int, Folder>
     */
    private function folders(
        AuthorizationContext $context,
        User $user,
        string $ownerId,
        array $teamIds,
        ?string $folderId,
        string $view,
        bool $workspaceAllowed,
    ): Collection {
        if ($view === 'workspace') {
            return $this->workspaceFolders($context, $user, $teamIds, $folderId, $workspaceAllowed);
        }

        $folders = Folder::query()->with('team:id');
        $this->folderVisibility->apply($folders, $context);
        $folders->personal()
            ->where('owner_id', $ownerId)
            ->where('parent_id', $folderId);

        return $folders->orderBy('sort_order')->get();
    }

    /**
     * @param  list<string>  $teamIds
     * @return Collection<int, Folder>
     */
    private function workspaceFolders(
        AuthorizationContext $context,
        User $user,
        array $teamIds,
        ?string $folderId,
        bool $workspaceAllowed,
    ): Collection {
        if ($folderId) {
            $folderQuery = Folder::query()->with('team:id');
            $this->folderVisibility->apply($folderQuery, $context);
            $folder = $folderQuery->find($folderId);
            if ($folder && $folder->team_id) {
                $children = Folder::query()->with('team:id');
                $this->folderVisibility->apply($children, $context);

                return $user->can(Ability::VIEW->value, $folder)
                    ? $children->teamScope($folder->team_id)
                        ->where('parent_id', $folderId)->orderBy('sort_order')->get()
                    : collect();
            }

            $children = Folder::query()->with('team:id');
            $this->folderVisibility->apply($children, $context);

            return $workspaceAllowed
                ? $children->workspaceScope()
                    ->where('parent_id', $folderId)->with('owner:id,name')->orderBy('sort_order')->get()
                : collect();
        }

        $workspaceQuery = Folder::query()->with('team:id');
        $this->folderVisibility->apply($workspaceQuery, $context);
        $workspace = $workspaceAllowed
            ? $workspaceQuery->workspaceScope()->whereNull('parent_id')
                ->with('owner:id,name')->orderBy('sort_order')->get()
            : collect();
        $teamsQuery = Folder::query()->with('team:id');
        $this->folderVisibility->apply($teamsQuery, $context);
        $teams = $teamsQuery->where('is_shared', true)
            ->whereNotNull('team_id')->whereIn('team_id', $teamIds)->whereNull('parent_id')
            ->orderBy('name')->get();

        return $teams->concat($workspace)->values();
    }

    /** @return Collection<int, Flow> */
    private function personalRootFlows(AuthorizationContext $context, User $user): Collection
    {
        $query = Flow::query();
        $this->visibility->apply($query, $context);

        $query->whereIn('visibility', $this->trees->ownerFallbackVisibilities())
            ->where('owner_id', $user->id)
            ->whereNull('folder_id');

        return $query
            ->orderBy('name')
            ->get($this->treeColumns());
    }

    /** @return Collection<int, Flow> */
    private function workspaceRootFlows(AuthorizationContext $context): Collection
    {
        $query = Flow::query();
        $this->visibility->apply($query, $context);

        return $query->where('visibility', 'workspace')
            ->whereNull('workspace_folder_id')
            ->orderBy('name')
            ->get($this->treeColumns());
    }

    /** @return list<string> */
    private function treeColumns(): array
    {
        return [
            'id', 'name', 'visibility', 'folder_id',
            'workspace_folder_id', 'owner_id', 'team_id', 'icon_type',
            'icon_value', 'icon_color', 'icon_upload_path', 'library_reference',
        ];
    }
}
