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
use LogicException;

/**
 * @property string $id
 * @property string $address
 * @property string $user_id
 * @property string $scope
 * @property string|null $team_id
 * @property-read MailboxDomain $domain
 * @property-read int $emails_count
 * @property-read int $unread_count
 */
class Mailbox extends Model
{
    use HasStringId;

    public const ID_PREFIX = 'mbox';

    protected $fillable = [
        'workspace_id',
        'user_id',
        'domain_id',
        'slug',
        'group',
        'description',
        'is_active',
        'stale',
        'scope',
        'team_id',
    ];

    protected static function booted(): void
    {
        static::saving(function (Mailbox $mailbox) {
            $domainName = MailboxDomain::query()
                ->whereKey($mailbox->domain_id)
                ->value('name');

            if (! is_string($domainName) || $domainName === '') {
                throw new LogicException('A valid mailbox domain is required.');
            }

            $mailbox->address = self::normalizeAddress($mailbox->slug, $domainName);
        });

        static::deleting(function (Mailbox $mailbox) {
            $mailbox->watchers->each->delete();
            $mailbox->emails()->delete();
        });
    }

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'stale' => 'boolean',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<Workspace, $this> */
    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    /** @return BelongsTo<WorkspaceTeam, $this> */
    public function team(): BelongsTo
    {
        return $this->belongsTo(WorkspaceTeam::class, 'team_id');
    }

    /** @return BelongsTo<MailboxDomain, $this> */
    public function domain(): BelongsTo
    {
        return $this->belongsTo(MailboxDomain::class, 'domain_id');
    }

    /** @return HasMany<MailboxEmail, $this> */
    public function emails(): HasMany
    {
        return $this->hasMany(MailboxEmail::class);
    }

    /** @return HasMany<MailboxWatcher, $this> */
    public function watchers(): HasMany
    {
        return $this->hasMany(MailboxWatcher::class);
    }

    public function address(): string
    {
        return $this->address;
    }

    public static function normalizeAddress(string $slug, string $domain): string
    {
        return mb_strtolower(trim($slug).'@'.trim($domain));
    }
}
