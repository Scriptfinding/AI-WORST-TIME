import type React from 'react';
import type { MailboxDomain, MailboxItem } from '@/Domains/Mailbox/types';

export interface MailboxesPageProps {
    mailboxes: MailboxItem[];
    domains: Pick<MailboxDomain, 'id' | 'name'>[];
    integrations: { id: string; name: string }[];
    teams: { id: Id; name: string }[];
    isAdmin: boolean;
    mailboxGroups?: string[];
}

export interface ConfirmOptions {
    title?: string;
    message: React.ReactNode;
    confirmLabel?: string;
    variant?: 'danger' | 'primary';
}

export type Confirm = (options: ConfirmOptions) => Promise<boolean>;
