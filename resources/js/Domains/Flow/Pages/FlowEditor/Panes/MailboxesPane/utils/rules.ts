import type { MailboxWatcherRule } from '@/Domains/Mailbox/types';
import type { DraftRule } from '@/Domains/Flow/Pages/FlowEditor/Panes/MailboxesPane/types';

export const FIELDS: { value: MailboxWatcherRule['field']; label: string }[] = [
    { value: 'body', label: 'Body' },
    { value: 'subject', label: 'Subject' },
    { value: 'to', label: 'To' },
    { value: 'from', label: 'From' },
    { value: 'has_attachments', label: 'Has Attachments' },
    { value: 'size', label: 'Size' },
];

export const OPERATORS: { value: MailboxWatcherRule['operator']; label: string }[] = [
    { value: 'contains', label: 'Contains' },
    { value: 'not_contains', label: 'Not Contains' },
    { value: 'equals', label: 'Equals' },
    { value: 'greater_than', label: 'Greater Than' },
    { value: 'less_than', label: 'Less Than' },
    { value: 'regex', label: 'Regex' },
];

export function groupDraftRules(rules: DraftRule[]): Record<number, DraftRule[]> {
    return rules.reduce<Record<number, DraftRule[]>>((acc, rule) => {
        acc[rule.rule_group] = acc[rule.rule_group] || [];
        acc[rule.rule_group].push(rule);
        return acc;
    }, {});
}

export function getRuleGroupNumbers(ruleGroups: Record<number, DraftRule[]>): number[] {
    return Object.keys(ruleGroups).map(Number).sort((a, b) => a - b);
}
