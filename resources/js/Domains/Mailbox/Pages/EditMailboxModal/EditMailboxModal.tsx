import React, { useState, useRef } from 'react';
import { router, usePage } from '@inertiajs/react';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import { Icon } from '@/Shared/UI/Icon/Icon';
import Modal from '@/Shared/UI/Modal/Modal';
import Input from '@/Shared/UI/Input/Input';
import Button from '@/Shared/UI/Button/Button';
import UserPicker from '@/Shared/UI/UserPicker/UserPicker';
import ScopePicker from '@proprietary/Shared/UI/ScopePicker/ScopePicker.pp';
import type { ScopeTeam } from '@proprietary/Shared/UI/ScopePicker/ScopePicker.pp';
import { useConfirm } from '@/Shared/Hooks/useConfirm';
import { useSearchablePopover } from '@/Shared/Hooks/useSearchablePopover';
import type { MailboxItem } from '@/Domains/Mailbox/types';
import type { PageProps } from '@/App/types';
import { canEditOwnership, OWNERSHIP_DISABLED_HINT, ADMIN_TRANSFER_WARNING } from '@/Shared/Utils/ownershipPermissions';
import * as S from '@/Domains/Mailbox/Pages/shared.styled';

interface Props {
    mailbox: MailboxItem;
    onClose: () => void;
    teams: ScopeTeam[];
    groups?: string[];
}

export default function EditMailboxModal({ mailbox, onClose, teams, groups = [] }: Props) {
    const { auth } = usePage<InertiaPageProps & PageProps>().props;
    const currentUserId = auth.user?.id ?? '';
    const currentUserWorkspaceRole = auth.user?.workspace_role ?? 'member';
    const { confirm, ConfirmModal } = useConfirm();

    const ownershipDisabled = !canEditOwnership({
        currentUserId: currentUserId,
        currentUserWorkspaceRole,
        resourceOwnerId: mailbox.user_id,
        ownerWorkspaceRole: mailbox.owner_workspace_role,
    });
    const [slug, setSlug] = useState(mailbox.slug);
    const [group, setGroup] = useState(mailbox.group || '');
    const [description, setDescription] = useState(mailbox.description || '');
    const [scope, setScope] = useState<string>(mailbox.scope);
    const [teamId, setTeamId] = useState<Id | null>(mailbox.team_id ?? null);
    const [ownerId, setOwnerId] = useState<Id | null>(mailbox.user_id);
    const [targetUserRole, setTargetUserRole] = useState<string | undefined>(mailbox.owner_workspace_role);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [groupOpen, setGroupOpen] = useState(false);
    const [groupSearch, setGroupSearch] = useState('');
    const groupDropdownRef = useRef<HTMLDivElement>(null);
    const groupSearchRef = useRef<HTMLInputElement>(null);

    useSearchablePopover({
        open: groupOpen,
        onDismiss: () => setGroupOpen(false),
        reset: () => setGroupSearch(''),
        focusRef: groupSearchRef,
        containerRefs: [groupDropdownRef],
        eventType: 'mousedown',
    });

    const filteredGroups = groups.filter(g => !groupSearch || g.toLowerCase().includes(groupSearch.toLowerCase()));
    const groupExactMatch = groups.some(g => g.toLowerCase() === groupSearch.trim().toLowerCase());

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!slug.trim()) return;

        if (ownerId && ownerId !== mailbox.user_id && ownerId !== auth.user?.id) {
            let adminTransferWarned = false;
            if (currentUserWorkspaceRole === 'manager' && targetUserRole === 'admin') {
                const ok = await confirm({
                    title: 'Transfer ownership',
                    message: ADMIN_TRANSFER_WARNING,
                    confirmLabel: 'Transfer anyway',
                    variant: 'danger',
                });
                if (!ok) return;
                adminTransferWarned = true;
            }
            if (!adminTransferWarned && scope === 'owner') {
                const ok = await confirm({
                    title: 'Transfer ownership',
                    message: 'This mailbox has personal visibility. By transferring it to another user, you will permanently lose access to it.',
                    confirmLabel: 'Transfer anyway',
                    variant: 'danger',
                });
                if (!ok) return;
            }
        }

        setSubmitting(true);
        setError('');
        router.put(`/mailboxes/${mailbox.id}`, {
            slug: slug.trim().toLowerCase(),
            group: group.trim() || null,
            description: description.trim() || undefined,
            scope,
            team_id: scope === 'team' ? teamId : null,
            ...(ownerId ? { user_id: ownerId } : {}),
        }, {
            preserveScroll: true,
            onSuccess: () => { onClose(); setSubmitting(false); },
            onError: (errs) => { setError(errs.slug || 'Failed to update.'); setSubmitting(false); },
        });
    };

    return (
        <Modal isOpen onClose={onClose} title={`Edit - ${mailbox.address}`} width="420px">
            <S.ModalForm onSubmit={handleSubmit}>
                <S.InputWrap>
                    <S.InputLabel>Mailbox address</S.InputLabel>
                    <S.InputGroup>
                        <S.InputLeft>
                            <Input
                                value={slug}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, '')); setError(''); }}
                                error={error || undefined}
                            />
                        </S.InputLeft>
                        <S.InputSuffix>@{mailbox.domain_name}</S.InputSuffix>
                    </S.InputGroup>
                    <S.HelperText>Lowercase letters, numbers, dots, hyphens allowed.</S.HelperText>
                </S.InputWrap>

                <Input
                    label="Description (Optional)"
                    value={description}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
                    placeholder="Customer support mailbox"
                />

                <S.ComboboxWrapper ref={groupDropdownRef}>
                    <S.ComboboxLabel>Group (Optional)</S.ComboboxLabel>
                    <S.ComboboxTrigger
                        type="button"
                        $open={groupOpen}
                        $hasValue={!!group}
                        onClick={() => { setGroupOpen(o => !o); setGroupSearch(''); }}
                    >
                        <Icon icon="lucide:folder" width={14} />
                        {group || 'Group name'}
                        {group ? (
                            <S.ComboboxClear onClick={e => { e.stopPropagation(); setGroup(''); setGroupOpen(false); }}>
                                <Icon icon="lucide:x" width={14} />
                            </S.ComboboxClear>
                        ) : (
                            <Icon icon="lucide:chevron-down" width={14} />
                        )}
                    </S.ComboboxTrigger>
                    {groupOpen && (
                        <S.ComboboxPanel>
                            <S.DropdownSearchWrapper>
                                <S.DropdownSearchInput
                                    ref={groupSearchRef}
                                    value={groupSearch}
                                    onChange={e => setGroupSearch(e.target.value)}
                                    placeholder="Search or create group..."
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && groupSearch.trim()) {
                                            e.preventDefault();
                                            setGroup(groupSearch.trim());
                                            setGroupOpen(false);
                                            setGroupSearch('');
                                        }
                                    }}
                                />
                            </S.DropdownSearchWrapper>
                            <S.GroupDropdownList>
                                {filteredGroups.map(g => (
                                    <S.GroupDropdownItem
                                        key={g}
                                        type="button"
                                        $active={group === g}
                                        onClick={() => { setGroup(g); setGroupOpen(false); setGroupSearch(''); }}
                                    >
                                        <Icon icon="lucide:folder" width={14} />
                                        {g}
                                    </S.GroupDropdownItem>
                                ))}
                                {groupSearch.trim() && !groupExactMatch && (
                                    <S.ComboboxCreate
                                        type="button"
                                        onClick={() => { setGroup(groupSearch.trim()); setGroupOpen(false); setGroupSearch(''); }}
                                    >
                                        <Icon icon="lucide:plus" width={14} />
                                        Create "{groupSearch.trim()}"
                                    </S.ComboboxCreate>
                                )}
                                {!groupSearch && groups.length === 0 && (
                                    <S.GroupDropdownEmpty>Type to create a group</S.GroupDropdownEmpty>
                                )}
                            </S.GroupDropdownList>
                        </S.ComboboxPanel>
                    )}
                </S.ComboboxWrapper>

                <ScopePicker
                    label="Visibility"
                    value={{ scope, team_id: teamId }}
                    onChange={v => { setScope(v.scope); setTeamId(v.team_id); }}
                    teams={teams}
                    ownerLabel="Owner"
                    ownerScope="owner"
                    disabled={ownershipDisabled}
                    disabledHint={OWNERSHIP_DISABLED_HINT}
                />

                <UserPicker
                    label="Owner"
                    value={ownerId}
                    onChange={setOwnerId}
                    onSelect={u => setTargetUserRole(u?.workspace_role ?? undefined)}
                    placeholder="Myself (default)"
                    disabled={ownershipDisabled}
                />

                <S.ModalActions>
                    <Button type="button" variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
                    <Button type="submit" size="sm" loading={submitting} disabled={!slug.trim()}>
                        Save
                    </Button>
                </S.ModalActions>
            </S.ModalForm>
            <ConfirmModal />
        </Modal>
    );
}
