<?php

namespace App\Console\Commands;

use App\Models\Mailbox;
use App\Services\FeatureFlags\FeatureFlagService;
use App\Services\Licensing\LicenseRuntimeGuard;
use App\Services\Mailbox\MailboxEmailIngestionService;
use Illuminate\Console\Command;

class MailboxSimulateEmail extends Command
{
    protected $signature = 'mailbox:simulate
        {--t|to= : Recipient address (e.g. support@kapside.com)}
        {--from=simulator@puppetflow.local : Sender address}
        {--subject=Test Email : Email subject}
        {--b|body= : Email body text (inline)}
        {--f|file= : Path to a file whose contents will be used as the body}';

    protected $description = 'Simulate receiving an email on a mailbox (bypasses SMTP)';

    public function handle(LicenseRuntimeGuard $licenses, MailboxEmailIngestionService $ingestion): int
    {
        try {
            $licenses->ensure('mailbox simulator');
        } catch (\Throwable $e) {
            $this->error($e->getMessage());

            return self::FAILURE;
        }

        $to = $this->option('to');
        if (! $to) {
            $this->error('The --to (-t) option is required.');

            return self::FAILURE;
        }

        $from = $this->option('from');
        $subject = $this->option('subject');

        $body = $this->option('body');
        $file = $this->option('file');

        if ($file) {
            if (! file_exists($file)) {
                $this->error("File not found: {$file}");

                return self::FAILURE;
            }
            $body = file_get_contents($file);
        }

        if (! $body) {
            $body = 'This is a simulated test email from Puppetflow.';
        }

        $recipient = $this->validateRecipient($to);
        if (! $recipient) {
            $this->error("No active mailbox found for <{$to}>. Check that the domain and mailbox exist and are active.");

            return self::FAILURE;
        }

        $this->info('Simulating email delivery.');
        $this->line("  Mailbox: #{$recipient['mailbox_id']}");
        $this->line('  Body size: '.strlen($body).' bytes');
        $this->newLine();

        $messageId = '<sim-'.bin2hex(random_bytes(16)).'@puppetflow.local>';
        $result = $ingestion->ingest(
            $recipient['mailbox_id'],
            $messageId,
            implode("\n", [(string) $from, (string) $to, (string) $subject, (string) $body]),
            [
                'from_address' => $from,
                'to_address' => $to,
                'subject' => $subject,
                'date' => now(),
                'headers' => [
                    'From' => $from,
                    'To' => $to,
                    'Subject' => $subject,
                    'Date' => now()->toRfc2822String(),
                ],
                'text_body' => $body,
                'html_body' => null,
                'raw_size' => strlen($body),
                'received_at' => now(),
            ],
        );
        $email = $result['email'];

        $this->info("Email stored (id: {$email->id}) for mailbox #{$recipient['mailbox_id']}");

        if (! $result['delivered']) {
            $this->newLine();
            $this->error('Email was stored, but no authorized running flow accepted it.');

            return self::FAILURE;
        }

        $this->newLine();
        $this->info('Done.');

        return self::SUCCESS;
    }

    /** @return array{address: string, mailbox_id: string}|null */
    private function validateRecipient(string $address): ?array
    {
        if (! app(FeatureFlagService::class)->enabled('mailbox_enabled')) {
            return null;
        }

        $parts = explode('@', $address, 2);
        if (count($parts) !== 2) {
            return null;
        }

        [$localPart, $domainName] = $parts;
        $domainName = strtolower($domainName);
        $slug = strtolower($localPart);

        if (($plusPos = strpos($slug, '+')) !== false) {
            $slug = substr($slug, 0, $plusPos);
        }

        $mailbox = Mailbox::where('address', Mailbox::normalizeAddress($slug, $domainName))
            ->where('is_active', true)
            ->where('stale', false)
            ->whereHas('domain', fn ($query) => $query
                ->where('is_verified', true)
                ->where('is_active', true)
                ->where('stale', false))
            ->first();
        if (! $mailbox) {
            return null;
        }

        $mailboxId = $mailbox->getKey();

        return [
            'address' => $address,
            'mailbox_id' => is_string($mailboxId) ? $mailboxId : '',
        ];
    }
}
