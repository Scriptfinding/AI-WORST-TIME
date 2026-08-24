<?php

namespace App\Subscribers\Integration;

use App\Contracts\Integration\IntegrationCleanupInterface;
use App\Events\Integration\IntegrationDeleting;
use Illuminate\Events\Dispatcher;

class IntegrationCleanupSubscriber
{
    /** @var IntegrationCleanupInterface[] */
    private array $handlers;

    public function __construct(IntegrationCleanupInterface ...$handlers)
    {
        $this->handlers = $handlers;
    }

    public function handleDeleting(IntegrationDeleting $event): void
    {
        foreach ($this->handlers as $handler) {
            if ($handler->supports($event->integration)) {
                $handler->cleanup($event->integration);
            }
        }
    }

    public function subscribe(Dispatcher $events): void
    {
        $events->listen(IntegrationDeleting::class, [self::class, 'handleDeleting']);
    }
}
