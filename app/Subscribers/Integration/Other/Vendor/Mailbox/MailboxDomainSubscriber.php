<?php

namespace App\Subscribers\Integration\Other\Vendor\Mailbox;

use App\Events\Integration\Other\Vendor\Mailbox\DomainDestroyRequested;
use App\Events\Integration\Other\Vendor\Mailbox\DomainStoreRequested;
use App\Events\Integration\Other\Vendor\Mailbox\DomainVerificationRequested;
use App\Models\MailboxDomain;
use App\Services\Integration\Other\Vendor\Mailbox\DnsService;
use Illuminate\Events\Dispatcher;

class MailboxDomainSubscriber
{
    public function __construct(
        private readonly DnsService $dnsService,
    ) {}

    public function handleStore(DomainStoreRequested $event): void
    {
        $exists = MailboxDomain::where('workspace_id', $event->workspaceId)
            ->where('name', $event->name)
            ->exists();

        if ($exists) {
            $event->error = 'This domain is already configured.';
            return;
        }

        $event->domain = MailboxDomain::create([
            'workspace_id' => $event->workspaceId,
            'integration_id' => $event->integration->id,
            'name' => $event->name,
        ]);
    }

    public function handleDestroy(DomainDestroyRequested $event): void
    {
        $event->domain->delete();
        $event->success = true;
    }

    public function handleVerification(DomainVerificationRequested $event): void
    {
        $result = $this->dnsService->verify($event->domain);

        if ($result['mx']['valid'] && $result['txt']['valid'] && !$event->domain->is_verified) {
            $event->domain->update(['is_verified' => true]);
        }

        $event->result = $result;
    }

    public function subscribe(Dispatcher $events): void
    {
        $events->listen(DomainStoreRequested::class, [self::class, 'handleStore']);
        $events->listen(DomainDestroyRequested::class, [self::class, 'handleDestroy']);
        $events->listen(DomainVerificationRequested::class, [self::class, 'handleVerification']);
    }
}
