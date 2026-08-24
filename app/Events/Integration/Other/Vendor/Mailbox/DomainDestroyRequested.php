<?php

namespace App\Events\Integration\Other\Vendor\Mailbox;

use App\Models\Integration;
use App\Models\MailboxDomain;
use Illuminate\Foundation\Events\Dispatchable;

class DomainDestroyRequested
{
    use Dispatchable;

    public bool $success = false;

    public function __construct(
        public readonly Integration $integration,
        public readonly MailboxDomain $domain,
    ) {}
}
