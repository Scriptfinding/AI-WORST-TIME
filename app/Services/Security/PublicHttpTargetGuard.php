<?php

namespace App\Services\Security;

final class PublicHttpTargetGuard
{
    /** @return array<string, mixed> */
    public function requestOptions(
        string $url,
        bool $allowPrivateAddresses = false,
        bool $allowHttp = false,
    ): array
    {
        $parts = parse_url($url);
        if (! is_array($parts)) {
            throw new \InvalidArgumentException('Webhook URL is invalid.');
        }

        $scheme = strtolower(is_string($parts['scheme'] ?? null) ? $parts['scheme'] : '');
        $host = strtolower(trim(is_string($parts['host'] ?? null) ? $parts['host'] : '', '[]'));
        if (($scheme !== 'https' && ! ($allowHttp && $scheme === 'http')) || $host === '') {
            throw new \InvalidArgumentException('Target URL must use HTTPS.');
        }
        if (isset($parts['user']) || isset($parts['pass'])) {
            throw new \InvalidArgumentException('Webhook URL must not contain credentials.');
        }
        if (filter_var($host, FILTER_VALIDATE_IP) === false && preg_match('/^[a-z0-9.-]+$/', $host) !== 1) {
            throw new \InvalidArgumentException('Webhook URL hostname is invalid.');
        }

        $port = is_int($parts['port'] ?? null) ? $parts['port'] : ($scheme === 'http' ? 80 : 443);

        $addresses = $this->resolve($host);
        if ($addresses === []) {
            throw new \InvalidArgumentException('Webhook URL must resolve only to public IP addresses.');
        }
        foreach ($addresses as $address) {
            if (! $allowPrivateAddresses && ! $this->isPublic($address)) {
                throw new \InvalidArgumentException('Webhook URL must resolve only to public IP addresses.');
            }
        }

        if (! defined('CURLOPT_PROXY')) {
            throw new \RuntimeException('Secure webhook delivery requires the PHP cURL extension.');
        }
        $curlOptions = [CURLOPT_PROXY => ''];

        if (filter_var($host, FILTER_VALIDATE_IP) !== false) {
            return ['allow_redirects' => false, 'curl' => $curlOptions];
        }
        if (! defined('CURLOPT_RESOLVE')) {
            throw new \RuntimeException('Secure webhook delivery requires the PHP cURL extension.');
        }

        $pinnedAddresses = array_map(
            static fn (string $address): string => str_contains($address, ':') ? "[{$address}]" : $address,
            $addresses,
        );

        return [
            'allow_redirects' => false,
            'curl' => $curlOptions + [
                CURLOPT_RESOLVE => ["{$host}:{$port}:".implode(',', $pinnedAddresses)],
            ],
        ];
    }

    /** @return list<string> */
    private function resolve(string $host): array
    {
        if (filter_var($host, FILTER_VALIDATE_IP) !== false) {
            return [$host];
        }

        $records = @dns_get_record($host, DNS_A | DNS_AAAA);
        if (! is_array($records)) {
            return [];
        }

        $addresses = [];
        foreach ($records as $record) {
            $address = $record['ip'] ?? $record['ipv6'] ?? null;
            if (is_string($address) && filter_var($address, FILTER_VALIDATE_IP) !== false) {
                $addresses[] = $address;
            }
        }

        return array_values(array_unique($addresses));
    }

    private function isPublic(string $address): bool
    {
        if (filter_var(
            $address,
            FILTER_VALIDATE_IP,
            FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE,
        ) === false) {
            return false;
        }

        $packed = @inet_pton($address);
        if (! is_string($packed) || strlen($packed) !== 16) {
            return true;
        }

        $mappedPrefix = str_repeat("\0", 10)."\xff\xff";
        if (str_starts_with($packed, $mappedPrefix)) {
            $mapped = inet_ntop(substr($packed, 12));

            return is_string($mapped) && $this->isPublic($mapped);
        }

        return ! str_starts_with($packed, "\x00\x64\xff\x9b")
            && ! str_starts_with($packed, "\x20\x01\x00\x00")
            && ! str_starts_with($packed, "\x20\x02");
    }
}
