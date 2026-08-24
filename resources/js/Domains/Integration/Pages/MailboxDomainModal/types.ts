import type { ScopeTeam } from '@proprietary/Shared/UI/ScopePicker/ScopePicker.pp';
import type { Integration } from '@/Domains/Integration/types';
import type { MailboxDomain } from '@/Domains/Mailbox/types';

export interface MailboxDomainVerifiedResult {
    integration: Integration;
    domain: MailboxDomain;
}

export interface CreateProps {
    mode: 'create';
    teams: ScopeTeam[];
    onClose: () => void;
    onVerified?: (result: MailboxDomainVerifiedResult) => void;
    zIndex?: number;
    quickMode?: boolean;
}

export interface EditProps {
    mode: 'edit';
    integration: Integration;
    teams: ScopeTeam[];
    onClose: () => void;
    onVerified?: (result: MailboxDomainVerifiedResult) => void;
    zIndex?: number;
    quickMode?: boolean;
    onDelete: (integration: Integration) => void;
    isAdmin: boolean;
    deletingId?: Id | null;
}

export type MailboxDomainModalProps = CreateProps | EditProps;
export type MailboxDomainModalView = 'form' | 'domain-list' | 'domain-setup';
export type DomainWithCount = MailboxDomain & { mailboxes_count?: number };
