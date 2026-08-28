<?php

namespace App\Services\Flow\Query;

use App\Authorization\AuthorizationContextFactory;
use App\Authorization\ScopeEvaluator;
use App\Authorization\Visibility\FlowVisibility;
use App\Authorization\Visibility\SharedResourceVisibility;
use App\DTO\Library\LibraryFlowItem;
use App\Enums\Authorization\Ability;
use App\Models\Flow;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceProxy;
use App\Models\WorkspaceTeam;
use App\Services\Library\BlueprintInputSchemaService;
use App\Services\Library\LibraryCatalogService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class FlowEditorQuery
{
    public function __construct(
        private readonly AuthorizationContextFactory $contexts,
        private readonly ScopeEvaluator $scopes,
        private readonly FlowVisibility $visibility,
        private readonly SharedResourceVisibility $sharedResources,
        private readonly FlowTreeBuilder $trees,
        private readonly FlowBreadcrumbBuilder $breadcrumbs,
        private readonly FlowOwnerRoleProjector $roles,
        private readonly FlowRunProjection $runs,
        private readonly FlowEditorResourceProjection $resources,
        private readonly LibraryCatalogService $catalog,
        private readonly BlueprintInputSchemaService $inputSchemas,
    ) {}

    public function render(Request $request, Flow $flow, User $user): Response
    {
        $canEdit = $user->can(Ability::UPDATE->value, $flow);
        $canViewRuns = $user->can(Ability::VIEW_RUNS->value, $flow);
        $workspace = $flow->workspace;
        if (! $workspace instanceof Workspace) {
            throw new \LogicException('Flow workspace could not be resolved.');
        }
        $context = $this->contexts->for($user, $flow->workspace_id);
        $teamIds = $this->scopes->isAdministrator($context)
            ? WorkspaceTeam::where('workspace_id', $flow->workspace_id)->pluck('id')->all()
            : $context->teamIds;
        /** @var list<string> $teamIds */
        $teamIds = array_values($teamIds);

        $flow->load([
            'owner:id,name', 'folder:id,name,parent_id,owner_id,is_shared,team_id',
            'workspaceFolder:id,name,parent_id,owner_id,is_shared,team_id', 'team:id,name',
            'repositoryLink.integration',
            'publishedVersion:id,version',
        ]);
        $flow->setAttribute('published_version_number', $flow->publishedVersion?->version);
        $flow->owner_workspace_role = $this->roles->one($flow->owner_id, $flow->workspace_id);
        $this->libraryState($flow);
        $runData = $this->runs->get($request, $flow, $user, $canViewRuns);

        $siblings = Flow::query();
        $this->visibility->apply($siblings, $context);
        $siblings->where('id', '!=', $flow->id)->orderBy('name');
        if (in_array($flow->visibility, ['workspace', 'team'], true)) {
            $siblings->where('workspace_folder_id', $flow->workspace_folder_id)
                ->where('visibility', $flow->visibility);
            if ($flow->visibility === 'team') {
                $siblings->where('team_id', $flow->team_id);
            }
        } else {
            $siblings->where('folder_id', $flow->folder_id)->where('visibility', 'owner')
                ->where('owner_id', $flow->owner_id);
        }
        $resourceData = $this->resources->get($flow, $user, $context, $teamIds, $canEdit);
        /** @var \Illuminate\Database\Eloquent\Builder<WorkspaceProxy> $workspaceProxies */
        $workspaceProxies = WorkspaceProxy::query()->orderBy('label');
        $this->sharedResources->applyUse(
            $workspaceProxies,
            $context,
            scopeColumn: 'visibility',
        );

        return Inertia::render('Flow/FlowEditor/FlowEditor', [
            'flow' => $flow,
            'stats' => $runData['stats'],
            'runs' => $runData['runs'],
            'breadcrumbs' => $this->breadcrumbs->flow($flow),
            'siblingFlows' => $siblings->get([
                'id', 'name', 'icon_type', 'icon_value',
                'icon_color', 'icon_upload_path', 'library_reference', 'updated_at',
            ]),
            'canEdit' => $canEdit,
            'canManageWorkspaceProxies' => $user->can(Ability::UPDATE->value, $workspace),
            'workspaceProxies' => $workspaceProxies
                ->get(['id', 'label', 'scheme', 'host', 'port'])
                ->map(fn ($proxy) => [
                    'id' => $proxy->id,
                    'label' => $proxy->label,
                    'scheme' => $proxy->scheme,
                    'host' => $proxy->host,
                    'port' => $proxy->port,
                ])
                ->values(),
            ...$resourceData,
            'personalTree' => $this->trees->personal($flow->workspace_id, $user),
            'workspaceTree' => $this->trees->workspace($flow->workspace_id, $user),
            'teamTrees' => $this->trees->teams($flow->workspace_id, $user, $teamIds),
        ]);
    }

    public function libraryState(Flow $flow, bool $refresh = false): ?LibraryFlowItem
    {
        $latest = null;
        if ($flow->library_namespace && $flow->library_reference) {
            $latest = $this->catalog->findChild(
                'flow',
                $flow->library_namespace,
                $flow->library_reference,
                refresh: $refresh,
                workspaceId: $flow->workspace_id,
                userId: request()->user()?->id,
                catalogKey: $flow->library_external_key,
            );
        }
        $item = $latest instanceof LibraryFlowItem ? $latest : null;
        $sha = $item?->sourceSha;
        if ($flow->library_namespace && $flow->blueprint_input_definitions === null) {
            $schemaIsKnown = $flow->flow_type === 'code' || (
                $item !== null
                && $flow->library_source_sha
                && $flow->library_source_sha === $item->sourceSha
            );
            if ($schemaIsKnown) {
                // Lazy backfill for flows created before the schema column existed.
                $definitions = $this->inputSchemas->currentDefinitions($flow, $item);
                Flow::query()->whereKey($flow->getKey())->toBase()
                    ->update(['blueprint_input_definitions' => json_encode($definitions)]);
                $flow->setAttribute('blueprint_input_definitions', $definitions);
            }
        }
        $flow->setAttribute('library_latest_source_sha', $sha);
        $flow->setAttribute('library_update_available', (bool) (
            $sha && $flow->library_source_sha && $sha !== $flow->library_source_sha
        ));

        return $item;
    }
}
