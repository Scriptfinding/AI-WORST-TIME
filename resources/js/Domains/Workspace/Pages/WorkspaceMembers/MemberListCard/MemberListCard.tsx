import { useEffect, useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import Button from '@/Shared/UI/Button/Button';
import BulkDeleteConfirmation from '@/Shared/UI/BulkDeleteConfirmation/BulkDeleteConfirmation';
import FlowIcon from '@/Shared/UI/FlowIcon/FlowIcon';
import { useConfirm } from '@/Shared/Hooks/useConfirm';
import { useUrlSyncedModal } from '@/Shared/Hooks/useUrlSyncedModal';
import { useAuth, usePageProps } from '@/App/Hooks/usePageProps';
import type { Workspace, WorkspaceUser } from '@/Domains/Workspace/types';
import type { PendingInvitation, RegistrationRequest, Team } from '@/Domains/Workspace/Pages/WorkspaceMembers/types';
import InviteUserModal from '@/Domains/Workspace/Pages/WorkspaceMembers/InviteCard/InviteUserModal/InviteUserModal';
import PendingInvitationsCard from '@/Domains/Workspace/Pages/WorkspaceMembers/InviteCard/PendingInvitationsCard/PendingInvitationsCard';
import RegistrationRequestsCard from '@/Domains/Workspace/Pages/WorkspaceMembers/RegistrationRequestsCard/RegistrationRequestsCard';
import * as Shared from '@/Domains/Workspace/Pages/WorkspaceMembers/shared.styled';
import EditMemberModal from './EditMemberModal/EditMemberModal';
import ManageMemberTeamsModal from './ManageMemberTeamsModal/ManageMemberTeamsModal';
import MemberTable from './MemberTable/MemberTable';
import * as S from './styled';

interface Props {
    workspace: Workspace & { users: WorkspaceUser[] };
    isWorkspaceAdmin: boolean;
    callerWorkspaceRole: 'admin' | 'manager' | 'member';
    teams: Team[];
    pendingInvitations: PendingInvitation[];
    registrationRequests: RegistrationRequest[];
}

export default function MemberListCard({
    workspace,
    isWorkspaceAdmin,
    callerWorkspaceRole,
    teams,
    pendingInvitations,
    registrationRequests,
}: Props) {
    const { settings } = usePageProps();
    const auth = useAuth();
    const viewerIsInstanceAdmin = auth?.user?.role === 'admin';
    const workspaceSharingEnabled = settings?.workspace_sharing_enabled ?? false;
    const teamsEnabled = settings?.teams_enabled ?? false;
    const canInviteMembers = isWorkspaceAdmin || (callerWorkspaceRole === 'manager' && teams.length > 0);
    const [search, setSearch] = useState('');
    const {
        selectedItem: editingUser,
        openModal: openEditingUser,
        closeModal: closeEditingUser,
    } = useUrlSyncedModal(workspace.users, 'edit-member');
    const {
        selectedItem: teamAssignmentUser,
        openModal: openTeamAssignment,
        closeModal: closeTeamAssignment,
    } = useUrlSyncedModal(workspace.users, 'edit-member-teams');
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [selectedUserIds, setSelectedUserIds] = useState<Set<Id>>(() => new Set());
    const [deletingSelected, setDeletingSelected] = useState(false);
    const { confirm, ConfirmModal } = useConfirm();

    const adminCount = workspace.users?.filter(u => u.pivot.role === 'admin').length ?? 0;

    useEffect(() => {
        const availableUserIds = new Set(workspace.users.map(user => user.id));
        setSelectedUserIds(current => {
            const next = new Set([...current].filter(id => availableUserIds.has(id)));
            return next.size === current.size ? current : next;
        });
    }, [workspace.users]);

    const userTeams = useMemo(() => {
        const map = new Map<Id, Team[]>();
        for (const team of teams) {
            for (const u of team.users) {
                const arr = map.get(u.id) ?? [];
                arr.push(team);
                map.set(u.id, arr);
            }
        }
        return map;
    }, [teams]);

    const filteredMembers = useMemo(() => {
        if (!workspace.users) return [];
        if (!search.trim()) return workspace.users;
        const q = search.toLowerCase();
        return workspace.users.filter(
            u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
        );
    }, [workspace.users, search]);

    const toggleSelected = (user: WorkspaceUser) => {
        setSelectedUserIds(current => {
            const next = new Set(current);
            if (next.has(user.id)) {
                next.delete(user.id);
            } else {
                next.add(user.id);
            }
            return next;
        });
    };

    const deleteSelected = async () => {
        const selectedMembers = workspace.users.filter(user => selectedUserIds.has(user.id));
        if (selectedMembers.length === 0) return;

        const confirmed = await confirm({
            title: selectedMembers.length === 1 ? 'Remove Member' : 'Remove Members',
            message: (
                <BulkDeleteConfirmation
                    description="These members will immediately lose access to this workspace and its shared resources."
                    selectionLabel="Selected members"
                    warning="Their access can be restored by adding them to the workspace again."
                    items={selectedMembers.map(user => ({
                        id: user.id,
                        title: user.name,
                        subtitle: user.email,
                        icon: (
                            <FlowIcon
                                flow={{
                                    icon_type: user.icon_type,
                                    icon_value: user.icon_value,
                                    icon_color: user.icon_color,
                                    icon_url: user.icon_url,
                                    name: user.name,
                                }}
                                size={26}
                                radius="full"
                            />
                        ),
                    }))}
                />
            ),
            confirmLabel: `Remove (${selectedMembers.length})`,
            variant: 'danger',
        });
        if (!confirmed) return;

        setDeletingSelected(true);
        router.delete('/workspace/members/bulk-delete', {
            data: { user_ids: selectedMembers.map(user => user.id) },
            preserveScroll: true,
            onSuccess: () => setSelectedUserIds(new Set()),
            onFinish: () => setDeletingSelected(false),
        });
    };

    return (
        <>
            {isWorkspaceAdmin && (
                <RegistrationRequestsCard requests={registrationRequests} />
            )}

            {(isWorkspaceAdmin || callerWorkspaceRole === 'manager') && (
                <PendingInvitationsCard pendingInvitations={pendingInvitations} callerWorkspaceRole={callerWorkspaceRole} />
            )}

            <Shared.Card>
                <S.CardHeader>
                    <Shared.CardTitle>
                        <Icon icon="lucide:users" width={15} height={15} />
                        Members
                        <S.MemberCount>({workspace.users?.length ?? 0})</S.MemberCount>
                    </Shared.CardTitle>
                    {canInviteMembers && (
                        <S.HeaderActions>
                            {isWorkspaceAdmin && selectedUserIds.size > 0 && (
                                <Button
                                    size="sm"
                                    variant="danger"
                                    loading={deletingSelected}
                                    onClick={deleteSelected}
                                >
                                    <Icon icon="lucide:trash-2" width={14} />
                                    Delete ({selectedUserIds.size})
                                </Button>
                            )}
                            <Button size="sm" onClick={() => setShowInviteModal(true)}>
                                <Icon icon="lucide:plus" width={14} />
                                <S.AddButtonLabel>Add user</S.AddButtonLabel>
                            </Button>
                        </S.HeaderActions>
                    )}
                </S.CardHeader>

                <S.SearchWrapper>
                    <Icon icon="lucide:search" width={14} height={14} />
                    <S.SearchInput
                        placeholder="Search members..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </S.SearchWrapper>

                <MemberTable
                    members={filteredMembers}
                    userTeams={userTeams}
                    search={search}
                    adminCount={adminCount}
                    isWorkspaceAdmin={isWorkspaceAdmin}
                    viewerIsInstanceAdmin={viewerIsInstanceAdmin}
                    teamsEnabled={teamsEnabled}
                    workspaceSharingEnabled={workspaceSharingEnabled}
                    workspaceOwnerId={workspace.owner_id}
                    selectedUserIds={selectedUserIds}
                    onToggleSelected={toggleSelected}
                    onEdit={openEditingUser}
                    onManageTeams={openTeamAssignment}
                    onRemove={async user => {
                        if (await confirm({ title: 'Remove Member', message: `Remove "${user.name}" from this workspace?`, confirmLabel: 'Remove', variant: 'danger' })) {
                            router.delete(`/workspace/members/${user.id}`);
                        }
                    }}
                />
            </Shared.Card>

            {canInviteMembers && (
                <InviteUserModal
                    isOpen={showInviteModal}
                    onClose={() => setShowInviteModal(false)}
                    callerWorkspaceRole={callerWorkspaceRole}
                    teams={teams}
                />
            )}

            <EditMemberModal
                user={editingUser}
                callerWorkspaceRole={callerWorkspaceRole}
                workspaceSharingEnabled={workspaceSharingEnabled}
                onClose={closeEditingUser}
            />

            <ManageMemberTeamsModal
                user={teamAssignmentUser}
                teams={teams}
                currentTeams={teamAssignmentUser === null ? [] : userTeams.get(teamAssignmentUser.id) ?? []}
                onClose={closeTeamAssignment}
            />

            <ConfirmModal />
        </>
    );
}
