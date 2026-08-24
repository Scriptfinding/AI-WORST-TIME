<?php

namespace App\Services\Mailbox;

use App\Database\DatabaseDialect;
use App\Models\Flow;
use App\Models\FlowRun;
use App\Models\MailboxEmail;
use App\Models\MailboxRunMessage;
use App\Models\MailboxRunWatcher;
use App\Models\MailboxWatcher;
use Illuminate\Support\Facades\DB;

class MailboxRunQueueService
{
    public function __construct(private readonly DatabaseDialect $dialect) {}

    /**
     * @param  list<array{id: string, mailbox_id: string}>  $watchers
     */
    public function snapshotAuthorizedWatchers(FlowRun $run, array $watchers): void
    {
        DB::transaction(function () use ($run, $watchers): void {
            $activeRun = FlowRun::query()
                ->whereKey($run->getKey())
                ->whereIn('status', ['pending', 'running'])
                ->sharedLock()
                ->first();
            if (! $activeRun instanceof FlowRun) {
                return;
            }

            MailboxRunWatcher::query()->where('flow_run_id', $run->getKey())->delete();
            $now = now();
            $rows = [];
            foreach ($watchers as $watcher) {
                if ($watcher['id'] === '' || $watcher['mailbox_id'] === '') {
                    continue;
                }
                $rows[] = [
                    'flow_run_id' => $run->getKey(),
                    'mailbox_watcher_id' => $watcher['id'],
                    'mailbox_id' => $watcher['mailbox_id'],
                    'watcher_name' => $watcher['id'],
                    'authorized_at' => $now,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
            if ($rows !== []) {
                MailboxRunWatcher::query()->insert($rows);
            }
        }, 3);
    }

    /** @param array<string, mixed> $emailPayload */
    public function publish(
        FlowRun $run,
        MailboxEmail $email,
        MailboxWatcher $watcher,
        array $emailPayload,
    ): bool {
        return DB::transaction(function () use ($run, $email, $watcher, $emailPayload): bool {
            $activeRun = FlowRun::query()->whereKey($run->id)->sharedLock()->first();
            if (! $activeRun instanceof FlowRun || $activeRun->getAttribute('status') !== 'running') {
                return false;
            }

            $emailId = $email->getKey();
            $watcherId = $watcher->getKey();
            $emailMailboxId = $email->getAttribute('mailbox_id');
            $watcherMailboxId = $watcher->getAttribute('mailbox_id');
            $watcherFlowId = $watcher->getAttribute('flow_id');
            $runFlowId = $run->getAttribute('flow_id');
            if (
                ! is_numeric($emailId)
                || ! is_string($watcherId)
                || ! is_string($emailMailboxId)
                || ! is_string($watcherMailboxId)
                || ! is_string($watcherFlowId)
                || ! is_string($runFlowId)
                || $emailMailboxId !== $watcherMailboxId
                || $watcherFlowId !== $runFlowId
            ) {
                return false;
            }

            $watcherName = $watcher->getAttribute('id');
            if (! is_string($watcherName) || $watcherName === '') {
                return false;
            }
            if (! MailboxRunWatcher::query()
                ->where('flow_run_id', $run->id)
                ->where('mailbox_watcher_id', $watcherId)
                ->where('mailbox_id', $emailMailboxId)
                ->where('watcher_name', $watcherName)
                ->exists()
            ) {
                return false;
            }

            $ttl = $this->messageTtlSeconds($activeRun);

            MailboxRunMessage::query()->firstOrCreate([
                'flow_run_id' => $run->id,
                'mailbox_email_id' => (int) $emailId,
                'mailbox_watcher_id' => $watcherId,
            ], [
                'watcher_name' => $watcherName,
                'payload' => $emailPayload,
                'status' => MailboxRunMessage::STATUS_PENDING,
                'expires_at' => now()->addSeconds($ttl),
            ]);

            return true;
        }, 3);
    }

    /**
     * @return array{id: int, claim_token: string, lease_expires_at: string, email: array<string, mixed>}|null
     */
    public function claim(FlowRun $run, string $watcherName): ?array
    {
        return DB::transaction(function () use ($run, $watcherName): ?array {
            $activeRun = FlowRun::query()->whereKey($run->getKey())->sharedLock()->first();
            if (! $activeRun instanceof FlowRun || $activeRun->getAttribute('status') !== 'running') {
                return null;
            }
            if (! MailboxRunWatcher::query()
                ->where('flow_run_id', $run->getKey())
                ->where('watcher_name', $watcherName)
                ->exists()
            ) {
                return null;
            }

            $now = now();
            MailboxRunMessage::query()
                ->where('flow_run_id', $run->id)
                ->whereIn('status', [
                    MailboxRunMessage::STATUS_PENDING,
                    MailboxRunMessage::STATUS_CLAIMED,
                ])
                ->where('expires_at', '<=', $now)
                ->update([
                    'status' => MailboxRunMessage::STATUS_EXPIRED,
                    'expired_at' => $now,
                    'claim_token_hash' => null,
                    'lease_expires_at' => null,
                ]);
            $claimQuery = MailboxRunMessage::query()
                ->where('flow_run_id', $run->id)
                ->where('watcher_name', $watcherName)
                ->where('expires_at', '>', $now)
                ->where(function ($query) use ($now) {
                    $query->where('status', MailboxRunMessage::STATUS_PENDING)
                        ->orWhere(function ($query) use ($now) {
                            $query->where('status', MailboxRunMessage::STATUS_CLAIMED)
                                ->where('lease_expires_at', '<=', $now);
                        });
                })
                ->orderBy('created_at')
                ->orderBy('id');
            $this->dialect->lockMailboxClaim($claimQuery);
            $message = $claimQuery->first();

            if (! $message instanceof MailboxRunMessage) {
                return null;
            }

            $claimToken = bin2hex(random_bytes(32));
            $leaseExpiresAt = $now->copy()->addSeconds($this->leaseSeconds());
            MailboxRunMessage::query()->whereKey($message->getKey())->update([
                'status' => MailboxRunMessage::STATUS_CLAIMED,
                'attempts' => DB::raw('attempts + 1'),
                'claim_token_hash' => hash('sha256', $claimToken),
                'claimed_at' => $now,
                'lease_expires_at' => $leaseExpiresAt,
            ]);

            $payload = $message->getAttribute('payload');
            $messageId = $message->getKey();
            if (! is_numeric($messageId)) {
                throw new \LogicException('Claimed mailbox message is not persisted.');
            }

            return [
                'id' => (int) $messageId,
                'claim_token' => $claimToken,
                'lease_expires_at' => $leaseExpiresAt->toIso8601String(),
                'email' => is_array($payload) ? $payload : [],
            ];
        }, 3);
    }

    public function renewLease(FlowRun $run, int $messageId, string $claimToken): ?\DateTimeInterface
    {
        return DB::transaction(function () use ($run, $messageId, $claimToken): ?\DateTimeInterface {
            $activeRun = FlowRun::query()->whereKey($run->getKey())->sharedLock()->first();
            if (! $activeRun instanceof FlowRun || $activeRun->getAttribute('status') !== 'running') {
                return null;
            }

            $message = MailboxRunMessage::query()
                ->whereKey($messageId)
                ->where('flow_run_id', $run->getKey())
                ->lockForUpdate()
                ->first();
            if (! $message instanceof MailboxRunMessage
                || $message->getAttribute('status') !== MailboxRunMessage::STATUS_CLAIMED
            ) {
                return null;
            }

            $storedHash = $message->getAttribute('claim_token_hash');
            $leaseExpiresAt = $message->getAttribute('lease_expires_at');
            $messageExpiresAt = $message->getAttribute('expires_at');
            $now = now();
            if (
                ! is_string($storedHash)
                || ! hash_equals($storedHash, hash('sha256', $claimToken))
                || ! $leaseExpiresAt instanceof \DateTimeInterface
                || $leaseExpiresAt <= $now
                || ! $messageExpiresAt instanceof \DateTimeInterface
                || $messageExpiresAt <= $now
            ) {
                return null;
            }

            $renewedUntil = $now->copy()->addSeconds($this->leaseSeconds());
            if ($renewedUntil > $messageExpiresAt) {
                $renewedUntil = $messageExpiresAt;
            }
            $message->update(['lease_expires_at' => $renewedUntil]);

            return $renewedUntil;
        }, 3);
    }

    /**
     * @param  list<array{message_id: int, claim_token: string}>  $claims
     */
    public function acknowledgePersistedClaims(FlowRun $run, array $claims): void
    {
        if ($claims === []) {
            return;
        }

        DB::transaction(function () use ($run, $claims): void {
            $persistedRun = FlowRun::query()->whereKey($run->getKey())->lockForUpdate()->first();
            if (
                ! $persistedRun instanceof FlowRun
                || in_array($persistedRun->getAttribute('status'), ['pending', 'running'], true)
            ) {
                throw new \LogicException('Mailbox claims require a persisted terminal flow run.');
            }

            foreach ($claims as $claim) {
                if (! $this->acknowledgeClaim(
                    $persistedRun,
                    $claim['message_id'],
                    $claim['claim_token'],
                )) {
                    throw new \RuntimeException('Unable to acknowledge a persisted mailbox claim.');
                }
            }
        }, 3);
    }

    private function acknowledgeClaim(FlowRun $run, int $messageId, string $claimToken): bool
    {
        $message = MailboxRunMessage::query()
            ->whereKey($messageId)
            ->where('flow_run_id', $run->getKey())
            ->lockForUpdate()
            ->first();

        if (! $message instanceof MailboxRunMessage) {
            return false;
        }

        $storedHash = $message->getAttribute('claim_token_hash');
        if (! is_string($storedHash) || ! hash_equals($storedHash, hash('sha256', $claimToken))) {
            return false;
        }

        if ($message->getAttribute('status') === MailboxRunMessage::STATUS_CONSUMED) {
            return true;
        }

        if ($message->getAttribute('status') !== MailboxRunMessage::STATUS_CLAIMED) {
            return false;
        }

        $message->update([
            'status' => MailboxRunMessage::STATUS_CONSUMED,
            'consumed_at' => now(),
            'lease_expires_at' => null,
        ]);

        return true;
    }

    public function expireActive(FlowRun $run): void
    {
        MailboxRunMessage::query()
            ->where('flow_run_id', $run->id)
            ->whereIn('status', [
                MailboxRunMessage::STATUS_PENDING,
                MailboxRunMessage::STATUS_CLAIMED,
            ])
            ->update([
                'status' => MailboxRunMessage::STATUS_EXPIRED,
                'expired_at' => now(),
                'claim_token_hash' => null,
                'lease_expires_at' => null,
            ]);
    }

    public function expireDue(): int
    {
        $now = now();

        return MailboxRunMessage::query()
            ->whereIn('status', [
                MailboxRunMessage::STATUS_PENDING,
                MailboxRunMessage::STATUS_CLAIMED,
            ])
            ->where('expires_at', '<=', $now)
            ->update([
                'status' => MailboxRunMessage::STATUS_EXPIRED,
                'expired_at' => $now,
                'claim_token_hash' => null,
                'lease_expires_at' => null,
            ]);
    }

    private function messageTtlSeconds(FlowRun $run): int
    {
        $configuredTtl = config('puppetflow.runner_api.mailbox_message_ttl_seconds', 3600);
        $ttl = max(60, is_numeric($configuredTtl) ? (int) $configuredTtl : 3600);
        $flow = $run->flow;

        return $flow instanceof Flow
            ? max($ttl, $flow->getEffectiveTimeoutSeconds() + 60)
            : $ttl;
    }

    private function leaseSeconds(): int
    {
        $configuredLease = config('puppetflow.runner_api.mailbox_lease_seconds', 30);

        return max(5, is_numeric($configuredLease) ? (int) $configuredLease : 30);
    }
}
