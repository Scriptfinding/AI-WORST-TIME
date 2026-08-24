<?php

namespace App\Subscribers\Integration\Repository;

use App\Events\Integration\Repository\RepositoryWebhookReceived;
use App\Services\Flow\Source\FlowSourceService;
use Illuminate\Events\Dispatcher;

class RepositoryWebhookSubscriber
{
    public function __construct(
        private readonly FlowSourceService $flowSourceService,
    ) {}

    public function handleWebhook(RepositoryWebhookReceived $event): void
    {
        $result = $this->flowSourceService->processWebhook(
            $event->provider,
            $event->webhookId,
            $event->request,
        );
        $event->authenticated = $result['authenticated'];
        $event->validPayload = $result['valid_payload'];
        $event->synced = $result['synced'];
    }

    public function subscribe(Dispatcher $events): void
    {
        $events->listen(
            RepositoryWebhookReceived::class,
            [self::class, 'handleWebhook'],
        );
    }
}
