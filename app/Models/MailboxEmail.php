<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MailboxEmail extends Model
{
    public const DELIVERY_PENDING = 'pending';

    public const DELIVERY_AWAITING_RUN = 'awaiting_run';

    public const DELIVERY_DELIVERED = 'delivered';

    public const DELIVERY_UNMATCHED = 'unmatched';

    public const DELIVERY_FAILED = 'failed';

    public const SENDER_AUTHENTICATION_UNVERIFIED = 'unverified';

    protected $hidden = [
        'ingestion_key',
        'delivery_last_error',
    ];

    protected $fillable = [
        'mailbox_id',
        'ingestion_key',
        'message_id',
        'from_address',
        'sender_authentication',
        'to_address',
        'subject',
        'date',
        'headers',
        'text_body',
        'html_body',
        'raw_size',
        'received_at',
        'is_read',
        'delivery_status',
        'delivery_attempts',
        'delivery_last_error',
        'delivery_attempted_at',
        'delivered_at',
        'delivery_deadline_at',
        'payload_scrubbed_at',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'datetime',
            'headers' => 'array',
            'raw_size' => 'integer',
            'received_at' => 'datetime',
            'is_read' => 'boolean',
            'delivery_attempts' => 'integer',
            'delivery_attempted_at' => 'datetime',
            'delivered_at' => 'datetime',
            'delivery_deadline_at' => 'datetime',
            'payload_scrubbed_at' => 'datetime',
        ];
    }

    /** @return Attribute<string|null, never> */
    protected function subject(): Attribute
    {
        return Attribute::make(
            get: function (mixed $value): ?string {
                if ($value !== null && ! is_string($value)) {
                    throw new \TypeError('Mailbox subject must be a string or null.');
                }

                return $this->decodeMimeHeader($value);
            },
        );
    }

    /** @return BelongsTo<Mailbox, $this> */
    public function mailbox(): BelongsTo
    {
        return $this->belongsTo(Mailbox::class);
    }

    /** @return HasMany<MailboxRunMessage, $this> */
    public function mailboxRunMessages(): HasMany
    {
        return $this->hasMany(MailboxRunMessage::class);
    }

    private function decodeMimeHeader(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        if (! preg_match('/=\?[^?\s]+\?[bqBQ]\?[^?]*\?=/', $value)) {
            return $value;
        }

        if (function_exists('iconv_mime_decode')) {
            $decoded = iconv_mime_decode($value, ICONV_MIME_DECODE_CONTINUE_ON_ERROR, 'UTF-8');

            if ($decoded !== false) {
                return $decoded;
            }
        }

        if (function_exists('mb_decode_mimeheader')) {
            return mb_decode_mimeheader($value);
        }

        return $value;
    }
}
