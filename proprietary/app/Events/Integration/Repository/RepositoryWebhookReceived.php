<?php

namespace App\Events\Integration\Repository;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Http\Request;

class RepositoryWebhookReceived
{
    use Dispatchable;

    public int $synced = 0;

    public bool $authenticated = false;

    public bool $validPayload = true;

    public function __construct(
        public readonly string $provider,
        public readonly string $webhookId,
        public readonly Request $request,
    ) {}
}
