import React, { useMemo, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import Badge from '@/Shared/UI/Badge/Badge';
import FlowIcon from '@/Shared/UI/FlowIcon/FlowIcon';
import Modal from '@/Shared/UI/Modal/Modal';
import { usePageProps } from '@/App/Hooks/usePageProps';
import { useSearchablePopover } from '@/Shared/Hooks/useSearchablePopover';
import type { WorkspaceUser } from '@/Domains/Workspace/types';
import { ucfirst } from '@/Shared/Utils/string';
import type { Team } from '@/Domains/Workspace/Pages/WorkspaceMembers/types';
import * as S from './ManageTeamMembersModal.styles.pp';

interface Props {
    team: Team | null;
    members: WorkspaceUser[];
    isWorkspaceAdmin: boolean;
    onClose: () => void;
}

export default function ManageTeamMembersModal({ team, members, isWorkspaceAdmin, onClose }: Props) {
    const { settings } = usePageProps();
    const [search, setSearch] = useState('');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const workspaceSharingEnabled = settings?.workspace_sharing_enabled ?? false;

    const availableMembers = useMemo(() => {
        if (!team) return [];
        const memberIds = new Set(team.users.map(user => user.id));
        const query = search.toLowerCase();
        return members
            .filter(member => !memberIds.has(member.id))
            .filter(member => isWorkspaceAdmin || member.pivot.role === 'member')
            .filter(member => !search.trim() || member.name.toLowerCase().includes(query) || member.email.toLowerCase().includes(query));
    }, [team, members, search, isWorkspaceAdmin]);
    const normalizedEmail = search.trim().toLowerCase();
    const canInvite = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
        && !members.some(member => member.email.toLowerCase() === normalizedEmail);

    useSearchablePopover({
        open: dropdownOpen,
        onDismiss: () => setDropdownOpen(false),
        reset: () => setSearch(''),
        focusRef: searchRef,
        containerRefs: [dropdownRef],
        eventType: 'mousedown',
    });

    const close = () => {
        setSearch('');
        setDropdownOpen(false);
        onClose();
    };

    const addMember = (userId: Id) => {
        if (!team) return;
        router.post(`/workspace/teams/${team.id}/members`, { user_id: userId }, { preserveScroll: true });
        setSearch('');
        setDropdownOpen(false);
    };

    const removeMember = (userId: Id) => {
        if (!team) return;
        router.delete(`/workspace/teams/${team.id}/members/${userId}`, { preserveScroll: true });
    };

    const inviteMember = () => {
        if (!team || !canInvite) return;
        router.post(
            `/workspace/teams/${team.id}/invitations`,
            { email: normalizedEmail },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSearch('');
                    setDropdownOpen(false);
                },
            },
        );
    };

    return (
        <Modal isOpen={!!team} onClose={close} title={`Manage - ${team?.name ?? ''}`}>
            <S.AddMemberWrapper ref={dropdownRef}>
                <S.AddMemberTrigger
                    type="button"
                    $open={dropdownOpen}
                    onClick={() => setDropdownOpen(open => !open)}
                >
                    <Icon icon="lucide:user-plus" width={14} />
                    Add or invite a member…
                    <Icon
                        icon={dropdownOpen ? 'mdi:chevron-up' : 'mdi:chevron-down'}
                        width={16}
                        style={{ marginLeft: 'auto' }}
                    />
                </S.AddMemberTrigger>
                {dropdownOpen && (
                    <S.AddMemberDropdown>
                        <S.AddMemberSearch
                            ref={searchRef}
                            value={search}
                            onChange={event => setSearch(event.target.value)}
                            placeholder="Search or enter an email…"
                        />
                        <S.PickerList>
                            {availableMembers.map(member => (
                                <S.PickerItem key={member.id} onClick={() => addMember(member.id)}>
                                    <FlowIcon
                                        flow={{
                                            icon_type: member.icon_type,
                                            icon_value: member.icon_value,
                                            icon_color: member.icon_color,
                                            icon_url: member.icon_url,
                                            name: member.name,
                                        }}
                                        size={24}
                                        radius="full"
                                    />
                                    <S.MemberName>{member.name}</S.MemberName>
                                    {workspaceSharingEnabled && (
                                        <Badge variant={member.pivot.role === 'admin' ? 'info' : member.pivot.role === 'manager' ? 'warning' : 'success'}>
                                            {ucfirst(member.pivot.role)}
                                        </Badge>
                                    )}
                                    <Icon icon="lucide:plus" width={13} style={{ opacity: 0.4 }} />
                                </S.PickerItem>
                            ))}
                            {canInvite && (
                                <S.PickerItem onClick={inviteMember}>
                                    <Icon icon="lucide:mail-plus" width={24} />
                                    <S.MemberName>Invite {normalizedEmail}</S.MemberName>
                                    <Icon icon="lucide:send" width={13} style={{ opacity: 0.4 }} />
                                </S.PickerItem>
                            )}
                            {availableMembers.length === 0 && !canInvite && (
                                <S.PickerEmpty>No matching members.</S.PickerEmpty>
                            )}
                        </S.PickerList>
                    </S.AddMemberDropdown>
                )}
            </S.AddMemberWrapper>

            {team && team.users.length > 0 && (
                <S.CurrentMembers>
                    <S.SectionLabel>Current members ({team.users.length})</S.SectionLabel>
                    {team.users.map(user => (
                        <S.MemberChip key={user.id}>
                            <FlowIcon
                                flow={{
                                    icon_type: user.icon_type,
                                    icon_value: user.icon_value,
                                    icon_color: user.icon_color,
                                    icon_url: user.icon_url,
                                    name: user.name,
                                }}
                                size={24}
                                radius="full"
                            />
                            <S.MemberName>{user.name}</S.MemberName>
                            {workspaceSharingEnabled && (
                                <Badge variant={user.workspace_role === 'admin' ? 'info' : user.workspace_role === 'manager' ? 'warning' : 'success'}>
                                    {ucfirst(user.workspace_role)}
                                </Badge>
                            )}
                            {(isWorkspaceAdmin || user.workspace_role === 'member') && (
                                <S.RemoveButton onClick={() => removeMember(user.id)} title="Remove from team">
                                    <Icon icon="lucide:x" width={12} />
                                </S.RemoveButton>
                            )}
                        </S.MemberChip>
                    ))}
                </S.CurrentMembers>
            )}
        </Modal>
    );
}
