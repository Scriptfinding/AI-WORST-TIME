<?php

namespace App\Console\Commands;

use App\Models\MailboxEmail;
use App\Models\MailboxRunMessage;
use App\Services\Mailbox\MailboxEmailDeliveryService;
use App\Services\Mailbox\MailboxRunQueueService;
use Illuminate\Console\Command;

class MailboxMaintain extends Command
{
    protected $signature = 'mailbox:maintain {--limit=500 : Maximum rows per operation}';

    protected $description = 'Retry mailbox delivery and enforce runtime message retention';

    public function handle(
        MailboxEmailDeliveryService $delivery,
        MailboxRunQueueService $runQueue,
    ): int {
        $limitOption = $this->option('limit');
        $limit = max(1, is_numeric($limitOption) ? (int) $limitOption : 500);
        $delivery->retryPending($limit);
        $runQueue->expireDue();

        $scrubAfter = $this->configInt('puppetflow.mailbox_delivery.scrub_after_seconds', 3600, 60);
        $deleteAfter = $this->configInt('puppetflow.mailbox_delivery.retention_seconds', 604800, $scrubAfter);
        $this->terminalMessagesBefore(now()->subSeconds($scrubAfter))
            ->whereNull('payload_scrubbed_at')
            ->orderBy('id')
            ->limit($limit)
            ->update([
                'payload' => json_encode([], JSON_THROW_ON_ERROR),
                'claim_token_hash' => null,
                'payload_scrubbed_at' => now(),
                'updated_at' => now(),
            ]);

        $ids = $this->terminalMessagesBefore(now()->subSeconds($deleteAfter))
            ->orderBy('id')
            ->limit($limit)
            ->pluck('id');
        if ($ids->isNotEmpty()) {
            MailboxRunMessage::query()->whereIn('id', $ids)->delete();
        }

        $deliveryWindow = $this->configInt('puppetflow.mailbox_delivery.window_seconds', 300, 30);
        $emailPayloadRetention = $this->configInt(
            'puppetflow.mailbox_delivery.email_payload_retention_seconds',
            604800,
            $deliveryWindow,
        );
        MailboxEmail::query()
            ->whereNull('payload_scrubbed_at')
            ->where('received_at', '<=', now()->subSeconds($emailPayloadRetention))
            ->orderBy('id')
            ->limit($limit)
            ->update([
                'headers' => null,
                'text_body' => null,
                'html_body' => null,
                'payload_scrubbed_at' => now(),
                'updated_at' => now(),
            ]);

        return self::SUCCESS;
    }

    /** @return \Illuminate\Database\Eloquent\Builder<MailboxRunMessage> */
    private function terminalMessagesBefore(\DateTimeInterface $cutoff): \Illuminate\Database\Eloquent\Builder
    {
        return MailboxRunMessage::query()
            ->where(function ($query) use ($cutoff): void {
                $query->where(function ($consumed) use ($cutoff): void {
                    $consumed->where('status', MailboxRunMessage::STATUS_CONSUMED)
                        ->where('consumed_at', '<=', $cutoff);
                })->orWhere(function ($expired) use ($cutoff): void {
                    $expired->where('status', MailboxRunMessage::STATUS_EXPIRED)
                        ->where('expired_at', '<=', $cutoff);
                });
            });
    }

    private function configInt(string $key, int $default, int $minimum): int
    {
        $configured = config($key, $default);

        return max($minimum, is_numeric($configured) ? (int) $configured : $default);
    }
}
