<?php

namespace App\Services\Mailbox;

use App\Models\FlowRun;
use App\Models\MailboxEmail;
use App\Models\MailboxWatcher;
use App\Services\Integration\Other\Vendor\Mailbox\RuleEvaluatorService;
use Illuminate\Support\Facades\DB;

class MailboxEmailDeliveryService
{
    public function __construct(
        private readonly RuleEvaluatorService $rules,
        private readonly MailboxRunQueueService $queue,
    ) {}

    public function deliver(MailboxEmail $email): bool
    {
        try {
            return DB::transaction(function () use ($email): bool {
                $lockedEmail = MailboxEmail::query()->whereKey($email->getKey())->lockForUpdate()->first();
                if (! $lockedEmail instanceof MailboxEmail) {
                    return false;
                }
                if ($lockedEmail->getAttribute('delivery_status') === MailboxEmail::DELIVERY_DELIVERED) {
                    return true;
                }

                $attemptedAt = now();
                $status = $lockedEmail->getAttribute('delivery_status');
                $maxAttempts = $this->configInt('puppetflow.mailbox_delivery.max_attempts', 10, 1);
                $retryAfter = $this->configInt('puppetflow.mailbox_delivery.retry_after_seconds', 30, 5);
                $storedAttempts = $lockedEmail->getAttribute('delivery_attempts');
                $attempts = is_numeric($storedAttempts) ? (int) $storedAttempts : 0;
                $previousAttemptedAt = $lockedEmail->getAttribute('delivery_attempted_at');
                $deadline = $lockedEmail->getAttribute('delivery_deadline_at');
                if (! in_array($status, [
                    MailboxEmail::DELIVERY_PENDING,
                    MailboxEmail::DELIVERY_AWAITING_RUN,
                    MailboxEmail::DELIVERY_FAILED,
                ], true)) {
                    return false;
                }
                if (
                    $previousAttemptedAt instanceof \DateTimeInterface
                    && $previousAttemptedAt > $attemptedAt->copy()->subSeconds($retryAfter)
                ) {
                    return false;
                }
                if (
                    $attempts >= $maxAttempts
                    || ($deadline instanceof \DateTimeInterface && $deadline <= $attemptedAt)
                ) {
                    $lockedEmail->update([
                        'delivery_status' => MailboxEmail::DELIVERY_FAILED,
                        'delivery_attempts' => $maxAttempts,
                        'delivery_last_error' => 'Delivery window or attempt limit exhausted.',
                        'delivery_attempted_at' => $attemptedAt,
                    ]);

                    return false;
                }
                $attemptNumber = $attempts + 1;
                $lockedEmail->update([
                    'delivery_status' => MailboxEmail::DELIVERY_PENDING,
                    'delivery_attempts' => $attemptNumber,
                    'delivery_last_error' => null,
                    'delivery_attempted_at' => $attemptedAt,
                ]);

                $delivered = false;
                $matched = false;
                $matchedWithoutDelivery = false;
                $watchers = MailboxWatcher::query()
                    ->where('mailbox_id', $lockedEmail->getAttribute('mailbox_id'))
                    ->where('is_active', true)
                    ->where('stale', false)
                    ->whereHas('mailbox', fn ($query) => $query
                        ->where('is_active', true)
                        ->where('stale', false)
                        ->whereHas('domain', fn ($domain) => $domain
                            ->where('is_active', true)
                            ->where('stale', false)))
                    ->with('rules')
                    ->get();

                foreach ($watchers as $watcher) {
                    if (! $this->rules->evaluate($watcher->rules, $lockedEmail)) {
                        continue;
                    }
                    $matched = true;

                    $parsedValue = null;
                    if ($watcher->extract_enabled && $watcher->extract_expression) {
                        $parsedValue = $this->rules->extractParsedValue(
                            $watcher->extract_expression,
                            $lockedEmail,
                            $watcher->extract_mode ?? 'regex',
                        );
                    }
                    $payload = $this->payload($lockedEmail, $parsedValue);
                    $runs = FlowRun::query()
                        ->where('flow_id', $watcher->getAttribute('flow_id'))
                        ->where('status', 'running')
                        ->whereHas('mailboxRunWatchers', fn ($query) => $query
                            ->where('mailbox_watcher_id', $watcher->getKey())
                            ->where('mailbox_id', $lockedEmail->getAttribute('mailbox_id'))
                            ->where('watcher_name', $watcher->getAttribute('id')))
                        ->get();

                    $watcherDelivered = false;
                    foreach ($runs as $run) {
                        $published = $this->queue->publish($run, $lockedEmail, $watcher, $payload);
                        $watcherDelivered = $published || $watcherDelivered;
                        $delivered = $published || $delivered;
                    }
                    $matchedWithoutDelivery = ! $watcherDelivered || $matchedWithoutDelivery;
                }

                $retryable = $matched
                    && $matchedWithoutDelivery
                    && $attemptNumber < $maxAttempts
                    && (! $deadline instanceof \DateTimeInterface || $deadline > now());
                $lockedEmail->update([
                    'delivery_status' => $retryable
                        ? MailboxEmail::DELIVERY_AWAITING_RUN
                        : ($matchedWithoutDelivery
                            ? MailboxEmail::DELIVERY_FAILED
                            : ($delivered ? MailboxEmail::DELIVERY_DELIVERED : MailboxEmail::DELIVERY_UNMATCHED)),
                    'delivery_last_error' => $retryable
                        ? 'Matching watcher found, but no authorized running run accepted delivery.'
                        : ($matchedWithoutDelivery
                            ? 'No authorized running run accepted delivery before the retry limit.'
                            : null),
                    'delivered_at' => $delivered
                        ? ($lockedEmail->getAttribute('delivered_at') ?? now())
                        : null,
                ]);

                return $delivered;
            }, 3);
        } catch (\Throwable $exception) {
            DB::transaction(function () use ($email, $exception): void {
                $failedEmail = MailboxEmail::query()->whereKey($email->getKey())->lockForUpdate()->first();
                if (
                    ! $failedEmail instanceof MailboxEmail
                    || $failedEmail->getAttribute('delivery_status') === MailboxEmail::DELIVERY_DELIVERED
                ) {
                    return;
                }

                $storedAttempts = $failedEmail->getAttribute('delivery_attempts');
                $attempts = is_numeric($storedAttempts) ? (int) $storedAttempts : 0;
                $maxAttempts = $this->configInt('puppetflow.mailbox_delivery.max_attempts', 10, 1);
                $failedEmail->update([
                    'delivery_status' => MailboxEmail::DELIVERY_FAILED,
                    'delivery_attempts' => min($maxAttempts, $attempts + 1),
                    'delivery_last_error' => $exception::class,
                    'delivery_attempted_at' => now(),
                ]);
            }, 3);

            throw $exception;
        }
    }

    public function retryPending(int $limit = 100): int
    {
        $retryAfter = $this->configInt('puppetflow.mailbox_delivery.retry_after_seconds', 30, 5);
        $maxAttempts = $this->configInt('puppetflow.mailbox_delivery.max_attempts', 10, 1);
        $emails = MailboxEmail::query()
            ->whereIn('delivery_status', [
                MailboxEmail::DELIVERY_PENDING,
                MailboxEmail::DELIVERY_AWAITING_RUN,
                MailboxEmail::DELIVERY_FAILED,
            ])
            ->where('delivery_attempts', '<', $maxAttempts)
            ->where(function ($query) use ($retryAfter): void {
                $query->whereNull('delivery_attempted_at')
                    ->orWhere('delivery_attempted_at', '<=', now()->subSeconds($retryAfter));
            })
            ->orderBy('id')
            ->limit(max(1, $limit))
            ->get();

        $delivered = 0;
        foreach ($emails as $email) {
            try {
                if ($this->deliver($email)) {
                    $delivered++;
                }
            } catch (\Throwable) {
                // Failure metadata is persisted by deliver() and retried later.
            }
        }

        return $delivered;
    }

    /** @return array<string, mixed> */
    private function payload(MailboxEmail $email, ?string $parsedValue): array
    {
        $text = $email->getAttribute('text_body');
        $html = $email->getAttribute('html_body');

        return [
            'from' => $email->from_address,
            'sender_authentication' => MailboxEmail::SENDER_AUTHENTICATION_UNVERIFIED,
            'to' => $email->to_address,
            'subject' => $email->getAttribute('subject'),
            'text' => is_string($text) ? $text : null,
            'html' => is_string($html) ? $html : null,
            'parsed' => $parsedValue,
            'body' => $email->text_body ?: $email->html_body,
            'date' => $this->iso8601($email->getAttribute('date')),
            'parsed_value' => $parsedValue,
            'received_at' => $this->iso8601($email->getAttribute('received_at')),
        ];
    }

    private function iso8601(mixed $value): ?string
    {
        return $value instanceof \DateTimeInterface
            ? $value->format(DATE_ATOM)
            : (is_string($value) ? $value : null);
    }

    private function configInt(string $key, int $default, int $minimum): int
    {
        $configured = config($key, $default);

        return max($minimum, is_numeric($configured) ? (int) $configured : $default);
    }
}
