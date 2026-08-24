<?php

namespace App\Mail;

use App\Contracts\BrandingProvider;
use App\Models\WorkspaceInvitation;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class WorkspaceInvitationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public WorkspaceInvitation $invitation,
    ) {}

    public function envelope(): Envelope
    {
        $appName = app(BrandingProvider::class)->current()['name'];

        return new Envelope(
            subject: "You've been invited to join {$this->invitation->workspace->name} on {$appName}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.workspace-invitation',
            text: 'emails.workspace-invitation-text',
        );
    }
}
