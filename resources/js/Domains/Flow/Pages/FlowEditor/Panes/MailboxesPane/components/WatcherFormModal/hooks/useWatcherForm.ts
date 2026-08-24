import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/App/Hooks/usePageProps';
import { useToast } from '@/App/Hooks/useToast';
import { ADMIN_TRANSFER_WARNING, canEditOwnership } from '@/Shared/Utils/ownershipPermissions';
import type { DraftRule } from '@/Domains/Flow/Pages/FlowEditor/Panes/MailboxesPane/types';
import { fetchMailboxWatcherJson } from '@/Domains/Flow/Pages/FlowEditor/Panes/MailboxesPane/utils/mailboxWatcherApi';
import { getRuleGroupNumbers, groupDraftRules } from '@/Domains/Flow/Pages/FlowEditor/Panes/MailboxesPane/utils/rules';
import { invalidateWatcherCache } from '@/Domains/Flow/Pages/FlowEditor/utils/mailboxWatcherSuggestions';
import type { MailboxWatcher } from '@/Domains/Mailbox/types';
import type {
    WatcherFormModalProps,
    WatcherFormValues,
    WorkspaceRole,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/MailboxesPane/components/WatcherFormModal/types';

function getInitialValues(
    editing: WatcherFormModalProps['editing'],
    mailboxes: WatcherFormModalProps['mailboxes'],
): WatcherFormValues {
    return {
        name: editing?.name ?? '',
        group: editing?.group || '',
        mailboxId: editing?.mailbox?.id ?? mailboxes[0]?.id ?? '',
        extractEnabled: editing?.extract_enabled ?? false,
        extractMode: editing?.extract_mode || 'regex',
        extractExpr: editing?.extract_expression || '',
        isActive: editing?.is_active ?? true,
        rules: editing?.rules.map(rule => ({
            rule_group: rule.rule_group,
            field: rule.field,
            operator: rule.operator,
            value: rule.value,
        })) ?? [],
        timeout: editing?.timeout != null ? String(editing.timeout / 1000) : '',
        scope: editing?.scope || 'owner',
        teamId: editing?.team_id ?? null,
        ownerId: editing?.user_id ?? null,
        targetUserRole: editing?.owner_workspace_role,
    };
}

// Manages WatcherFormModal values, validation, and create-or-update submission.
export default function useWatcherForm(props: WatcherFormModalProps) {
    const {
        isOpen,
        editing,
        flowId,
        mailboxes,
        confirm,
        onClose,
        onCreated,
        onUpdated,
    } = props;
    const [values, setValues] = useState<WatcherFormValues>(() => getInitialValues(editing, mailboxes));
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();
    const { user } = useAuth();

    const currentUserId = user?.id ?? '';
    const currentUserWorkspaceRole = (
        user as { workspace_role?: WorkspaceRole } | null | undefined
    )?.workspace_role ?? 'member';
    const ownershipDisabled = useMemo(() => editing ? !canEditOwnership({
        currentUserId,
        currentUserWorkspaceRole,
        resourceOwnerId: editing.user_id,
        ownerWorkspaceRole: editing.owner_workspace_role,
    }) : false, [currentUserId, currentUserWorkspaceRole, editing]);

    useEffect(() => {
        if (isOpen) setValues(getInitialValues(editing, mailboxes));
        // Resource refreshes must not reset fields already entered in an open form.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editing?.id, isOpen]);

    const updateField = <K extends keyof WatcherFormValues>(field: K, value: WatcherFormValues[K]) => {
        setValues(previous => ({ ...previous, [field]: value }));
    };

    const addRule = (ruleGroup: number) => {
        updateField('rules', [
            ...values.rules,
            { rule_group: ruleGroup, field: 'subject', operator: 'contains', value: '' },
        ]);
    };

    const addRuleGroup = () => {
        const groupNumbers = getRuleGroupNumbers(groupDraftRules(values.rules));
        addRule(groupNumbers.length > 0 ? Math.max(...groupNumbers) + 1 : 0);
    };

    const updateRule = (index: number, field: keyof DraftRule, value: string) => {
        updateField('rules', values.rules.map((rule, ruleIndex) => (
            ruleIndex === index ? { ...rule, [field]: value } as DraftRule : rule
        )));
    };

    const removeRule = (index: number) => {
        updateField('rules', values.rules.filter((_, ruleIndex) => ruleIndex !== index));
    };

    const confirmSensitiveChanges = async () => {
        if (!editing || !values.ownerId || values.ownerId === editing.user_id || values.ownerId === user?.id) {
            return true;
        }

        if (currentUserWorkspaceRole === 'manager' && values.targetUserRole === 'admin') {
            return confirm({
                title: 'Transfer ownership',
                message: ADMIN_TRANSFER_WARNING,
                confirmLabel: 'Transfer anyway',
                variant: 'danger',
            });
        }

        if (values.scope === 'owner') {
            return confirm({
                title: 'Transfer ownership',
                message: 'This watcher has personal visibility. By transferring it to another user, you will permanently lose access to it.',
                confirmLabel: 'Transfer anyway',
                variant: 'danger',
            });
        }

        return true;
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!values.name.trim() || !values.mailboxId || !await confirmSensitiveChanges()) return;

        setSaving(true);
        const parsedTimeout = values.timeout.trim() ? Math.round(parseFloat(values.timeout) * 1000) : null;
        const payload: Record<string, unknown> = {
            name: values.name.trim(),
            group: values.group || null,
            mailbox_id: values.mailboxId,
            extract_enabled: values.extractEnabled,
            extract_mode: values.extractMode,
            extract_expression: values.extractEnabled ? values.extractExpr : null,
            is_active: values.isActive,
            timeout: parsedTimeout && parsedTimeout >= 1000 ? parsedTimeout : null,
            scope: values.scope,
            team_id: values.scope === 'team' ? values.teamId : null,
            rules: values.rules.filter(rule => rule.value.trim() !== ''),
        };
        if (editing && values.ownerId && values.ownerId !== editing.user_id) {
            payload.user_id = values.ownerId;
        }

        try {
            const url = editing
                ? `/flows/${flowId}/mailbox-watchers/${editing.id}`
                : `/flows/${flowId}/mailbox-watchers`;
            const response = await fetchMailboxWatcherJson(url, {
                method: editing ? 'PUT' : 'POST',
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const error = await response.json();
                toast(error.message || `Error ${editing ? 'updating' : 'creating'} watcher`, 'error');
                return;
            }

            if (editing) {
                const updated = await response.json() as MailboxWatcher;
                const ownerTransferred = values.ownerId !== null
                    && values.ownerId !== editing.user_id
                    && values.ownerId !== user?.id;
                onUpdated(updated, values.group, ownerTransferred && values.scope === 'owner');
                invalidateWatcherCache();
                toast('Watcher updated');
            } else {
                const created = await response.json();
                onCreated(created, values.group);
                invalidateWatcherCache();
                toast('Watcher created');
            }
            onClose();
        } finally {
            setSaving(false);
        }
    };

    return {
        values,
        saving,
        ownershipDisabled,
        updateField,
        addRule,
        addRuleGroup,
        updateRule,
        removeRule,
        handleSubmit,
    };
}
