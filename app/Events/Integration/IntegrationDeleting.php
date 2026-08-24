<?php

namespace App\Events\Integration;

use App\Models\Integration;
use Illuminate\Foundation\Events\Dispatchable;

class IntegrationDeleting
{
    use Dispatchable;

    public function __construct(
        public readonly Integration $integration,
    ) {}
}
