import type { MailboxEmail } from '@/Domains/Mailbox/types';
import { formatDateTime } from '@/Shared/Utils/formatDate';

export function formatEmailDate(date: string): string {
    return formatDateTime(date);
}

export function formatEmailSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function buildEmailSource(email: MailboxEmail): string {
    const lines: string[] = [];

    if (email.headers) {
        for (const [key, value] of Object.entries(email.headers)) {
            lines.push(`${key}: ${value}`);
        }
    }

    lines.push('');

    if (email.html_body) lines.push(email.html_body);
    else if (email.text_body) lines.push(email.text_body);

    return lines.join('\n');
}
