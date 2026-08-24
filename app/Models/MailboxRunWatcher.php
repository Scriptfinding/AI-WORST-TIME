<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MailboxRunWatcher extends Model
{
    protected $fillable = [
        'flow_run_id',
        'mailbox_watcher_id',
        'mailbox_id',
        'watcher_name',
        'authorized_at',
    ];

    protected function casts(): array
    {
        return [
            'authorized_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<FlowRun, $this> */
    public function flowRun(): BelongsTo
    {
        return $this->belongsTo(FlowRun::class);
    }

    /** @return BelongsTo<MailboxWatcher, $this> */
    public function mailboxWatcher(): BelongsTo
    {
        return $this->belongsTo(MailboxWatcher::class);
    }

    /** @return BelongsTo<Mailbox, $this> */
    public function mailbox(): BelongsTo
    {
        return $this->belongsTo(Mailbox::class);
    }
}
