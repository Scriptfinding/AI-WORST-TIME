<?php

/*
 * Explicit proprietary scope: the paid shared-scope fields and relations in this file implement paid
 * Puppetflow features and are licensed under the Puppetflow Proprietary License.
 * See LICENSE_PROPRIETARY.md.
 */

namespace App\Models;

use App\Models\Concerns\HasStringId;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property string $id
 * @property string $user_id
 * @property string $scope
 * @property string|null $team_id
 */
class MailboxWatcher extends Model
{
    use HasStringId;

    public const ID_PREFIX = 'mbwa';

    protected $fillable = [
        'flow_id',
        'user_id',
        'mailbox_id',
        'name',
        'group',
        'extract_enabled',
        'extract_mode',
        'extract_expression',
        'is_active',
        'stale',
        'timeout',
        'scope',
        'team_id',
    ];

    protected static function booted(): void
    {
        static::deleting(function (MailboxWatcher $watcher) {
            $watcher->rules()->delete();
        });
    }

    protected function casts(): array
    {
        return [
            'extract_enabled' => 'boolean',
            'is_active' => 'boolean',
            'stale' => 'boolean',
            'timeout' => 'integer',
        ];
    }

    /** @return BelongsTo<Flow, $this> */
    public function flow(): BelongsTo
    {
        return $this->belongsTo(Flow::class);
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<WorkspaceTeam, $this> */
    public function team(): BelongsTo
    {
        return $this->belongsTo(WorkspaceTeam::class, 'team_id');
    }

    /** @return BelongsTo<Mailbox, $this> */
    public function mailbox(): BelongsTo
    {
        return $this->belongsTo(Mailbox::class);
    }

    /** @return HasMany<MailboxWatcherRule, $this> */
    public function rules(): HasMany
    {
        return $this->hasMany(MailboxWatcherRule::class);
    }

    /** @return HasMany<MailboxRunMessage, $this> */
    public function mailboxRunMessages(): HasMany
    {
        return $this->hasMany(MailboxRunMessage::class);
    }
}
