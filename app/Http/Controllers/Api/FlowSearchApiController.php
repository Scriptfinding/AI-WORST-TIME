<?php

/*
 * Explicit proprietary scope: the paid team/workspace visibility and replay fields in this file implement paid
 * Puppetflow features and are licensed under the Puppetflow Proprietary License.
 * See LICENSE_PROPRIETARY.md.
 */

namespace App\Http\Controllers\Api;

use App\Authorization\Visibility\FlowVisibility;
use App\Authorization\Visibility\FolderVisibility;
use App\Http\Controllers\Api\Concerns\ResolvesFlow;
use App\Http\Controllers\Controller;
use App\Models\Flow;
use App\Models\FlowRun;
use App\Models\Folder;
use App\Models\User;
use App\Models\Workspace;
use App\Services\Flow\FlowRunSearchService;
use App\Services\Library\BlueprintInputSchemaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class FlowSearchApiController extends Controller
{
    use ResolvesFlow;

    public function __construct(
        private readonly FlowRunSearchService $runSearch,
        private readonly FlowVisibility $flowVisibility,
        private readonly FolderVisibility $folderVisibility,
        private readonly BlueprintInputSchemaService $inputSchemas,
    ) {}

    public function flows(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $query = Flow::query()
            ->with(['folder:id', 'workspaceFolder:id'])
            ->select(['id', 'name', 'description', 'flow_type', 'folder_id', 'workspace_folder_id', 'is_published', 'queue_index', 'default_inputs', 'updated_at']);
        $this->flowVisibility->applyForUser($query, $user);

        if ($search = $request->string('search')->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('id', 'like', "%{$search}%");
            });
        }

        if ($name = $request->string('name')->toString()) {
            $query->where('name', 'like', "%{$name}%");
        }

        $flowType = $request->input('flow_type', $request->input('type'));
        if ($flowType) {
            $query->where('flow_type', $flowType);
        }

        $folderId = trim($request->string('folder_id')->toString());
        if ($folderId !== '') {
            $folderQuery = Folder::query()
                ->where('id', $folderId);
            $this->folderVisibility->applyForUser($folderQuery, $user);
            $folder = $folderQuery->first();
            abort_unless($folder instanceof Folder, 404);
            $query->where(function ($query) use ($folder): void {
                $query->where('folder_id', $folder->id)
                    ->orWhere('workspace_folder_id', $folder->id);
            });
        }

        $limit = min(max($request->integer('limit', 50), 1), 100);
        $flows = $query->orderBy('name')->limit($limit)->get();

        return response()->json($flows->map(fn (Flow $flow): array => [
            'id' => $flow->id,
            'name' => $flow->name,
            'description' => $flow->description,
            'flow_type' => $flow->flow_type,
            'folder_id' => $flow->folder?->id,
            'workspace_folder_id' => $flow->workspaceFolder?->id,
            'is_published' => (bool) $flow->is_published,
            'queue_index' => $flow->queue_index,
            'default_inputs' => $flow->default_inputs,
            'updated_at' => $flow->updated_at,
        ])->values());
    }

    public function searchRuns(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $requestedWorkspaceId = trim($request->string('workspace_id')->toString());
        $workspaceId = null;
        if ($requestedWorkspaceId !== '') {
            $workspace = Workspace::whereKey($requestedWorkspaceId)->first();
            abort_unless($workspace instanceof Workspace, 404);
            $workspaceId = $workspace->id;
        }
        $query = $this->runSearch->visibleRunsQuery($user, $workspaceId);

        $flowId = trim($request->string('flow_id')->toString());
        if ($flowId !== '') {
            $flow = $this->resolveFlow($flowId, $user);

            if (! $flow) {
                return response()->json(['error' => 'Flow not found.'], 404);
            }

            if (! $this->canAccessFlow($user, $flow)) {
                return response()->json(['error' => 'Forbidden.'], 403);
            }

            $query->where('flow_id', $flow->id);
        }

        $this->runSearch->applyFiltersFromRequest($query, $request);

        $perPage = min(max($request->integer('per_page', 50), 1), 100);
        $paginated = $query->paginate($perPage);

        $this->applyVisibleRunFields($request, $paginated->getCollection());

        return response()->json($paginated);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $flow = $this->resolveFlow($id, $user);

        if (! $flow) {
            return response()->json(['error' => 'Flow not found.'], 404);
        }

        if (! $this->canAccessFlow($user, $flow)) {
            return response()->json(['error' => 'Forbidden.'], 403);
        }
        $flow->loadMissing([
            'folder:id',
            'workspaceFolder:id',
            'workspace:id',
            'team:id',
            'owner:id',
        ]);

        return response()->json([
            'id' => $flow->id,
            'name' => $flow->name,
            'description' => $flow->description,
            'readme' => $flow->readme,
            'code' => $flow->code,
            'source_type' => $flow->source_type,
            'flow_type' => $flow->flow_type,
            'nodal_graph' => $flow->nodal_graph,
            'folder_id' => $flow->folder?->id,
            'workspace_folder_id' => $flow->workspaceFolder?->id,
            'workspace_id' => $flow->workspace?->id,
            'team_id' => $flow->team?->id,
            'owner_id' => $flow->owner?->id,
            'is_published' => $flow->is_published,
            'queue_index' => $flow->queue_index,
            'visibility' => $flow->visibility,
            'manual_input' => $flow->manual_input,
            'default_inputs' => $flow->default_inputs,
            'input_definitions' => $this->inputSchemas->currentDefinitions($flow),
            'timeout_seconds' => $flow->timeout_seconds,
            'operator_seconds' => $flow->operator_seconds,
            'max_retries' => $flow->max_retries,
            'include_raw_output' => $flow->include_raw_output,
            'include_input_in_output' => $flow->include_input_in_output,
            'include_context_in_output' => $flow->include_context_in_output,
            'always_success_response' => $flow->always_success_response,
            'export_artifacts_screenshots' => $flow->export_artifacts_screenshots,
            'export_artifacts_downloads' => $flow->export_artifacts_downloads,
            'export_artifacts_recording' => $flow->export_artifacts_recording,
            'runs_retention_limit' => $flow->runs_retention_limit,
            'viewport_width' => $flow->viewport_width,
            'viewport_height' => $flow->viewport_height,
            'keyboard_speed' => $flow->keyboard_speed,
            'disable_web_security' => $flow->disable_web_security,
            'library_locked' => $flow->library_locked,
            'library_namespace' => $flow->library_namespace,
            'library_reference' => $flow->library_reference,
            'library_source_path' => $flow->library_source_path,
            'library_source_sha' => $flow->library_source_sha,
            'library_source_url' => $flow->library_source_url,
            'library_imported_at' => $flow->library_imported_at,
            'last_run_at' => $flow->last_run_at,
            'icon_type' => $flow->icon_type,
            'icon_value' => $flow->icon_value,
            'icon_color' => $flow->icon_color,
            'cover_color' => $flow->cover_color,
            'icon_url' => $flow->icon_url,
            'created_at' => $flow->created_at,
            'updated_at' => $flow->updated_at,
        ]);
    }

    public function runs(Request $request, string $id): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $flow = $this->resolveFlow($id, $user);

        if (! $flow) {
            return response()->json(['error' => 'Flow not found.'], 404);
        }

        if (! $this->canAccessFlow($user, $flow)) {
            return response()->json(['error' => 'Forbidden.'], 403);
        }

        $query = $this->runSearch->visibleRunsQuery($user, $flow->workspace_id)
            ->where('flow_id', $flow->id)
            ->with('trigger:id')
            ->select(['id', 'flow_id', 'trigger_id', 'status', 'duration_ms', 'legend', 'resolved_secrets', 'created_at']);

        if ($search = $request->string('search')->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('id', 'like', "%{$search}%")
                    ->orWhere('status', 'like', "%{$search}%");
            });
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        /** @var \Illuminate\Database\Eloquent\Collection<int, FlowRun> $runs */
        $runs = $query->limit(50)->get();
        $runs->each(fn (FlowRun $run) => $run->redactSecretsForClient());

        return response()->json($runs);
    }

    public function folders(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $query = Folder::query()
            ->with('parent:id')
            ->select(['id', 'name', 'parent_id', 'is_shared']);
        $this->folderVisibility->applyForUser($query, $user);

        if ($search = $request->string('search')->toString()) {
            $query->where('name', 'like', "%{$search}%");
        }

        $folders = $query->orderBy('name')->get();

        return response()->json($folders->map(fn (Folder $folder): array => [
            'id' => $folder->id,
            'name' => $folder->name,
            'parent_id' => $folder->parent?->id,
            'is_shared' => (bool) $folder->is_shared,
        ])->values());
    }

    /**
     * @param  Collection<int, FlowRun>  $runs
     */
    private function applyVisibleRunFields(Request $request, Collection $runs): void
    {
        $makeVisible = [];
        if ($request->boolean('logs')) {
            $makeVisible[] = 'console_logs';
        }
        if ($request->boolean('code')) {
            $makeVisible[] = 'code_snapshot';
        }

        $runs->each(function (FlowRun $run) use ($makeVisible) {
            $run->redactSecretsForClient();
            if ($makeVisible !== []) {
                $run->makeVisible($makeVisible);
            }
        });
    }
}
