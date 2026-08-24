<?php

namespace App\Services\Flow;

use App\Authorization\ResourceAssignmentValidator;
use App\Enums\Authorization\Ability;
use App\Models\Flow;
use App\Services\Storage\RunArtifactStorage;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Gate;

final class FlowPlacementService
{
    public function __construct(
        private readonly ResourceAssignmentValidator $assignments,
        private readonly RunArtifactStorage $artifacts,
    ) {}

    /**
     * @param array{
     *   visibility: string, owner_id?: string, team_id?: string|null,
     *   folder_id?: string|null, workspace_folder_id?: string|null
     * } $validated
     */
    public function updateVisibility(Flow $flow, array $validated): void
    {
        $visibility = $validated['visibility'];
        $ownerId = $validated['owner_id'] ?? $flow->owner_id;
        $update = ['visibility' => $visibility, 'folder_id' => null, 'workspace_folder_id' => null, 'team_id' => null];
        if ($visibility === 'owner') {
            $update['folder_id'] = $validated['folder_id'] ?? $flow->folder_id;
        } elseif ($visibility === 'workspace') {
            $update['workspace_folder_id'] = $validated['workspace_folder_id'] ?? null;
        } elseif ($visibility === 'team') {
            $update['team_id'] = $validated['team_id'] ?? null;
            $update['workspace_folder_id'] = $validated['workspace_folder_id'] ?? null;
        }
        if ($ownerId !== $flow->owner_id) {
            Gate::authorize(Ability::TRANSFER_OWNERSHIP->value, $flow);
            $update['owner_id'] = $ownerId;
            if ($visibility === 'owner') {
                // Never fall back to the previous owner's folder: it would
                // fail assignment validation against the new owner.
                $update['folder_id'] = $validated['folder_id'] ?? null;
            }
        }
        if ($this->changed($flow, $update)) {
            Gate::authorize(Ability::MANAGE_SCOPE->value, $flow);
        }
        $this->assignments->validate(
            $flow->workspace_id,
            $ownerId,
            $visibility,
            $update['team_id'],
            $update['folder_id'],
            $update['workspace_folder_id'],
        );
        $this->update($flow, $update);
    }

    /**
     * @param array{
     *   scope?: string, team_id?: string|null, folder_id?: string|null,
     *   workspace_folder_id?: string|null, change_visibility?: bool
     * } $validated
     */
    public function move(Flow $flow, array $validated, bool $changeVisibility): void
    {
        $scope = $validated['scope'] ?? 'owner';
        $mismatch = $flow->visibility !== $scope
            || ($scope === 'team' && $flow->team_id !== ($validated['team_id'] ?? null));
        if ($mismatch && ! $changeVisibility) {
            abort(422, 'Visibility must be changed when moving to a folder with a different scope.');
        }
        $visibility = $changeVisibility ? $scope : $flow->visibility;
        $update = in_array($scope, ['workspace', 'team'], true)
            ? [
                'workspace_folder_id' => $validated['workspace_folder_id'] ?? null,
                'folder_id' => $changeVisibility ? null : $flow->folder_id,
                'visibility' => $visibility,
                'team_id' => $visibility === 'team' ? ($validated['team_id'] ?? $flow->team_id) : null,
            ]
            : [
                'folder_id' => $validated['folder_id'] ?? null,
                'workspace_folder_id' => $changeVisibility ? null : $flow->workspace_folder_id,
                'visibility' => $visibility,
                'team_id' => $changeVisibility ? null : $flow->team_id,
            ];
        if ($this->changed($flow, $update)) {
            Gate::authorize(Ability::MANAGE_SCOPE->value, $flow);
        }
        $this->assignments->validate(
            $flow->workspace_id,
            $flow->owner_id,
            $update['visibility'],
            $update['team_id'],
            $update['folder_id'],
            $update['workspace_folder_id'],
        );
        $flow->update($update);
    }

    /** @param array<string, mixed> $attributes */
    public function update(Flow $flow, array $attributes): void
    {
        $oldOwner = $flow->owner_id;
        $newOwner = $oldOwner;
        if (array_key_exists('owner_id', $attributes)) {
            $ownerId = $attributes['owner_id'];
            if (! is_string($ownerId)) {
                throw new \InvalidArgumentException('Flow owner ID must be a string.');
            }
            $newOwner = $ownerId;
        }
        $operation = function () use ($flow, $attributes, $oldOwner, $newOwner): void {
            $moved = false;
            try {
                if ($newOwner !== $oldOwner) {
                    if ($flow->runs()->whereIn('status', ['pending', 'running'])->exists()) {
                        throw \Illuminate\Validation\ValidationException::withMessages([
                            'owner_id' => 'Flow ownership cannot be transferred while a run is active.',
                        ]);
                    }
                    $moved = $this->artifacts->moveFlowToOwner($flow, $oldOwner, $newOwner);
                }
                if (! $flow->update($attributes)) {
                    throw new \RuntimeException('Unable to update flow.');
                }
            } catch (\Throwable $exception) {
                if ($moved) {
                    try {
                        $this->artifacts->moveFlowToOwner($flow, $newOwner, $oldOwner);
                    } catch (\Throwable $rollback) {
                        report($rollback);
                    }
                }
                throw $exception;
            }
        };
        if ($newOwner !== $oldOwner) {
            Cache::lock(RunArtifactStorage::flowLockName($flow), 300)->block(30, $operation);
        } else {
            $operation();
        }
    }

    /**
     * @param array{
     *   visibility: string, team_id: string|null, folder_id: string|null,
     *   workspace_folder_id: string|null, owner_id?: string
     * } $update
     */
    private function changed(Flow $flow, array $update): bool
    {
        return $update['visibility'] !== $flow->visibility
            || ($update['team_id'] ?? null) !== $flow->team_id
            || ($update['folder_id'] ?? null) !== $flow->folder_id
            || ($update['workspace_folder_id'] ?? null) !== $flow->workspace_folder_id;
    }
}
