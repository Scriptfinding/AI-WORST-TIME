import type { DNSRecord, MailboxDomain } from '@/Domains/Mailbox/types';
import { csrfHeaders } from '@/Shared/Utils/csrf';

export async function fetchJson(url: string, options?: RequestInit) {
    return fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...csrfHeaders(),
            ...(options?.headers || {}),
        },
    });
}

export function firstError(value: unknown): string | undefined {
    if (Array.isArray(value)) {
        return typeof value[0] === 'string' ? value[0] : undefined;
    }

    return typeof value === 'string' ? value : undefined;
}

export function generateZoneFile(domain: MailboxDomain, records: DNSRecord[], publicIp: string) {
    const parts = domain.name.split('.');
    const isSubdomain = parts.length > 2;
    const base = isSubdomain ? parts.slice(1).join('.') : domain.name;
    const subdomain = isSubdomain ? parts[0] : null;

    return records.map(record => {
        if (record.type === 'A') {
            const name = isSubdomain ? `mail.${subdomain}` : 'mail';
            const value = record.value === 'X.X.X.X' ? publicIp : record.value;
            return `${name.padEnd(16)}IN  A     ${value}`;
        }

        if (record.type === 'MX') {
            const name = isSubdomain ? subdomain : `${domain.name}.`;
            const value = isSubdomain ? `mail.${subdomain}.${base}.` : `mail.${domain.name}.`;
            return `${name!.padEnd(16)}IN  MX ${record.priority} ${value}`;
        }

        const name = isSubdomain ? subdomain : `${domain.name}.`;
        return `${name!.padEnd(16)}IN  TXT   "${record.value}"`;
    }).join('\n');
}
