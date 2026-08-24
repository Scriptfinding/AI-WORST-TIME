<?php

namespace App\Services\Workspace;

use App\DTO\Workspace\WorkspaceMutationData;
use App\Enums\Authorization\Ability;
use App\Models\User;
use App\Models\Workspace;
use App\Services\FeatureFlags\FeatureFlagService;
use App\Services\Workspace\Identity\IdentityMutex;
use App\Services\Workspace\Identity\IdentityRows;
use App\Services\Workspace\Identity\IdentityTransaction;
use App\Services\Workspace\Identity\WorkspaceMembershipStore;
use App\Services\Workspace\Identity\WorkspaceMutationAuthorizer;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class WorkspaceProvisioner
{
    public function __construct(
        private readonly IdentityTransaction $transactions,
        private readonly IdentityMutex $mutex,
        private readonly IdentityRows $rows,
        private readonly WorkspaceMembershipStore $memberships,
        private readonly WorkspaceMutationAuthorizer $authorizer,
        private readonly FeatureFlagService $features,
    ) {}

    public function create(
        User $owner,
        WorkspaceMutationData $data,
        ?User $actor = null,
        bool $enforceLimit = true,
    ): Workspace {
        return $this->transactions->run(function () use ($owner, $data, $actor, $enforceLimit): Workspace {
            if ($enforceLimit) {
                $this->mutex->lock('workspace-quota');
            }

            $lockedUsers = $this->rows->users([$actor?->id, $owner->id])->keyBy('id');
            /** @var User $lockedOwner */
            $lockedOwner = $lockedUsers->get($owner->id);
            /** @var User|null $lockedActor */
            $lockedActor = $actor === null ? null : $lockedUsers->get($actor->id);
            $this->authorizeCreate($lockedActor);

            if ($enforceLimit) {
                $this->features->abortIfWorkspaceLimitReached();
            }

            return $this->insert($lockedOwner, $data);
        });
    }

    public function ensureOwned(
        User $owner,
        WorkspaceMutationData $data,
        ?User $actor = null,
        bool $enforceLimit = false,
    ): Workspace {
        return $this->transactions->run(function () use ($owner, $data, $actor, $enforceLimit): Workspace {
            $keys = ['personal-workspace:'.$owner->id];
            if ($enforceLimit) {
                $keys[] = 'workspace-quota';
            }
            $this->mutex->lock(...$keys);

            $lockedUsers = $this->rows->users([$actor?->id, $owner->id])->keyBy('id');
            /** @var User $lockedOwner */
            $lockedOwner = $lockedUsers->get($owner->id);
            $existing = Workspace::query()
                ->select('workspaces.*')
                ->join('user_workspace', 'user_workspace.workspace_id', '=', 'workspaces.id')
                ->where('user_workspace.user_id', $lockedOwner->id)
                ->orderBy('workspaces.id')
                ->first();

            if ($existing !== null) {
                return $existing;
            }

            /** @var User|null $lockedActor */
            $lockedActor = $actor === null ? null : $lockedUsers->get($actor->id);
            $this->authorizeCreate($lockedActor);

            if ($enforceLimit) {
                $this->features->abortIfWorkspaceLimitReached();
            }

            return $this->insert($lockedOwner, $data);
        });
    }

    public function upsertByLookupKey(
        User $owner,
        WorkspaceMutationData $data,
        User $actor,
    ): Workspace {
        $lookupKey = $data->lookupKey;

        if (! is_string($lookupKey) || $lookupKey === '') {
            return $this->create($owner, $data, $actor);
        }

        return $this->transactions->run(function () use ($owner, $data, $actor, $lookupKey): Workspace {
            $this->mutex->lock('lookup:'.$lookupKey, 'workspace-quota');
            $lockedUsers = $this->rows->users([$actor->id, $owner->id])->keyBy('id');
            /** @var User $lockedActor */
            $lockedActor = $lockedUsers->get($actor->id);
            /** @var User $lockedOwner */
            $lockedOwner = $lockedUsers->get($owner->id);
            $existing = Workspace::query()->where('lookup_key', $lookupKey)->first();

            if ($existing !== null) {
                $lockedWorkspace = $this->rows->workspaces([$existing->id])->firstOrFail();
                $this->authorizer->workspace($lockedActor, Ability::UPDATE, $lockedWorkspace);
                $lockedWorkspace->forceFill($data->toArray())->save();

                return $lockedWorkspace->refresh();
            }

            $this->authorizeCreate($lockedActor);
            $this->features->abortIfWorkspaceLimitReached();
            if (! $data->hasName() || trim($data->name ?? '') === '') {
                throw ValidationException::withMessages([
                    'name' => 'The name field is required when creating a workspace.',
                ]);
            }

            return $this->insert($lockedOwner, $data);
        });
    }

    public function update(Workspace $workspace, WorkspaceMutationData $data): Workspace
    {
        $workspace->forceFill($data->toArray())->save();

        return $workspace->refresh();
    }

    public function transferOwnership(
        Workspace $workspace,
        User $newOwner,
        ?User $actor = null,
    ): Workspace {
        return $this->transactions->run(function () use ($workspace, $newOwner, $actor): Workspace {
            $lockedUsers = $this->rows->users([$actor?->id, $newOwner->id])->keyBy('id');
            $lockedWorkspace = $this->rows->workspaces([$workspace->id])->firstOrFail();
            /** @var User|null $lockedActor */
            $lockedActor = $actor === null ? null : $lockedUsers->get($actor->id);
            $this->authorizer->workspace($lockedActor, Ability::TRANSFER_OWNERSHIP, $lockedWorkspace);
            $this->memberships->upsert($lockedWorkspace->id, $newOwner->id, 'admin');
            $lockedWorkspace->forceFill(['owner_id' => $newOwner->id])->save();

            return $lockedWorkspace->refresh();
        });
    }

    private function authorizeCreate(?User $actor): void
    {
        $this->authorizer->create($actor);
    }

    private function insert(User $owner, WorkspaceMutationData $data): Workspace
    {
        $attributes = $data->toArray();

        if (empty($attributes['slug'])) {
            $slugBase = Str::slug((string) ($attributes['name'] ?? 'workspace')) ?: 'workspace';
            $attributes['slug'] = Str::limit($slugBase, 220, '')
                .'-'.Str::lower(Str::random(12));
        }

        $workspace = Workspace::create([
            ...$attributes,
            'owner_id' => $owner->id,
        ]);
        $this->memberships->upsert($workspace->id, $owner->id, 'admin');

        return $workspace->refresh();
    }
}
