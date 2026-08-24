import type { MailboxWatcherRule } from '@/Domains/Mailbox/types';
import type { Id } from '@/Shared/types';

export interface MailboxOption {
    id: Id;
    slug: string;
    domain: { id: number; name: string };
}

export interface DraftRule {
    rule_group: number;
    field: MailboxWatcherRule['field'];
    operator: MailboxWatcherRule['operator'];
    value: string;
}
