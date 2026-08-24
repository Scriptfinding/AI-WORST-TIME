<?php

namespace App\Services\Variable;

use RuntimeException;

class UnresolvedVariableException extends RuntimeException
{
    public function __construct(string $key)
    {
        parent::__construct(
            "Variable '{$key}' is missing or unavailable to the user triggering this run."
        );
    }
}
