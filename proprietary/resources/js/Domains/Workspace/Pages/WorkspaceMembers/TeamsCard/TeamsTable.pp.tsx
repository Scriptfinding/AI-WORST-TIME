import React, { useCallback, useRef, useState } from 'react';
import type { Team } from '@/Domains/Workspace/Pages/WorkspaceMembers/types';
import { useActionMenuDismiss } from '@/Shared/Hooks/useActionMenuDismiss';
import TableCellContent from '@/Shared/UI/TableCellContent/TableCellContent';
import { menuPositionFromEvent } from '@/Domains/Workspace/Pages/WorkspaceMembers/utils';
import TeamRow from './TeamRow.pp';
import * as S from './TeamsTable.styled.pp';

interface Props {
    teams: Team[];
    filteredTeams: Team[];
    isWorkspaceAdmin: boolean;
    selectedTeamIds: Set<Id>;
    onToggleSelected: (team: Team) => void;
    onRename: (team: Team) => void;
    onManageMembers: (team: Team) => void;
    onDelete: (team: Team) => void;
}

export default function TeamsTable({
    teams,
    filteredTeams,
    isWorkspaceAdmin,
    selectedTeamIds,
    onToggleSelected,
    onRename,
    onManageMembers,
    onDelete,
}: Props) {
    const [openMenuTeamId, setOpenMenuTeamId] = useState<Id | null>(null);
    const [menuPosition, setMenuPosition] = useState<React.CSSProperties>({});
    const menuRef = useRef<HTMLDivElement>(null);

    const closeMenu = useCallback(() => setOpenMenuTeamId(null), []);
    const hasActions = teams.some(team =>
        team.can_manage_members || team.can_update || team.can_delete,
    );

    useActionMenuDismiss({
        open: openMenuTeamId !== null,
        refs: [menuRef],
        onDismiss: closeMenu,
        closeOnScroll: true,
        eventType: 'mousedown',
        eventCapture: false,
        scrollCapture: true,
    });

    const toggleMenu = (team: Team, event: React.MouseEvent<HTMLButtonElement>) => {
        setMenuPosition(menuPositionFromEvent(event));
        setOpenMenuTeamId(openMenuTeamId === team.id ? null : team.id);
    };

    return (
        <S.TableWrapper>
            <S.Table>
                <thead>
                    <tr>
                        <th>Team</th>
                        <th>Members</th>
                        <th className="center">Flows</th>
                        <th>Created</th>
                        {hasActions && <th aria-label="Actions" />}
                    </tr>
                </thead>
                <tbody>
                    {filteredTeams.map(team => (
                        <TeamRow
                            key={team.id}
                            team={team}
                            isWorkspaceAdmin={isWorkspaceAdmin}
                            menuOpen={openMenuTeamId === team.id}
                            menuPosition={menuPosition}
                            menuRef={menuRef}
                            selected={selectedTeamIds.has(team.id)}
                            onToggleSelected={onToggleSelected}
                            onToggleMenu={event => toggleMenu(team, event)}
                            onCloseMenu={closeMenu}
                            onRename={onRename}
                            onManageMembers={onManageMembers}
                            onDelete={onDelete}
                        />
                    ))}
                    {filteredTeams.length === 0 && (
                        <tr>
                            <S.TableEmptyCell colSpan={4 + (hasActions ? 1 : 0)}>
                                <TableCellContent $align="center">
                                    {teams.length === 0 ? 'No teams yet.' : 'No teams found.'}
                                </TableCellContent>
                            </S.TableEmptyCell>
                        </tr>
                    )}
                </tbody>
            </S.Table>
        </S.TableWrapper>
    );
}
