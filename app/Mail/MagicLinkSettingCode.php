<?php

namespace App\Mail;

use App\Contracts\BrandingProvider;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class MagicLinkSettingCode extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $pin,
        public int $expiresInMinutes = 10,
    ) {}

    public function envelope(): Envelope
    {
        $name = app(BrandingProvider::class)->current()['name'];

        return new Envelope(subject: "Confirm passwordless sign-in for {$name}: {$this->pin}");
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.magic-link-setting',
            text: 'emails.magic-link-setting-text',
        );
    }
}
