import type { User } from '@/App/types';
import type { IntegrationScope } from '@/Domains/Integration/types';
import type { Id } from '@/Shared/types';

export interface MailboxDomain {
    id: number;
    workspace_id: Id;
    integration_id: Id;
    name: string;
    is_verified: boolean;
    is_active: boolean;
    mailboxes_count?: number;
    created_at: string;
    updated_at: string;
}
export interface MailboxItem {
    id: Id;
    slug: string;
    group: string | null;
    description: string | null;
    is_active: boolean;
    address: string;
    domain_id: number;
    domain_name: string;
    integration_id: Id | null;
    integration_name: string | null;
    emails_count: number;
    unread_count: number;
    scope: IntegrationScope;
    team_id: Id | null;
    team_name: string | null;
    user_id: Id | null;
    user_name: string | null;
    owner_workspace_role?: 'admin' | 'manager' | 'member';
    created_at: string;
}
export interface CreatedMailbox {
    id: Id;
    slug: string;
    domain: Pick<MailboxDomain, 'id' | 'name'>;
}
export interface MailboxEmail {
    id: number;
    mailbox_id: Id;
    message_id: string | null;
    from_address: string;
    sender_authentication: 'unverified';
    to_address: string;
    subject: string | null;
    date: string | null;
    headers: Record<string, string> | null;
    text_body: string | null;
    html_body: string | null;
    raw_size: number;
    received_at: string;
    is_read: boolean;
    delivery_status: 'pending' | 'awaiting_run' | 'delivered' | 'unmatched' | 'failed';
    created_at: string;
    updated_at: string;
}
export interface MailboxWatcherRule {
    id?: number;
    mailbox_watcher_id?: Id;
    rule_group: number;
    field: 'body' | 'subject' | 'to' | 'from' | 'has_attachments' | 'size';
    operator: 'contains' | 'not_contains' | 'equals' | 'greater_than' | 'less_than' | 'regex';
    value: string;
}
export interface MailboxWatcher {
    id: Id;
    flow_id: Id;
    user_id: Id | null;
    mailbox_id: Id;
    name: string;
    group: string | null;
    extract_enabled: boolean;
    extract_mode: 'regex' | 'selector';
    extract_expression: string | null;
    is_active: boolean;
    timeout: number | null;
    scope: IntegrationScope;
    team_id: Id | null;
    rules: MailboxWatcherRule[];
    mailbox?: { id: Id; slug: string; domain_id: number; domain?: { id: number; name: string } };
    user?: Pick<User, 'id' | 'name'>;
    team?: { id: Id; name: string } | null;
    owner_workspace_role?: 'admin' | 'manager' | 'member';
    created_at: string;
    updated_at: string;
}
export interface DNSRecord {
    type: string;
    name: string;
    value: string;
    priority: number | null;
    ttl: number;
}
export interface DNSCheckResult {
    mx: { expected: string; found: string[]; valid: boolean; error: string | null };
    txt: { expected: string; found: string[]; valid: boolean; error: string | null };
}
