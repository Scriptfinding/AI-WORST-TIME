import React, { useEffect, useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import Button from '@/Shared/UI/Button/Button';
import BulkDeleteConfirmation from '@/Shared/UI/BulkDeleteConfirmation/BulkDeleteConfirmation';
import { useConfirm } from '@/Shared/Hooks/useConfirm';
import { useUrlSyncedModal } from '@/Shared/Hooks/useUrlSyncedModal';
import type { WorkspaceUser } from '@/Domains/Workspace/types';
import type { Team } from '@/Domains/Workspace/Pages/WorkspaceMembers/types';
import CreateTeamModal from './CreateTeamModal.pp';
import EditTeamModal from './EditTeamModal.pp';
import ManageTeamMembersModal from './ManageTeamMembersModal.pp';
import TeamsTable from './TeamsTable.pp';
import * as S from './TeamsCard.styled.pp';

interface Props {
    teams: Team[];
    members: WorkspaceUser[];
    isWorkspaceAdmin: boolean;
    canCreateTeam: boolean;
}

export default function TeamsCard({ teams, members, isWorkspaceAdmin, canCreateTeam }: Props) {
    const [teamSearch, setTeamSearch] = useState('');
    const {
        selectedItem: managingTeam,
        openModal: openManagingTeam,
        closeModal: closeManagingTeam,
    } = useUrlSyncedModal(teams, 'edit-team-members');
    const {
        selectedItem: editingTeam,
        openModal: openEditingTeam,
        closeModal: closeEditingTeam,
    } = useUrlSyncedModal(teams, 'edit-team');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedTeamIds, setSelectedTeamIds] = useState<Set<Id>>(() => new Set());
    const [deletingSelected, setDeletingSelected] = useState(false);
    const { confirm, ConfirmModal } = useConfirm();

    const currentTeam = managingTeam ? teams.find(t => t.id === managingTeam.id) ?? managingTeam : null;

    useEffect(() => {
        const availableTeamIds = new Set(teams.map(team => team.id));
        setSelectedTeamIds(current => {
            const next = new Set([...current].filter(id => availableTeamIds.has(id)));
            return next.size === current.size ? current : next;
        });
    }, [teams]);

    const filteredTeams = useMemo(() => {
        if (!teamSearch.trim()) return teams;
        const q = teamSearch.toLowerCase();
        return teams.filter(team => team.name.toLowerCase().includes(q));
    }, [teamSearch, teams]);

    const deleteTeam = async (team: Team) => {
        const confirmed = await confirm({
            title: 'Delete Team',
            message: `Delete team "${team.name}"? Members will not be removed from the workspace.`,
            confirmLabel: 'Delete',
            variant: 'danger',
        });
        if (confirmed) router.delete(`/workspace/teams/${team.id}`);
    };

    const toggleSelected = (team: Team) => {
        setSelectedTeamIds(current => {
            const next = new Set(current);
            if (next.has(team.id)) {
                next.delete(team.id);
            } else {
                next.add(team.id);
            }
            return next;
        });
    };

    const deleteSelected = async () => {
        const selectedTeams = teams.filter(team => selectedTeamIds.has(team.id));
        if (selectedTeams.length === 0) return;

        const confirmed = await confirm({
            title: selectedTeams.length === 1 ? 'Delete Team' : 'Delete Teams',
            message: (
                <BulkDeleteConfirmation
                    description="Members will stay in the workspace. Team flows will become private to their owners."
                    items={selectedTeams.map(team => ({
                        id: team.id,
                        title: team.name,
                        subtitle: `${team.users.length} member${team.users.length === 1 ? '' : 's'} · ${team.flows_count ?? 0} flow${team.flows_count === 1 ? '' : 's'}`,
                        icon: (
                            <S.DeleteTeamIcon>
                                <Icon icon="lucide:users-round" width={13} height={13} />
                            </S.DeleteTeamIcon>
                        ),
                    }))}
                />
            ),
            confirmLabel: `Delete (${selectedTeams.length})`,
            variant: 'danger',
        });
        if (!confirmed) return;

        setDeletingSelected(true);
        router.delete('/workspace/teams/bulk-delete', {
            data: { team_ids: selectedTeams.map(team => team.id) },
            preserveScroll: true,
            onSuccess: () => setSelectedTeamIds(new Set()),
            onFinish: () => setDeletingSelected(false),
        });
    };

    return (
        <>
            <S.Card>
                <S.CardHeader>
                    <S.CardTitle>
                        <Icon icon="lucide:users-round" width={15} height={15} />
                        Teams
                        {teams.length > 0 && <S.TeamCount>({teams.length})</S.TeamCount>}
                    </S.CardTitle>
                    {canCreateTeam && (
                        <S.HeaderActions>
                            {selectedTeamIds.size > 0 && (
                                <Button
                                    size="sm"
                                    variant="danger"
                                    loading={deletingSelected}
                                    onClick={deleteSelected}
                                >
                                    <Icon icon="lucide:trash-2" width={14} />
                                    Delete ({selectedTeamIds.size})
                                </Button>
                            )}
                            <Button size="sm" onClick={() => setShowCreateModal(true)}>
                                <Icon icon="lucide:plus" width={14} />
                                <S.AddButtonLabel>Add team</S.AddButtonLabel>
                            </Button>
                        </S.HeaderActions>
                    )}
                </S.CardHeader>

                <S.SearchWrapper>
                    <Icon icon="lucide:search" width={14} height={14} />
                    <S.SearchInput
                        placeholder="Search teams..."
                        value={teamSearch}
                        onChange={e => setTeamSearch(e.target.value)}
                    />
                </S.SearchWrapper>

                <TeamsTable
                    teams={teams}
                    filteredTeams={filteredTeams}
                    isWorkspaceAdmin={isWorkspaceAdmin}
                    selectedTeamIds={selectedTeamIds}
                    onToggleSelected={toggleSelected}
                    onRename={openEditingTeam}
                    onManageMembers={openManagingTeam}
                    onDelete={deleteTeam}
                />
            </S.Card>

            {canCreateTeam && (
                <CreateTeamModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                />
            )}
            <ManageTeamMembersModal
                team={currentTeam}
                members={members}
                isWorkspaceAdmin={isWorkspaceAdmin}
                onClose={closeManagingTeam}
            />
            {editingTeam && (
                <EditTeamModal team={editingTeam} onClose={closeEditingTeam} />
            )}

            <ConfirmModal />
        </>
    );
}
