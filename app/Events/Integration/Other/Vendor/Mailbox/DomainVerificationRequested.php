<?php

namespace App\Events\Integration\Other\Vendor\Mailbox;

use App\Models\Integration;
use App\Models\MailboxDomain;
use Illuminate\Foundation\Events\Dispatchable;

class DomainVerificationRequested
{
    use Dispatchable;

    /**
     * @var array{
     *     mx: array{expected: string, found: list<string>, valid: bool, error: string|null},
     *     txt: array{expected: string, found: list<string>, valid: bool, error: string|null}
     * }|null
     */
    public ?array $result = null;

    public function __construct(
        public readonly Integration $integration,
        public readonly MailboxDomain $domain,
    ) {}
}
