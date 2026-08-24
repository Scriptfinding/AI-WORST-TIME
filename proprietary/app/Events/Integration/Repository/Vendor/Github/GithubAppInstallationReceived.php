<?php

namespace App\Events\Integration\Repository\Vendor\Github;

use Illuminate\Foundation\Events\Dispatchable;

class GithubAppInstallationReceived
{
    use Dispatchable;

    public ?string $error = null;

    public function __construct(
        public readonly string $installationId,
        public readonly string $workspaceId,
        public readonly ?string $integrationId = null,
    ) {}
}
