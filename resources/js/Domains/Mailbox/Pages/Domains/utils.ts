import type { DNSRecord, MailboxDomain } from '@/Domains/Mailbox/types';

export function resolveDnsRecordValue(record: DNSRecord, publicIp: string) {
    return record.value === 'X.X.X.X' ? publicIp : record.value;
}

export function generateZoneFile(domain: MailboxDomain, dnsRecords: DNSRecord[], publicIp: string) {
    const domainParts = domain.name.split('.');
    const isSubdomain = domainParts.length > 2;
    const baseDomain = isSubdomain ? domainParts.slice(1).join('.') : domain.name;
    const subPrefix = isSubdomain ? domainParts[0] : null;

    return dnsRecords.map(record => {
        if (record.type === 'A') {
            const name = isSubdomain ? `mail.${subPrefix}` : 'mail';
            return `${name.padEnd(16)}IN  A     ${resolveDnsRecordValue(record, publicIp)}`;
        }

        if (record.type === 'MX') {
            const name = isSubdomain ? subPrefix : `${domain.name}.`;
            const value = isSubdomain
                ? `mail.${subPrefix}.${baseDomain}.`
                : `mail.${domain.name}.`;

            return `${name!.padEnd(16)}IN  MX ${record.priority} ${value}`;
        }

        const name = isSubdomain ? subPrefix : `${domain.name}.`;
        return `${name!.padEnd(16)}IN  TXT   "${record.value}"`;
    }).join('\n');
}
