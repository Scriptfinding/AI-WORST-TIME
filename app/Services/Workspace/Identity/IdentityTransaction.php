<?php

namespace App\Services\Workspace\Identity;

use Illuminate\Database\Connection;
use Illuminate\Support\Facades\DB;

final class IdentityTransaction
{
    private const ATTEMPTS = 3;

    /**
     * @template T
     *
     * @param  callable(): T  $callback
     * @return T
     */
    public function run(callable $callback): mixed
    {
        if (DB::transactionLevel() > 0) {
            return $callback();
        }

        return DB::transaction(
            static fn (Connection $connection): mixed => $callback(),
            self::ATTEMPTS,
        );
    }
}
