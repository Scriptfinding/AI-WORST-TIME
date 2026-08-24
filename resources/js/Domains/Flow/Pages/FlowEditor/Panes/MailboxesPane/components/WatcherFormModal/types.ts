import type { useConfirm } from '@/Shared/Hooks/useConfirm';
import type { IntegrationScope } from '@/Domains/Integration/types';
import type { MailboxWatcher } from '@/Domains/Mailbox/types';
import type { DraftRule, MailboxOption } from '@/Domains/Flow/Pages/FlowEditor/Panes/MailboxesPane/types';

export type WorkspaceRole = 'admin' | 'manager' | 'member';

export interface WatcherFormValues {
    name: string;
    group: string;
    mailboxId: Id;
    extractEnabled: boolean;
    extractMode: 'regex' | 'selector';
    extractExpr: string;
    isActive: boolean;
    rules: DraftRule[];
    timeout: string;
    scope: IntegrationScope;
    teamId: Id | null;
    ownerId: Id | null;
    targetUserRole?: string;
}

export interface WatcherFormModalProps {
    isOpen: boolean;
    editing: MailboxWatcher | null;
    flowId: Id;
    isNodalFlow: boolean;
    groups: string[];
    mailboxes: MailboxOption[];
    teams: { id: Id; name: string }[];
    confirm: ReturnType<typeof useConfirm>['confirm'];
    onClose: () => void;
    onCreated: (watcher: MailboxWatcher, group: string) => void;
    onUpdated: (watcher: MailboxWatcher, group: string, hideAfterTransfer: boolean) => void;
    zIndex?: number;
    quickMode?: boolean;
}
