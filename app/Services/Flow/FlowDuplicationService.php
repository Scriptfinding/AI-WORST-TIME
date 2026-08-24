<?php

namespace App\Services\Flow;

use App\Authorization\AuthorizationContextFactory;
use App\Authorization\ResourceAssignmentValidator;
use App\Authorization\Visibility\SharedResourceVisibility;
use App\Models\Flow;
use App\Models\User;
use App\Models\WorkspaceProxy;
use App\Services\Storage\UploadStorage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class FlowDuplicationService
{
    public function __construct(
        private readonly ResourceAssignmentValidator $assignments,
        private readonly AuthorizationContextFactory $contexts,
        private readonly SharedResourceVisibility $visibility,
        private readonly UploadStorage $uploads,
    ) {}

    /**
     * @param array{
     *   name?: string, description?: string|null, visibility?: string,
     *   folder_id?: string|null, workspace_folder_id?: string|null, team_id?: string|null
     * } $validated
     */
    public function duplicate(Flow $flow, User $user, string $workspaceId, array $validated): Flow
    {
        if ($workspaceId < 0) {
            throw new \LogicException('Workspace has an invalid identifier.');
        }
        $visibility = $validated['visibility'] ?? $flow->visibility;
        $copy = $flow->replicate([
            'id',
            'last_run_result',
            'last_run_at',
            'published_version_id',
            'blueprint_input_definitions',
        ]);
        $copy->manual_run_score = $flow->manual_run_score;
        $copy->manual_run_production_mode = $flow->manual_run_production_mode;
        $copy->manual_run_score_state = $flow->manual_run_score_state;
        $copy->manual_run_score_updated_at = $flow->manual_run_score_updated_at;
        $copy->name = $validated['name'] ?? ($flow->name.' (copy)');
        if (array_key_exists('description', $validated)) {
            $copy->description = $validated['description'];
        }
        $copy->workspace_id = $workspaceId;
        if ($user->id < 0) {
            throw new \LogicException('Authenticated user has an invalid identifier.');
        }
        $copy->owner_id = $user->id;
        $copy->visibility = $visibility;
        if ($visibility === 'owner') {
            $copy->folder_id = array_key_exists('folder_id', $validated)
                ? $validated['folder_id']
                : ($flow->visibility === 'owner' && $flow->owner_id === $user->id ? $flow->folder_id : null);
            $copy->workspace_folder_id = null;
            $copy->team_id = null;
        } elseif ($visibility === 'workspace') {
            $copy->folder_id = null;
            $copy->workspace_folder_id = array_key_exists('workspace_folder_id', $validated)
                ? $validated['workspace_folder_id']
                : ($flow->visibility === 'workspace' ? $flow->workspace_folder_id : null);
            $copy->team_id = null;
        } else {
            $copy->folder_id = null;
            $copy->workspace_folder_id = array_key_exists('workspace_folder_id', $validated)
                ? $validated['workspace_folder_id']
                : ($flow->visibility === 'team' ? $flow->workspace_folder_id : null);
            $copy->team_id = array_key_exists('team_id', $validated)
                ? $validated['team_id']
                : ($flow->visibility === 'team' ? $flow->team_id : null);
        }
        $copy->icon_upload_path = null;
        $copy->source_type = 'code';
        foreach ([
            'library_external_id', 'library_external_key', 'library_namespace',
            'library_reference', 'library_source_path', 'library_source_sha',
            'library_source_url', 'library_imported_at',
        ] as $attribute) {
            $copy->{$attribute} = null;
        }
        DB::transaction(function () use ($copy, $user, $workspaceId): void {
            if ($copy->proxy_mode === 'specific') {
                $proxyQuery = WorkspaceProxy::query()->whereKey($copy->workspace_proxy_id);
                $this->visibility->applyUse(
                    $proxyQuery,
                    $this->contexts->for($user, $workspaceId),
                    scopeColumn: 'visibility',
                );
                if (! $proxyQuery->lockForUpdate()->first() instanceof WorkspaceProxy) {
                    $copy->proxy_mode = 'none';
                    $copy->workspace_proxy_id = null;
                }
            }
            $this->assignments->validate(
                $workspaceId,
                $copy->owner_id,
                $copy->visibility,
                $copy->team_id === null ? null : $copy->team_id,
                $copy->folder_id === null ? null : $copy->folder_id,
                $copy->workspace_folder_id === null ? null : $copy->workspace_folder_id,
            );
            $copy->save();
        }, 3);

        if ($flow->icon_type === 'upload' && $flow->icon_upload_path && $this->uploads->exists($flow->icon_upload_path)) {
            $extension = pathinfo($flow->icon_upload_path, PATHINFO_EXTENSION);
            $filename = $copy->iconUploadDir().'/'.Str::random(40).'.'.$extension;
            $this->uploads->copy($flow->icon_upload_path, $filename);
            $copy->update(['icon_upload_path' => $filename]);
        }

        return $copy;
    }
}
