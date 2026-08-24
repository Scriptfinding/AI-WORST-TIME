<?php

namespace App\Services\Mailbox;

use App\Models\MailboxEmail;
use Illuminate\Support\Facades\DB;

class MailboxEmailIngestionService
{
    public function __construct(
        private readonly MailboxEmailDeliveryService $delivery,
    ) {}

    /**
     * @param  array<string, mixed>  $attributes
     * @return array{email: MailboxEmail, delivered: bool, duplicate: bool}
     */
    public function ingest(string $mailboxId, ?string $messageId, string $contentIdentity, array $attributes): array
    {
        $ingestionKey = $this->ingestionKey($messageId, $contentIdentity);
        $deliveryWindow = $this->configInt('puppetflow.mailbox_delivery.window_seconds', 300, 30);
        $email = DB::transaction(function () use (
            $mailboxId,
            $ingestionKey,
            $messageId,
            $attributes,
            $deliveryWindow,
        ): MailboxEmail {
            return MailboxEmail::query()->firstOrCreate([
                'mailbox_id' => $mailboxId,
                'ingestion_key' => $ingestionKey,
            ], [
                ...$attributes,
                'message_id' => $messageId,
                'sender_authentication' => MailboxEmail::SENDER_AUTHENTICATION_UNVERIFIED,
                'delivery_status' => MailboxEmail::DELIVERY_PENDING,
                'delivery_deadline_at' => now()->addSeconds($deliveryWindow),
            ]);
        }, 3);

        $duplicate = ! $email->wasRecentlyCreated;
        $status = $email->getAttribute('delivery_status');
        $delivered = $status === MailboxEmail::DELIVERY_DELIVERED;
        $attemptedAt = $email->getAttribute('delivery_attempted_at');
        $retryAfter = $this->configInt('puppetflow.mailbox_delivery.retry_after_seconds', 30, 5);
        $maxAttempts = $this->configInt('puppetflow.mailbox_delivery.max_attempts', 10, 1);
        $storedAttempts = $email->getAttribute('delivery_attempts');
        $retryDue = $email->wasRecentlyCreated
            || ! $attemptedAt instanceof \DateTimeInterface
            || $attemptedAt <= now()->subSeconds($retryAfter);
        if (
            $retryDue
            && (is_numeric($storedAttempts) ? (int) $storedAttempts : 0) < $maxAttempts
            && in_array($status, [
                MailboxEmail::DELIVERY_PENDING,
                MailboxEmail::DELIVERY_AWAITING_RUN,
                MailboxEmail::DELIVERY_FAILED,
            ], true)
        ) {
            $delivered = $this->delivery->deliver($email);
        }

        return [
            'email' => $email->refresh(),
            'delivered' => $delivered,
            'duplicate' => $duplicate,
        ];
    }

    private function ingestionKey(?string $messageId, string $contentIdentity): string
    {
        $normalizedMessageId = is_string($messageId)
            ? mb_strtolower(trim($messageId, " \t\n\r\0\x0B<>"))
            : '';
        $contentFingerprint = hash('sha256', $contentIdentity);
        $identity = $normalizedMessageId === ''
            ? 'content:'.$contentFingerprint
            : 'message-id:'.$normalizedMessageId.'|content:'.$contentFingerprint;

        return hash('sha256', $identity);
    }

    private function configInt(string $key, int $default, int $minimum): int
    {
        $configured = config($key, $default);

        return max($minimum, is_numeric($configured) ? (int) $configured : $default);
    }
}
