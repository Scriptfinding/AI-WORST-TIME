<?php

namespace App\Events\Integration\Repository\Vendor\Github;

use Illuminate\Foundation\Events\Dispatchable;

class GithubAppCallbackReceived
{
    use Dispatchable;

    public ?string $error = null;

    public ?string $integrationId = null;

    public function __construct(
        public readonly string $code,
        public readonly string $webhookId,
        public readonly string $workspaceId,
        public readonly string $userId,
        public readonly ?string $pendingName = null,
    ) {}
}
