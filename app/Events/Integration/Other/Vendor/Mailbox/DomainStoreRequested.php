<?php

namespace App\Events\Integration\Other\Vendor\Mailbox;

use App\Models\Integration;
use App\Models\MailboxDomain;
use Illuminate\Foundation\Events\Dispatchable;

class DomainStoreRequested
{
    use Dispatchable;

    public ?MailboxDomain $domain = null;
    public ?string $error = null;

    public function __construct(
        public readonly Integration $integration,
        public readonly string $workspaceId,
        public readonly string $name,
    ) {}
}
