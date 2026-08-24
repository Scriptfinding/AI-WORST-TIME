<?php

namespace App\Policies\Shared;

use App\Authorization\AuthorizationContextFactory;
use App\Authorization\ScopeEvaluator;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

abstract class ScopedResourcePolicy
{
    public function __construct(
        protected readonly AuthorizationContextFactory $contexts,
        protected readonly ScopeEvaluator $scopes,
    ) {}

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Model $resource): bool
    {
        return $this->scopes->canView(
            $this->context($user, $resource),
            $this->workspaceId($resource),
            $this->ownerId($resource),
            $this->scope($resource),
            $this->teamId($resource),
        );
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Model $resource): bool
    {
        return $this->scopes->canManage(
            $this->context($user, $resource),
            $this->workspaceId($resource),
            $this->ownerId($resource),
        );
    }

    public function delete(User $user, Model $resource): bool
    {
        return $this->update($user, $resource);
    }

    public function manage(User $user, Model $resource): bool
    {
        return $this->update($user, $resource);
    }

    public function manageScope(User $user, Model $resource): bool
    {
        return $this->update($user, $resource);
    }

    public function transferOwnership(User $user, Model $resource): bool
    {
        return $this->update($user, $resource);
    }

    public function use(User $user, Model $resource): bool
    {
        return $this->scopes->canUse(
            $this->context($user, $resource),
            $this->workspaceId($resource),
            $this->ownerId($resource),
            $this->scope($resource),
            $this->teamId($resource),
        );
    }

    protected function ownerColumn(): string
    {
        return 'user_id';
    }

    protected function scopeColumn(): string
    {
        return 'scope';
    }

    private function context(User $user, Model $resource): \App\Authorization\AuthorizationContext
    {
        return $this->contexts->forCurrentOr($user, $this->workspaceId($resource));
    }

    protected function workspaceId(Model $resource): string
    {
        return $this->stringValue($resource->getAttribute('workspace_id'));
    }

    private function ownerId(Model $resource): ?string
    {
        $ownerId = $resource->getAttribute($this->ownerColumn());

        return $ownerId === null ? null : $this->stringValue($ownerId);
    }

    private function scope(Model $resource): string
    {
        return $this->stringValue($resource->getAttribute($this->scopeColumn()));
    }

    private function teamId(Model $resource): ?string
    {
        $teamId = $resource->getAttribute('team_id');

        return $teamId === null ? null : $this->stringValue($teamId);
    }

    protected function stringValue(mixed $value): string
    {
        return is_scalar($value) ? (string) $value : '';
    }
}
