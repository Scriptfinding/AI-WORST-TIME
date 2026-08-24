<?php

namespace App\Services\Workspace\Identity;

use App\Models\User;
use App\Models\Workspace;
use Illuminate\Support\Collection;

final class IdentityRows
{
    /**
     * @param  array<int, int|string|null>  $ids
     * @return Collection<int, User>
     */
    public function users(array $ids): Collection
    {
        $ids = $this->ids($ids);

        return User::query()
            ->whereIn('id', $ids)
            ->orderBy('id')
            ->lockForUpdate()
            ->get();
    }

    /**
     * @param  array<int, int|string|null>  $ids
     * @return Collection<int, Workspace>
     */
    public function workspaces(array $ids): Collection
    {
        $ids = $this->ids($ids);

        return Workspace::query()
            ->whereIn('id', $ids)
            ->orderBy('id')
            ->lockForUpdate()
            ->get();
    }

    /**
     * @param  array<int, int|string|null>  $ids
     * @return array<int, string>
     */
    private function ids(array $ids): array
    {
        $ids = array_filter($ids, fn ($id) => $id !== null && $id !== '');
        $ids = array_map(fn ($id) => (string) $id, $ids);
        $ids = array_values(array_unique($ids));
        sort($ids);

        return $ids;
    }
}
