<?php

namespace App\Policies\DataTable;

use App\Policies\Shared\ScopedResourcePolicy;

final class DataTablePolicy extends ScopedResourcePolicy
{
    protected function scopeColumn(): string
    {
        return 'visibility';
    }
}
