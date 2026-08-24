<?php

namespace App\Mail;

use App\Contracts\BrandingProvider;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class EmailAuthCode extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $pin,
        public string $magicUrl,
        public int $expiresInMinutes = 10,
    ) {}

    public function envelope(): Envelope
    {
        $name = app(BrandingProvider::class)->current()['name'];

        return new Envelope(subject: "Pin-Code {$this->pin} from {$name}");
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.email-auth',
            text: 'emails.email-auth-text',
        );
    }
}
