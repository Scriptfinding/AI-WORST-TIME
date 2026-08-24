<?php

namespace App\Console\Commands;

use App\Models\Mailbox;
use App\Services\FeatureFlags\FeatureFlagService;
use App\Services\Licensing\LicenseRuntimeGuard;
use App\Services\Mailbox\MailboxEmailIngestionService;
use App\Services\Mailbox\SmtpStartTls;
use Illuminate\Console\Command;
use React\EventLoop\Loop;
use React\Socket\ConnectionInterface;
use React\Socket\SocketServer;

/**
 * @phpstan-type SmtpConnectionState array{
 *     from: string|null,
 *     mail_from_set: bool,
 *     recipients: array<string, array{address: string, mailbox_id: string}>,
 *     data_mode: bool,
 *     data_reserved_bytes: int,
 *     buffer: string,
 *     greeting: 'helo'|'ehlo'|null,
 *     tls_active: bool,
 *     tls_upgrading: bool,
 *     closed: bool
 * }
 */
class MailboxSmtpServe extends Command
{
    private int $activeConnections = 0;

    /** @var array<string, int> */
    private array $connectionsByIp = [];

    private int $bufferedDataBytes = 0;

    protected $signature = 'mailbox:serve {--port=2525 : SMTP listen port}';

    protected $description = 'Start the SMTP server for receiving mailbox emails';

    public function handle(LicenseRuntimeGuard $licenses, SmtpStartTls $startTls): int
    {
        try {
            $licenses->ensure('mailbox SMTP server');
        } catch (\Throwable $e) {
            $this->error($e->getMessage());

            return self::FAILURE;
        }

        $portOption = $this->option('port');
        $configuredPort = config('puppetflow.mailbox_smtp_port', 2525);
        $port = is_numeric($portOption)
            ? (int) $portOption
            : (is_numeric($configuredPort) ? (int) $configuredPort : 2525);
        $configuredHostname = trim($this->configString('puppetflow.mailbox_smtp.hostname'));
        $hostname = $configuredHostname !== '' ? strtolower($configuredHostname) : (gethostname() ?: 'localhost');
        if (! preg_match('/^[a-z0-9](?:[a-z0-9.-]{0,251}[a-z0-9])?$/', $hostname)) {
            $this->error('MAILBOX_SMTP_HOSTNAME must be a valid DNS hostname.');

            return self::FAILURE;
        }

        $tlsEnabled = (bool) config('puppetflow.mailbox_smtp.starttls.enabled', false);
        $certificatePath = $this->configString('puppetflow.mailbox_smtp.starttls.certificate_path');
        $privateKeyPath = $this->configString('puppetflow.mailbox_smtp.starttls.private_key_path');
        if ($tlsEnabled) {
            try {
                $startTls->validateCertificate($certificatePath, $privateKeyPath);
            } catch (\Throwable $e) {
                $this->error($e->getMessage());

                return self::FAILURE;
            }
        }

        $server = new SocketServer("0.0.0.0:{$port}");

        $this->info('['.now()->toDateTimeString()."] SMTP server listening on 0.0.0.0:{$port}");

        $server->on('connection', function (ConnectionInterface $conn) use ($hostname, $startTls) {
            $ipKey = $this->remoteIpKey($conn);
            $maxConnections = $this->configInt('puppetflow.mailbox_smtp.max_connections', 200, 1);
            $maxConnectionsPerIp = $this->configInt('puppetflow.mailbox_smtp.max_connections_per_ip', 10, 1);
            if (
                $this->activeConnections >= $maxConnections
                || ($this->connectionsByIp[$ipKey] ?? 0) >= $maxConnectionsPerIp
            ) {
                $conn->end("421 Too many connections, try again later\r\n");

                return;
            }

            $this->activeConnections++;
            $this->connectionsByIp[$ipKey] = ($this->connectionsByIp[$ipKey] ?? 0) + 1;
            $this->handleConnection($conn, $hostname, $ipKey, $startTls);
        });

        $server->on('error', function (\Exception $e) {
            $this->log("Server error: {$e->getMessage()}", 'error');
        });

        $shutdown = function () use ($server) {
            $this->log('Received shutdown signal, stopping.');
            $server->close();
            Loop::stop();
        };

        Loop::addSignal(SIGTERM, $shutdown);
        Loop::addSignal(SIGINT, $shutdown);

        Loop::run();

        return self::SUCCESS;
    }

    private function handleConnection(
        ConnectionInterface $conn,
        string $hostname,
        string $ipKey,
        SmtpStartTls $startTls,
    ): void {
        $connectionId = substr(bin2hex(random_bytes(8)), 0, 12);
        $maxDataBytes = $this->configInt('puppetflow.mailbox_smtp.max_data_bytes', 26214400, 1024);
        $maxHeaderBytes = $this->configInt('puppetflow.mailbox_smtp.max_header_bytes', 65536, 1024);
        $maxRecipients = $this->configInt('puppetflow.mailbox_smtp.max_recipients', 50, 1);
        $maxCommandBytes = $this->configInt('puppetflow.mailbox_smtp.max_command_bytes', 4096, 256);
        $idleTimeout = $this->configInt('puppetflow.mailbox_smtp.idle_timeout_seconds', 60, 5);
        $dataTimeout = $this->configInt('puppetflow.mailbox_smtp.data_timeout_seconds', 120, 5);
        $maxAggregateDataBytes = $this->configInt(
            'puppetflow.mailbox_smtp.max_aggregate_data_bytes',
            67108864,
            $maxDataBytes,
        );
        $maxMimeDepth = $this->configInt('puppetflow.mailbox_smtp.max_mime_depth', 8, 1);
        $maxMimeParts = $this->configInt('puppetflow.mailbox_smtp.max_mime_parts', 100, 1);
        $tlsEnabled = (bool) config('puppetflow.mailbox_smtp.starttls.enabled', false);
        $tlsRequired = (bool) config('puppetflow.mailbox_smtp.starttls.required', false);
        $tlsCertificatePath = $this->configString('puppetflow.mailbox_smtp.starttls.certificate_path');
        $tlsPrivateKeyPath = $this->configString('puppetflow.mailbox_smtp.starttls.private_key_path');
        $tlsHandshakeTimeout = $this->configInt(
            'puppetflow.mailbox_smtp.starttls.handshake_timeout_seconds',
            10,
            1,
        );
        /** @var SmtpConnectionState $state */
        $state = [
            'from' => null,
            'mail_from_set' => false,
            'recipients' => [],
            'data_mode' => false,
            'data_reserved_bytes' => 0,
            'buffer' => '',
            'greeting' => null,
            'tls_active' => false,
            'tls_upgrading' => false,
            'closed' => false,
        ];
        $conn->write("220 {$hostname} ESMTP Puppetflow Mailbox\r\n");
        $timeoutTimer = null;
        $resetTimeout = function () use (&$timeoutTimer, &$state, $conn, $idleTimeout, $dataTimeout): void {
            if ($timeoutTimer !== null) {
                Loop::cancelTimer($timeoutTimer);
            }
            $seconds = $this->connectionTimeout($state, $idleTimeout, $dataTimeout);
            $timeoutTimer = Loop::addTimer($seconds, function () use (&$state, $conn): void {
                if ($this->connectionIsOpen($state)) {
                    $state['closed'] = true;
                    if ($state['tls_upgrading']) {
                        $conn->close();
                    } else {
                        $conn->end("421 Connection timed out\r\n");
                    }
                }
            });
        };
        $resetTimeout();

        $conn->on('data', function ($chunk) use (
            $conn,
            $hostname,
            $connectionId,
            $maxDataBytes,
            $maxHeaderBytes,
            $maxRecipients,
            $maxCommandBytes,
            $maxAggregateDataBytes,
            $maxMimeDepth,
            $maxMimeParts,
            $tlsEnabled,
            $tlsRequired,
            $tlsCertificatePath,
            $tlsPrivateKeyPath,
            $tlsHandshakeTimeout,
            $startTls,
            &$state,
            $resetTimeout,
        ): void {
            if (! is_string($chunk) || $state['closed'] || $state['tls_upgrading']) {
                return;
            }
            $state['buffer'] .= $chunk;
            $resetTimeout();

            while ($state['buffer'] !== '' && ! $state['closed']) {
                if ($state['data_mode']) {
                    $unreservedBytes = strlen($state['buffer']) - $state['data_reserved_bytes'];
                    if ($unreservedBytes > 0
                        && ! $this->reserveDataBytes($state, $unreservedBytes, $maxAggregateDataBytes)
                    ) {
                        $state['closed'] = true;
                        $this->releaseDataBudget($state);
                        $conn->end("452 Insufficient system storage\r\n");

                        return;
                    }
                    $emptyMessage = str_starts_with($state['buffer'], ".\r\n");
                    if ($emptyMessage) {
                        $raw = '';
                        $state['buffer'] = substr($state['buffer'], 3);
                    } else {
                        $terminatorPosition = strpos($state['buffer'], "\r\n.\r\n");
                        if ($terminatorPosition === false) {
                            if (strlen($state['buffer']) > $maxDataBytes + 5) {
                                $state['closed'] = true;
                                $conn->end("552 Message exceeds fixed maximum message size\r\n");
                            }

                            return;
                        }
                        $raw = substr($state['buffer'], 0, $terminatorPosition + 2);
                        $state['buffer'] = substr($state['buffer'], $terminatorPosition + 5);
                    }
                    $state['data_mode'] = false;
                    if (strlen($raw) > $maxDataBytes) {
                        $conn->write("552 Message exceeds fixed maximum message size\r\n");
                        $this->resetEnvelope($state);
                        $resetTimeout();

                        continue;
                    }
                    $raw = $this->dotUnstuff($raw);
                    if ($this->headerLength($raw) > $maxHeaderBytes) {
                        $conn->write("552 Message headers exceed fixed maximum size\r\n");
                        $this->resetEnvelope($state);
                        $resetTimeout();

                        continue;
                    }

                    $conn->pause();
                    try {
                        $result = $this->processEmail(
                            $raw,
                            $state['from'],
                            $state['recipients'],
                            $maxMimeDepth,
                            $maxMimeParts,
                        );
                        $conn->write($result
                            ? "250 OK message accepted\r\n"
                            : "250 OK message stored without active delivery\r\n");
                    } catch (\LengthException) {
                        $conn->write("552 Message MIME structure exceeds fixed limits\r\n");
                    } catch (\Throwable) {
                        $this->log("Delivery failed for connection {$connectionId}; sender may retry.", 'error');
                        $conn->write("451 Temporary local delivery failure\r\n");
                    } finally {
                        if ($this->connectionIsOpen($state)) {
                            $conn->resume();
                        }
                    }
                    $this->resetEnvelope($state);
                    $resetTimeout();

                    continue;
                }

                $lineEnd = strpos($state['buffer'], "\r\n");
                if ($lineEnd === false) {
                    if (strlen($state['buffer']) > $maxCommandBytes) {
                        $state['closed'] = true;
                        $conn->end("500 Command line too long\r\n");
                    }

                    return;
                }
                if ($lineEnd > $maxCommandBytes) {
                    $state['closed'] = true;
                    $conn->end("500 Command line too long\r\n");

                    return;
                }

                $line = trim(substr($state['buffer'], 0, $lineEnd));
                $state['buffer'] = substr($state['buffer'], $lineEnd + 2);
                if ($line === '') {
                    continue;
                }
                $upper = strtoupper($line);

                if (preg_match('/^EHLO(?:\s+\S.*)?$/i', $line)) {
                    $state['greeting'] = 'ehlo';
                    $this->resetEnvelope($state);
                    $capabilities = ["250-{$hostname} Hello", "250-SIZE {$maxDataBytes}"];
                    if ($tlsEnabled && ! $state['tls_active']) {
                        $capabilities[] = '250-STARTTLS';
                    }
                    $capabilities[] = '250 OK';
                    $conn->write(implode("\r\n", $capabilities)."\r\n");
                } elseif (preg_match('/^HELO(?:\s+\S.*)?$/i', $line)) {
                    $state['greeting'] = 'helo';
                    $this->resetEnvelope($state);
                    $conn->write("250 {$hostname} Hello\r\n");
                } elseif (str_starts_with($upper, 'STARTTLS')) {
                    if (! $tlsEnabled) {
                        $conn->write("502 Command not implemented\r\n");
                    } elseif ($upper !== 'STARTTLS') {
                        $conn->write("501 Syntax: STARTTLS\r\n");
                    } elseif ($state['tls_active']) {
                        $conn->write("503 TLS already active\r\n");
                    } elseif ($state['greeting'] !== 'ehlo') {
                        $conn->write("503 EHLO required before STARTTLS\r\n");
                    } elseif ($state['mail_from_set'] || $state['recipients'] !== []) {
                        $conn->write("503 STARTTLS not permitted during a mail transaction\r\n");
                    } elseif ($state['buffer'] !== '') {
                        $state['closed'] = true;
                        $conn->end("554 Pipelining not permitted with STARTTLS\r\n");
                    } else {
                        $state['tls_upgrading'] = true;
                        $state['greeting'] = null;
                        $this->resetEnvelope($state);
                        $conn->write("220 Ready to start TLS\r\n");
                        $conn->pause();
                        Loop::futureTick(function () use (
                            $conn,
                            $startTls,
                            $tlsCertificatePath,
                            $tlsPrivateKeyPath,
                            $tlsHandshakeTimeout,
                            &$state,
                            $resetTimeout,
                            $connectionId,
                        ): void {
                            if ($state['closed']) {
                                return;
                            }

                            $startTls->enable(
                                $conn,
                                $tlsCertificatePath,
                                $tlsPrivateKeyPath,
                                $tlsHandshakeTimeout,
                                function () use (&$state, $resetTimeout): void {
                                    $state['tls_upgrading'] = false;
                                    $state['tls_active'] = true;
                                    $state['greeting'] = null;
                                    $state['buffer'] = '';
                                    $this->resetEnvelope($state);
                                    $resetTimeout();
                                },
                                function (\Throwable $error) use (&$state, $conn, $connectionId): void {
                                    $state['closed'] = true;
                                    $conn->close();
                                    $this->log(
                                        "STARTTLS failed for connection {$connectionId}: {$error->getMessage()}",
                                        'warn',
                                    );
                                },
                            );
                        });

                        return;
                    }
                } elseif (str_starts_with($upper, 'MAIL FROM:')) {
                    if ($state['greeting'] === null) {
                        $conn->write("503 HELO or EHLO required\r\n");
                    } elseif ($tlsRequired && ! $state['tls_active']) {
                        $conn->write("530 Must issue a STARTTLS command first\r\n");
                    } else {
                        $this->resetEnvelope($state);
                        $state['from'] = $this->extractAddress($line);
                        $state['mail_from_set'] = true;
                        $conn->write("250 OK\r\n");
                    }
                } elseif (str_starts_with($upper, 'RCPT TO:')) {
                    if (! $state['mail_from_set']) {
                        $conn->write("503 MAIL command required\r\n");

                        continue;
                    }
                    if (count($state['recipients']) >= $maxRecipients) {
                        $conn->write("452 Too many recipients\r\n");

                        continue;
                    }
                    $address = $this->extractAddress($line);
                    $validation = is_string($address) ? $this->validateRecipient($address) : null;
                    if ($validation === null) {
                        $conn->write("550 Mailbox not found\r\n");
                    } else {
                        $recipientKey = $validation['mailbox_id'].'|'.mb_strtolower($validation['address']);
                        $state['recipients'][$recipientKey] = $validation;
                        $conn->write("250 OK\r\n");
                    }
                } elseif ($upper === 'DATA') {
                    if (! $state['mail_from_set']) {
                        $conn->write("503 MAIL command required\r\n");
                    } elseif ($state['recipients'] === []) {
                        $conn->write("554 No valid recipients\r\n");
                    } else {
                        $state['data_mode'] = true;
                        $conn->write("354 Start mail input; end with <CRLF>.<CRLF>\r\n");
                        $resetTimeout();
                    }
                } elseif ($upper === 'QUIT') {
                    $state['closed'] = true;
                    $conn->end("221 Bye\r\n");
                } elseif ($upper === 'RSET') {
                    $this->resetEnvelope($state);
                    $conn->write("250 OK\r\n");
                } elseif ($upper === 'NOOP') {
                    $conn->write("250 OK\r\n");
                } else {
                    $conn->write("502 Command not implemented\r\n");
                }
            }
        });

        $conn->on('close', function () use (&$timeoutTimer, &$state, $ipKey): void {
            $state['closed'] = true;
            $this->releaseDataBudget($state);
            if ($timeoutTimer !== null) {
                Loop::cancelTimer($timeoutTimer);
            }
            $this->activeConnections = max(0, $this->activeConnections - 1);
            $this->connectionsByIp[$ipKey] = max(0, ($this->connectionsByIp[$ipKey] ?? 1) - 1);
            if ($this->connectionsByIp[$ipKey] === 0) {
                unset($this->connectionsByIp[$ipKey]);
            }
        });

        $conn->on('error', function () use ($connectionId, &$state): void {
            $this->releaseDataBudget($state);
            $this->log("Connection {$connectionId} closed after a transport error.", 'warn');
        });
    }

    /** @param array{data_mode: bool} $state */
    private function connectionTimeout(array $state, int $idleTimeout, int $dataTimeout): int
    {
        return $state['data_mode'] ? $dataTimeout : $idleTimeout;
    }

    /** @param array{closed: bool} $state */
    private function connectionIsOpen(array $state): bool
    {
        return ! $state['closed'];
    }

    private function configInt(string $key, int $default, int $minimum): int
    {
        $configured = config($key, $default);

        return max($minimum, is_numeric($configured) ? (int) $configured : $default);
    }

    private function configString(string $key, string $default = ''): string
    {
        $configured = config($key, $default);

        return is_string($configured) ? $configured : $default;
    }

    /**
     * @param  SmtpConnectionState  $state
     *
     * @param-out SmtpConnectionState $state
     */
    private function resetEnvelope(array &$state): void
    {
        $this->releaseDataBudget($state);
        $state['from'] = null;
        $state['mail_from_set'] = false;
        $state['recipients'] = [];
        $state['data_mode'] = false;
    }

    /**
     * @param  SmtpConnectionState  $state
     *
     * @param-out SmtpConnectionState $state
     */
    private function reserveDataBytes(array &$state, int $bytes, int $maximum): bool
    {
        if ($bytes < 1) {
            return true;
        }
        if ($this->bufferedDataBytes + $bytes > $maximum) {
            return false;
        }

        $this->bufferedDataBytes += $bytes;
        $state['data_reserved_bytes'] += $bytes;

        return true;
    }

    /**
     * @param  SmtpConnectionState  $state
     *
     * @param-out SmtpConnectionState $state
     */
    private function releaseDataBudget(array &$state): void
    {
        $reserved = max(0, $state['data_reserved_bytes']);
        $this->bufferedDataBytes = max(0, $this->bufferedDataBytes - $reserved);
        $state['data_reserved_bytes'] = 0;
    }

    private function dotUnstuff(string $raw): string
    {
        return preg_replace('/(^|\r\n)\.\./', '$1.', $raw) ?? $raw;
    }

    private function headerLength(string $raw): int
    {
        $headerEnd = strpos($raw, "\r\n\r\n");
        if ($headerEnd === false) {
            $headerEnd = strpos($raw, "\n\n");
        }

        return $headerEnd === false ? strlen($raw) : $headerEnd;
    }

    private function remoteIpKey(ConnectionInterface $connection): string
    {
        $remote = $connection->getRemoteAddress();
        $host = is_string($remote) ? parse_url($remote, PHP_URL_HOST) : null;

        return is_string($host) && $host !== '' ? $host : 'unknown';
    }

    private function extractAddress(string $line): ?string
    {
        if (preg_match('/<([^>]*)>/', $line, $m)) {
            return $m[1] !== '' ? $m[1] : null;
        }

        $parts = explode(':', $line, 2);
        $address = trim($parts[1] ?? $line);

        return $address !== '' ? $address : null;
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

    /** @param array<string, array{address: string, mailbox_id: string}> $recipients */
    private function processEmail(
        string $raw,
        ?string $from,
        array $recipients,
        int $maxMimeDepth,
        int $maxMimeParts,
    ): bool {
        $rawSize = strlen($raw);

        $headerEnd = strpos($raw, "\r\n\r\n");
        $headerSeparatorLength = 4;
        if ($headerEnd === false) {
            $headerEnd = strpos($raw, "\n\n");
            $headerSeparatorLength = 2;
        }

        $headerBlock = $headerEnd !== false ? substr($raw, 0, $headerEnd) : $raw;
        $bodyBlock = $headerEnd !== false ? substr($raw, $headerEnd + $headerSeparatorLength) : '';

        $headers = $this->parseHeaders($headerBlock);
        $subject = $this->decodeHeaderValue($headers['Subject'] ?? $headers['subject'] ?? null);
        $messageId = $headers['Message-ID'] ?? $headers['Message-Id'] ?? $headers['message-id'] ?? null;
        $dateStr = $headers['Date'] ?? $headers['date'] ?? null;
        $date = null;

        if ($dateStr) {
            try {
                $date = new \DateTime($dateStr);
            } catch (\Exception) {
                $date = null;
            }
        }

        $contentType = $headers['Content-Type'] ?? $headers['content-type'] ?? 'text/plain';
        $textBody = '';
        $htmlBody = '';

        if (stripos($contentType, 'multipart/') !== false) {
            $partCount = 0;
            $this->parseMultipart(
                $contentType,
                $bodyBlock,
                $textBody,
                $htmlBody,
                1,
                $partCount,
                $maxMimeDepth,
                $maxMimeParts,
            );
        } elseif (stripos($contentType, 'text/html') !== false) {
            $htmlBody = $this->decodeBody($bodyBlock, $headers);
        } else {
            $textBody = $this->decodeBody($bodyBlock, $headers);
        }

        $recipientCount = count($recipients);
        $this->log("Processing email: size={$rawSize}B recipients={$recipientCount}");

        $delivered = false;
        $ingestion = app(MailboxEmailIngestionService::class);
        foreach ($recipients as $rcpt) {
            $result = $ingestion->ingest(
                $rcpt['mailbox_id'],
                is_string($messageId) ? $messageId : null,
                $raw,
                [
                    'from_address' => $from ?? 'unknown',
                    'to_address' => $rcpt['address'],
                    'subject' => $subject,
                    'date' => $date,
                    'headers' => $headers,
                    'text_body' => $textBody,
                    'html_body' => $htmlBody,
                    'raw_size' => $rawSize,
                    'received_at' => now(),
                ],
            );
            $delivered = $result['delivered'] || $delivered;
        }

        return $delivered;
    }

    /** @return array<string, string> */
    private function parseHeaders(string $headerBlock): array
    {
        $headers = [];
        $currentKey = null;

        $lines = preg_split('/\r?\n/', $headerBlock);
        foreach ($lines === false ? [] : $lines as $line) {
            if ($line === '') {
                break;
            }

            if (preg_match('/^(\S+):\s*(.*)$/', $line, $m)) {
                $currentKey = $m[1];
                $headers[$currentKey] = $m[2];
            } elseif ($currentKey && preg_match('/^\s+(.*)$/', $line, $m)) {
                $headers[$currentKey] .= ' '.$m[1];
            }
        }

        return $headers;
    }

    private function decodeHeaderValue(?string $value): ?string
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

    /** @param array<string, string> $headers */
    private function decodeBody(string $body, array $headers): string
    {
        $encoding = $headers['Content-Transfer-Encoding'] ?? $headers['content-transfer-encoding'] ?? '7bit';

        return match (strtolower(trim($encoding))) {
            'base64' => ($decoded = base64_decode($body, true)) !== false ? $decoded : '',
            'quoted-printable' => quoted_printable_decode($body),
            default => $body,
        };
    }

    private function parseMultipart(
        string $contentType,
        string $body,
        string &$textBody,
        string &$htmlBody,
        int $depth,
        int &$partCount,
        int $maxDepth,
        int $maxParts,
    ): void {
        if ($depth > $maxDepth) {
            throw new \LengthException('MIME nesting depth exceeded.');
        }
        if (! preg_match('/boundary="?([^";]+)"?/i', $contentType, $m)) {
            $textBody = $body;

            return;
        }

        $boundary = $m[1];
        $remainingParts = $maxParts - $partCount;
        if ($remainingParts < 1) {
            throw new \LengthException('MIME part count exceeded.');
        }
        $parts = $this->multipartParts($body, $boundary, $remainingParts);

        foreach ($parts as $part) {
            if ($part === '') {
                continue;
            }
            $partCount++;
            if ($partCount > $maxParts) {
                throw new \LengthException('MIME part count exceeded.');
            }

            $partHeaderEnd = strpos($part, "\r\n\r\n");
            $partHeaderSeparatorLength = 4;
            if ($partHeaderEnd === false) {
                $partHeaderEnd = strpos($part, "\n\n");
                $partHeaderSeparatorLength = 2;
            }
            if ($partHeaderEnd === false) {
                continue;
            }

            $partHeaders = $this->parseHeaders(substr($part, 0, $partHeaderEnd));
            $partBody = substr($part, $partHeaderEnd + $partHeaderSeparatorLength);
            $partContentType = $partHeaders['Content-Type'] ?? $partHeaders['content-type'] ?? 'text/plain';

            if (stripos($partContentType, 'multipart/') !== false) {
                $this->parseMultipart(
                    $partContentType,
                    $partBody,
                    $textBody,
                    $htmlBody,
                    $depth + 1,
                    $partCount,
                    $maxDepth,
                    $maxParts,
                );
            } elseif (stripos($partContentType, 'text/html') !== false) {
                $htmlBody = $this->decodeBody($partBody, $partHeaders);
            } elseif (stripos($partContentType, 'text/plain') !== false) {
                $textBody = $this->decodeBody($partBody, $partHeaders);
            }
        }
    }

    /** @return list<string> */
    private function multipartParts(string $body, string $boundary, int $maximum): array
    {
        $pattern = '/(?:\A|\r\n|\n)--'.preg_quote($boundary, '/').'(--)?[ \t]*(?:\r\n|\n|\z)/';
        $matchCount = preg_match_all($pattern, $body, $matches, PREG_OFFSET_CAPTURE);
        if (! is_int($matchCount) || $matchCount === 0) {
            return [];
        }

        $parts = [];
        $partStart = null;
        $startedParts = 0;
        for ($index = 0; $index < $matchCount; $index++) {
            $delimiter = $matches[0][$index];
            $delimiterText = $delimiter[0];
            $delimiterOffset = $delimiter[1];

            if ($partStart !== null) {
                $parts[] = substr($body, $partStart, $delimiterOffset - $partStart);
            }

            $closing = isset($matches[1][$index][0]) && $matches[1][$index][0] === '--';
            if ($closing) {
                return $parts;
            }

            $startedParts++;
            if ($startedParts > $maximum) {
                throw new \LengthException('MIME part count exceeded.');
            }
            $partStart = $delimiterOffset + strlen($delimiterText);
        }

        $parts[] = substr($body, $partStart);

        return $parts;
    }

    private function log(string $message, string $level = 'info'): void
    {
        $timestamp = now()->toDateTimeString();
        $tag = strtoupper($level);

        match ($level) {
            'error' => $this->error("[{$timestamp}] [{$tag}] {$message}"),
            'warn' => $this->warn("[{$timestamp}] [{$tag}] {$message}"),
            default => $this->line("[{$timestamp}] [{$tag}] {$message}"),
        };
    }
}
