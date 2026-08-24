<?php

namespace App\Models;

use App\Enums\Mailbox\MailboxWatcherRuleField;
use App\Enums\Mailbox\MailboxWatcherRuleOperator;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MailboxWatcherRule extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'mailbox_watcher_id',
        'rule_group',
        'field',
        'operator',
        'value',
    ];

    protected function casts(): array
    {
        return [
            'rule_group' => 'integer',
            'field' => MailboxWatcherRuleField::class,
            'operator' => MailboxWatcherRuleOperator::class,
            'created_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<MailboxWatcher, $this> */
    public function watcher(): BelongsTo
    {
        return $this->belongsTo(MailboxWatcher::class, 'mailbox_watcher_id');
    }
}
