<?php

namespace App\Services\Workspace\Identity;

use App\Database\DatabaseDialect;
use Illuminate\Support\Facades\DB;
use LogicException;

final class IdentityMutex
{
    public function __construct(private readonly DatabaseDialect $dialect) {}

    public function lock(string ...$keys): void
    {
        if (DB::transactionLevel() === 0) {
            throw new LogicException('Identity mutexes require an active database transaction.');
        }

        $keys = array_values(array_unique($keys));
        sort($keys);

        $this->dialect->acquireIdentityMutex($keys);
    }
}
