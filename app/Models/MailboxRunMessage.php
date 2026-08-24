<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MailboxRunMessage extends Model
{
    public const STATUS_PENDING = 'pending';

    public const STATUS_CLAIMED = 'claimed';

    public const STATUS_CONSUMED = 'consumed';

    public const STATUS_EXPIRED = 'expired';

    protected $fillable = [
        'flow_run_id',
        'mailbox_email_id',
        'mailbox_watcher_id',
        'watcher_name',
        'payload',
        'status',
        'attempts',
        'claim_token_hash',
        'claimed_at',
        'lease_expires_at',
        'consumed_at',
        'expires_at',
        'expired_at',
        'payload_scrubbed_at',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'attempts' => 'integer',
            'claimed_at' => 'datetime',
            'lease_expires_at' => 'datetime',
            'consumed_at' => 'datetime',
            'expires_at' => 'datetime',
            'expired_at' => 'datetime',
            'payload_scrubbed_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<FlowRun, $this> */
    public function flowRun(): BelongsTo
    {
        return $this->belongsTo(FlowRun::class);
    }

    /** @return BelongsTo<MailboxEmail, $this> */
    public function mailboxEmail(): BelongsTo
    {
        return $this->belongsTo(MailboxEmail::class);
    }

    /** @return BelongsTo<MailboxWatcher, $this> */
    public function mailboxWatcher(): BelongsTo
    {
        return $this->belongsTo(MailboxWatcher::class);
    }
}
