<?php

namespace App\Services\Integration\Other\Vendor\Mailbox;

use App\Models\MailboxDomain;

class DnsService
{
    /** @return list<array{type: string, name: string, value: string, priority: int|null, ttl: int}> */
    public function generateRecords(MailboxDomain $domain): array
    {
        $smtpHost = 'mail.'.$domain->name;

        return [
            [
                'type' => 'A',
                'name' => $smtpHost,
                'value' => 'X.X.X.X',
                'priority' => null,
                'ttl' => 3600,
            ],
            [
                'type' => 'MX',
                'name' => $domain->name,
                'value' => $smtpHost,
                'priority' => 10,
                'ttl' => 3600,
            ],
            [
                'type' => 'TXT',
                'name' => $domain->name,
                'value' => 'v=spf1 mx ~all',
                'priority' => null,
                'ttl' => 3600,
            ],
        ];
    }

    /** @return array{mx: array{expected: string, found: list<string>, valid: bool, error: string|null}, txt: array{expected: string, found: list<string>, valid: bool, error: string|null}} */
    public function verify(MailboxDomain $domain): array
    {
        $expectedMx = 'mail.'.$domain->name;
        $expectedTxt = 'v=spf1 mx ~all';

        return [
            'mx' => $this->checkMx($domain->name, $expectedMx),
            'txt' => $this->checkTxt($domain->name, $expectedTxt),
        ];
    }

    public function getPublicIp(): string
    {
        $ip = @file_get_contents('https://api.ipify.org');

        return $ip ?: '0.0.0.0';
    }

    /** @return array{expected: string, found: list<string>, valid: bool, error: string|null} */
    private function checkMx(string $domainName, string $expected): array
    {
        $result = [
            'expected' => $expected,
            'found' => [],
            'valid' => false,
            'error' => null,
        ];

        $records = @dns_get_record($domainName, DNS_MX);

        if ($records === false || empty($records)) {
            $result['error'] = 'No MX records found';

            return $result;
        }

        foreach ($records as $record) {
            $host = rtrim($record['target'] ?? '', '.');
            $result['found'][] = $host;

            if (strcasecmp($host, $expected) === 0) {
                $result['valid'] = true;
            }
        }

        return $result;
    }

    /** @return array{expected: string, found: list<string>, valid: bool, error: string|null} */
    private function checkTxt(string $domainName, string $expected): array
    {
        $result = [
            'expected' => $expected,
            'found' => [],
            'valid' => false,
            'error' => null,
        ];

        $records = @dns_get_record($domainName, DNS_TXT);

        if ($records === false || empty($records)) {
            $result['error'] = 'No TXT records found';

            return $result;
        }

        foreach ($records as $record) {
            $txt = $record['txt'] ?? '';
            $result['found'][] = $txt;

            if (strcasecmp(trim($txt), $expected) === 0) {
                $result['valid'] = true;
            }
        }

        return $result;
    }
}
