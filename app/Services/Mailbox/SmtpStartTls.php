<?php

namespace App\Services\Mailbox;

use React\EventLoop\Loop;
use React\Socket\Connection;
use React\Socket\ConnectionInterface;
use React\Socket\StreamEncryption;
use RuntimeException;
use Throwable;

final class SmtpStartTls
{
    public function validateCertificate(string $certificatePath, string $privateKeyPath): void
    {
        if (! is_readable($certificatePath) || ! is_readable($privateKeyPath)) {
            throw new RuntimeException('SMTP TLS certificate and private key must be readable.');
        }

        $certificate = openssl_x509_read((string) file_get_contents($certificatePath));
        $privateKey = openssl_pkey_get_private((string) file_get_contents($privateKeyPath));

        if ($certificate === false || $privateKey === false) {
            throw new RuntimeException('SMTP TLS certificate or private key is invalid.');
        }

        if (! openssl_x509_check_private_key($certificate, $privateKey)) {
            throw new RuntimeException('SMTP TLS private key does not match the certificate.');
        }
    }

    /**
     * ReactPHP Socket does not expose a public STARTTLS upgrade API. Keep the
     * dependency on its 1.17 internals isolated here.
     *
     * @param  callable(): void  $onSuccess
     * @param  callable(Throwable): void  $onFailure
     */
    public function enable(
        ConnectionInterface $connection,
        string $certificatePath,
        string $privateKeyPath,
        int $timeoutSeconds,
        callable $onSuccess,
        callable $onFailure,
    ): void {
        if (! $connection instanceof Connection || ! is_resource($connection->stream)) {
            $onFailure(new RuntimeException('SMTP connection does not support STARTTLS.'));

            return;
        }

        $cryptoMethod = STREAM_CRYPTO_METHOD_TLSv1_2_SERVER;
        if (defined('STREAM_CRYPTO_METHOD_TLSv1_3_SERVER')) {
            $cryptoMethod |= STREAM_CRYPTO_METHOD_TLSv1_3_SERVER;
        }

        stream_context_set_option($connection->stream, [
            'ssl' => [
                'local_cert' => $certificatePath,
                'local_pk' => $privateKeyPath,
                'verify_peer' => false,
                'verify_peer_name' => false,
                'allow_self_signed' => false,
                'disable_compression' => true,
                'crypto_method' => $cryptoMethod,
            ],
        ]);

        $completed = false;
        $timer = Loop::addTimer($timeoutSeconds, function () use (
            &$completed,
            $connection,
            $onFailure,
        ): void {
            if ($completed) {
                return;
            }

            $completed = true;
            $connection->close();
            $onFailure(new RuntimeException('SMTP STARTTLS handshake timed out.'));
        });

        $encryption = new StreamEncryption(Loop::get(), true);
        $encryption->enable($connection)->then(
            function () use (&$completed, $timer, $onSuccess): void {
                if ($completed) {
                    return;
                }

                $completed = true;
                Loop::cancelTimer($timer);
                $onSuccess();
            },
            function (Throwable $error) use (&$completed, $timer, $onFailure): void {
                if ($completed) {
                    return;
                }

                $completed = true;
                Loop::cancelTimer($timer);
                $onFailure($error);
            },
        );
    }
}
