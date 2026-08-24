import { useMemo } from 'react';
import type { MailboxItem } from '@/Domains/Mailbox/types';

export interface GroupHeader {
    label: string;
    depth: number;
    key: string;
    count: number;
}

export interface GroupedMailboxSection {
    headers: GroupHeader[];
    items: MailboxItem[];
    groupKey: string;
}

function groupByDomain(mailboxes: MailboxItem[]) {
    return mailboxes.reduce<Record<string, MailboxItem[]>>((groups, mailbox) => {
        (groups[mailbox.domain_name] ??= []).push(mailbox);
        return groups;
    }, {});
}

// Builds the nested group and domain sections rendered by the mailbox sidebar.
export function useMailboxSections(mailboxes: MailboxItem[]) {
    return useMemo(() => {
        const groupedMailboxes = mailboxes.filter(mailbox => mailbox.group);
        const ungroupedMailboxes = mailboxes.filter(mailbox => !mailbox.group);

        if (groupedMailboxes.length === 0) {
            return {
                hasGroups: false,
                sections: [] as GroupedMailboxSection[],
                domainGroups: groupByDomain(mailboxes),
            };
        }

        const mailboxesByGroup = groupedMailboxes.reduce<Record<string, MailboxItem[]>>(
            (groups, mailbox) => {
                (groups[mailbox.group!] ??= []).push(mailbox);
                return groups;
            },
            {},
        );
        const groupNames = Object.keys(mailboxesByGroup).sort();
        const groupCounts: Record<string, number> = {};

        for (const groupName of groupNames) {
            const count = mailboxesByGroup[groupName].length;
            const parts = groupName.split('/');
            for (let index = 0; index < parts.length; index++) {
                const path = parts.slice(0, index + 1).join('/');
                groupCounts[path] = (groupCounts[path] ?? 0) + count;
            }
        }

        const renderedHeaders = new Set<string>();
        const sections = groupNames.map(groupName => {
            const headers: GroupHeader[] = [];
            const parts = groupName.split('/');

            for (let index = 0; index < parts.length; index++) {
                const key = parts.slice(0, index + 1).join('/');
                if (!renderedHeaders.has(key)) {
                    renderedHeaders.add(key);
                    headers.push({
                        label: parts[index],
                        depth: index,
                        key,
                        count: groupCounts[key] ?? 0,
                    });
                }
            }

            return { headers, items: mailboxesByGroup[groupName], groupKey: groupName };
        });

        return {
            hasGroups: true,
            sections,
            domainGroups: groupByDomain(ungroupedMailboxes),
        };
    }, [mailboxes]);
}
