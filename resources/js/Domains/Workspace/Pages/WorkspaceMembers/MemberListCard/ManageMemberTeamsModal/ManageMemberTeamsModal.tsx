import { useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import Modal from '@/Shared/UI/Modal/Modal';
import type { WorkspaceUser } from '@/Domains/Workspace/types';
import type { Team } from '@/Domains/Workspace/Pages/WorkspaceMembers/types';
import * as S from './styled';

interface Props {
    user: WorkspaceUser | null;
    teams: Team[];
    currentTeams: Team[];
    onClose: () => void;
}

export default function ManageMemberTeamsModal({ user, teams, currentTeams, onClose }: Props) {
    const [search, setSearch] = useState('');
    const assignableTeams = useMemo(() => {
        const currentTeamIds = new Set(currentTeams.map(team => team.id));
        return teams
            .filter(team => !currentTeamIds.has(team.id))
            .filter(team => !search.trim() || team.name.toLowerCase().includes(search.toLowerCase()));
    }, [currentTeams, search, teams]);

    const assignTeam = (teamId: Id) => {
        if (!user) return;
        router.post(`/workspace/teams/${teamId}/members`, { user_id: user.id }, { preserveScroll: true });
        setSearch('');
    };

    const removeTeam = (teamId: Id) => {
        if (!user) return;
        router.delete(`/workspace/teams/${teamId}/members/${user.id}`, { preserveScroll: true });
    };

    const close = () => {
        setSearch('');
        onClose();
    };

    return (
        <Modal isOpen={!!user} onClose={close} title={`Manage Teams - ${user?.name ?? ''}`}>
            <S.SearchInput
                placeholder="Add a team..."
                value={search}
                onChange={event => setSearch(event.target.value)}
                autoFocus
            />
            {assignableTeams.length > 0 && (
                <S.TeamList>
                    {assignableTeams.map(team => (
                        <S.TeamItem key={team.id} onClick={() => assignTeam(team.id)}>
                            <Icon icon="lucide:users-round" width={13} height={13} style={{ opacity: 0.4 }} />
                            <S.TeamName>{team.name}</S.TeamName>
                            <S.TeamMeta>{team.users.length} member{team.users.length !== 1 ? 's' : ''}</S.TeamMeta>
                            <Icon icon="lucide:plus" width={13} style={{ opacity: 0.4 }} />
                        </S.TeamItem>
                    ))}
                </S.TeamList>
            )}
            {assignableTeams.length === 0 && search.trim() && <S.EmptyState>No matching teams.</S.EmptyState>}
            {assignableTeams.length === 0 && !search.trim() && teams.length > 0 && currentTeams.length === teams.length && (
                <S.EmptyState>Already in all teams.</S.EmptyState>
            )}
            {currentTeams.length > 0 && (
                <S.CurrentTeams>
                    <S.CurrentTeamsLabel>Current teams ({currentTeams.length})</S.CurrentTeamsLabel>
                    {currentTeams.map(team => (
                        <S.CurrentTeam key={team.id}>
                            <Icon icon="lucide:users-round" width={13} style={{ opacity: 0.4 }} />
                            <S.TeamName>{team.name}</S.TeamName>
                            <S.TeamMeta>{team.users.length} member{team.users.length !== 1 ? 's' : ''}</S.TeamMeta>
                            <S.RemoveButton onClick={() => removeTeam(team.id)} title="Remove from team">
                                <Icon icon="lucide:x" width={12} />
                            </S.RemoveButton>
                        </S.CurrentTeam>
                    ))}
                </S.CurrentTeams>
            )}
        </Modal>
    );
}
