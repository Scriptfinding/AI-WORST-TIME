import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import Button from '@/Shared/UI/Button/Button';
import BulkDeleteConfirmation from '@/Shared/UI/BulkDeleteConfirmation/BulkDeleteConfirmation';
import { useConfirm } from '@/Shared/Hooks/useConfirm';
import { useSyncedState } from '@/Shared/Hooks/useSyncedState';
import { useToast } from '@/App/Hooks/useToast';
import { useAuth, usePageProps } from '@/App/Hooks/usePageProps';
import { canEditOwnership } from '@/Shared/Utils/ownershipPermissions';
import type { MailboxWatcher } from '@/Domains/Mailbox/types';
import { useActionMenuDismiss } from '@/Shared/Hooks/useActionMenuDismiss';
import { useUrlSyncedModal } from '@/Shared/Hooks/useUrlSyncedModal';
import { EmptyText, SectionHeader, SectionHeaderActions, SectionTitle, SidePanelSection, SidePanelSectionInner } from '@/Domains/Flow/Pages/FlowEditor/shared/paneLayout.styled';
import { invalidateWatcherCache } from '@/Domains/Flow/Pages/FlowEditor/utils/mailboxWatcherSuggestions';
import { useQuickRequirementCreation } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/contexts/QuickRequirementCreationContext';
import WatcherFormModal from './components/WatcherFormModal/WatcherFormModal';
import WatcherList from './components/WatcherList/WatcherList';
import * as S from './styled';
import type { MailboxOption } from './types';
import { buildGroupTree } from './utils/groupTree';
import { fetchMailboxWatcherJson } from './utils/mailboxWatcherApi';

interface MailboxesPaneProps {
    flowId: Id;
    isNodalFlow: boolean;
    watchers: MailboxWatcher[];
    groups: string[];
    mailboxes: MailboxOption[];
    teams: { id: Id; name: string }[];
}

export default function MailboxesPane({
    flowId,
    isNodalFlow,
    watchers: initialWatchers,
    groups: initialGroups,
    mailboxes,
    teams,
}: MailboxesPaneProps) {
    const [watchers, setWatchers] = useSyncedState(initialWatchers);
    const [groups, setGroups] = useSyncedState(initialGroups);
    const [showModal, setShowModal] = useState(false);
    const [creatingMailbox, setCreatingMailbox] = useState(false);
    const {
        selectedItem: editing,
        openModal: openEditing,
        closeModal: closeEditing,
    } = useUrlSyncedModal(watchers, 'edit-watcher');
    const [overflowId, setOverflowId] = useState<Id | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<Id>>(() => new Set());
    const [deletingSelected, setDeletingSelected] = useState(false);
    const overflowRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();
    const { user } = useAuth();
    const { settings } = usePageProps();
    const { confirm, ConfirmModal } = useConfirm();
    const quickCreation = useQuickRequirementCreation();
    const currentUserId = user?.id ?? '';
    const currentUserWorkspaceRole = user?.workspace_role ?? 'member';
    const manageableIds = useMemo(() => new Set(
        watchers
            .filter(watcher => canEditOwnership({
                currentUserId,
                currentUserWorkspaceRole,
                resourceOwnerId: watcher.user_id,
                ownerWorkspaceRole: watcher.owner_workspace_role,
            }))
            .map(watcher => watcher.id),
    ), [currentUserId, currentUserWorkspaceRole, watchers]);

    useActionMenuDismiss({
        open: overflowId !== null,
        refs: [overflowRef],
        onDismiss: () => setOverflowId(null),
        closeOnScroll: false,
        eventType: 'mousedown',
        eventCapture: false,
    });

    useEffect(() => {
        setSelectedIds(current => {
            const next = new Set([...current].filter(id => manageableIds.has(id)));
            return next.size === current.size ? current : next;
        });
    }, [manageableIds]);

    useEffect(() => {
        if (editing) setShowModal(true);
    }, [editing]);

    const closeFormModal = () => {
        setShowModal(false);
        closeEditing();
    };

    const createMailbox = async () => {
        if (!settings.mailbox_enabled) return;
        setCreatingMailbox(true);
        try {
            const mailbox = await quickCreation.create('mailbox');
            if (mailbox) await quickCreation.refresh('mailboxes');
        } finally {
            setCreatingMailbox(false);
        }
    };

    const toggleSelected = (watcherId: Id) => {
        setSelectedIds(current => {
            const next = new Set(current);
            if (next.has(watcherId)) {
                next.delete(watcherId);
            } else {
                next.add(watcherId);
            }
            return next;
        });
    };

    const rememberGroup = (group: string) => {
        if (group && !groups.includes(group)) {
            setGroups(previous => [...previous, group].sort());
        }
    };

    const handleToggleActive = async (watcher: MailboxWatcher) => {
        const response = await fetchMailboxWatcherJson(`/flows/${flowId}/mailbox-watchers/${watcher.id}`, {
            method: 'PUT',
            body: JSON.stringify({ is_active: !watcher.is_active }),
        });
        if (response.ok) {
            const updated = await response.json() as MailboxWatcher;
            setWatchers(previous => previous.map(item => item.id === updated.id ? updated : item));
            invalidateWatcherCache();
        }
    };

    const handleDelete = async (watcher: MailboxWatcher) => {
        const confirmed = await confirm({
            title: 'Delete Watcher',
            message: isNodalFlow
                ? `Delete "${watcher.name}"? Nodes that use this watcher will stop working.`
                : `Delete "${watcher.name}"? Any $waitForEmail('${watcher.id}') calls in this flow's code will stop working.`,
            confirmLabel: 'Delete',
            variant: 'danger',
        });
        if (!confirmed) return;

        const response = await fetchMailboxWatcherJson(
            `/flows/${flowId}/mailbox-watchers/${watcher.id}`,
            { method: 'DELETE' },
        );
        if (response.ok) {
            setWatchers(previous => previous.filter(item => item.id !== watcher.id));
            invalidateWatcherCache();
            toast('Watcher deleted');
        }
    };

    const handleDuplicate = async (watcher: MailboxWatcher) => {
        setOverflowId(null);
        if (!watcher.mailbox?.id) return;

        const payload = {
            name: `${watcher.name} (copy)`,
            group: watcher.group,
            mailbox_id: watcher.mailbox.id,
            extract_enabled: watcher.extract_enabled,
            extract_mode: watcher.extract_mode,
            extract_expression: watcher.extract_expression,
            is_active: watcher.is_active,
            timeout: watcher.timeout,
            scope: watcher.scope,
            team_id: watcher.team_id,
            rules: watcher.rules.map(rule => ({
                rule_group: rule.rule_group,
                field: rule.field,
                operator: rule.operator,
                value: rule.value,
            })),
        };
        const response = await fetchMailboxWatcherJson(`/flows/${flowId}/mailbox-watchers`, {
            method: 'POST',
            body: JSON.stringify(payload),
        });
        if (response.ok) {
            const created = await response.json() as MailboxWatcher;
            setWatchers(previous => [...previous, created]);
            invalidateWatcherCache();
            toast('Watcher duplicated');
        } else {
            const error = await response.json();
            toast(error.message || 'Error duplicating watcher', 'error');
        }
    };

    const getMailboxAddress = (mailboxId: Id) => {
        const mailbox = mailboxes.find(item => item.id === mailboxId);
        return mailbox ? `${mailbox.slug}@${mailbox.domain.name}` : 'Unknown';
    };

    const deleteSelected = async () => {
        const selectedWatchers = watchers.filter(watcher =>
            selectedIds.has(watcher.id) && manageableIds.has(watcher.id),
        );
        if (selectedWatchers.length === 0) return;

        const confirmed = await confirm({
            title: selectedWatchers.length === 1 ? 'Delete Watcher' : 'Delete Watchers',
            message: (
                <BulkDeleteConfirmation
                    description={isNodalFlow
                        ? 'Nodes that use these watchers will stop working.'
                        : 'Matching $waitForEmail() calls in this flow will stop working.'}
                    items={selectedWatchers.map(watcher => ({
                        id: watcher.id,
                        title: watcher.name,
                        subtitle: `${getMailboxAddress(watcher.mailbox_id)} · ${watcher.rules.length} rule${watcher.rules.length === 1 ? '' : 's'}`,
                        icon: <Icon icon="lucide:mail-search" width={22} height={22} />,
                    }))}
                />
            ),
            confirmLabel: `Delete (${selectedWatchers.length})`,
            variant: 'danger',
        });
        if (!confirmed) return;

        setDeletingSelected(true);
        try {
            const response = await fetchMailboxWatcherJson(
                `/flows/${flowId}/mailbox-watchers/bulk-delete`,
                {
                    method: 'DELETE',
                    body: JSON.stringify({ ids: selectedWatchers.map(watcher => watcher.id) }),
                },
            );
            if (!response.ok) return;

            const deletedIds = new Set(selectedWatchers.map(watcher => watcher.id));
            setWatchers(previous => previous.filter(watcher => !deletedIds.has(watcher.id)));
            setSelectedIds(new Set());
            invalidateWatcherCache();
            toast(selectedWatchers.length === 1 ? 'Watcher deleted' : `${selectedWatchers.length} watchers deleted`);
        } finally {
            setDeletingSelected(false);
        }
    };

    const groupTree = useMemo(() => buildGroupTree(watchers), [watchers]);
    const availableGroups = useMemo(() => {
        const values = new Set(groups);
        watchers.forEach(watcher => {
            if (watcher.group) values.add(watcher.group);
        });
        return [...values].sort();
    }, [groups, watchers]);

    return (
        <SidePanelSection>
            <SidePanelSectionInner>
                <SectionHeader>
                    <SectionTitle>Mailbox Watchers</SectionTitle>
                    <SectionHeaderActions>
                        {selectedIds.size > 0 && (
                            <Button
                                size="sm"
                                variant="danger"
                                loading={deletingSelected}
                                onClick={deleteSelected}
                            >
                                <Icon icon="lucide:trash-2" width={14} />
                                Delete ({selectedIds.size})
                            </Button>
                        )}
                        {mailboxes.length > 0 && (
                            <Button
                                size="sm"
                                variant="secondary"
                                style={{ gap: 4 }}
                                onClick={() => {
                                    closeEditing();
                                    setShowModal(true);
                                }}
                            >
                                <Icon icon="lucide:plus" />
                                Add
                            </Button>
                        )}
                    </SectionHeaderActions>
                </SectionHeader>

                {watchers.length === 0 ? (
                    <EmptyText>
                        {isNodalFlow
                            ? 'No watchers configured. Add one to wait for incoming emails in this flow.'
                            : <>No watchers configured. Add one to use <code>$waitForEmail('watcher_key')</code> in your flow code.</>}
                    </EmptyText>
                ) : (
                    <WatcherList
                        ungrouped={groupTree.ungrouped}
                        roots={groupTree.roots}
                        overflowId={overflowId}
                        overflowRef={overflowRef}
                        manageableIds={manageableIds}
                        selectedIds={selectedIds}
                        onToggleSelected={toggleSelected}
                        getMailboxAddress={getMailboxAddress}
                        onEdit={watcher => {
                            openEditing(watcher);
                            setShowModal(true);
                        }}
                        onToggleActive={handleToggleActive}
                        onToggleOverflow={watcherId => {
                            setOverflowId(previous => previous === watcherId ? null : watcherId);
                        }}
                        onDuplicate={handleDuplicate}
                        onDelete={watcher => {
                            setOverflowId(null);
                            handleDelete(watcher);
                        }}
                    />
                )}

                {mailboxes.length === 0 ? (
                    <EmptyText>
                        {settings.mailbox_enabled ? (
                            <>
                                No mailboxes available.{' '}
                                <S.InlineLink
                                    href="/integrations"
                                    aria-disabled={creatingMailbox}
                                    onClick={event => {
                                        event.preventDefault();
                                        if (!creatingMailbox) void createMailbox();
                                    }}
                                >
                                    {creatingMailbox ? 'Adding mailbox...' : 'Add a mailbox'}
                                </S.InlineLink>{' '}
                                integration first.
                            </>
                        ) : settings.disabled_feature_message}
                    </EmptyText>
                ) : null}

                <WatcherFormModal
                    isOpen={showModal}
                    editing={editing}
                    flowId={flowId}
                    isNodalFlow={isNodalFlow}
                    groups={availableGroups}
                    mailboxes={mailboxes}
                    teams={teams}
                    confirm={confirm}
                    onClose={closeFormModal}
                    onCreated={(watcher, group) => {
                        setWatchers(previous => [...previous, watcher]);
                        rememberGroup(group);
                    }}
                    onUpdated={(watcher, group, hideAfterTransfer) => {
                        setWatchers(previous => hideAfterTransfer
                            ? previous.filter(item => item.id !== watcher.id)
                            : previous.map(item => item.id === watcher.id ? watcher : item));
                        rememberGroup(group);
                    }}
                />
            </SidePanelSectionInner>
            <ConfirmModal />
        </SidePanelSection>
    );
}
