import React from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import FlowIcon from '@/Shared/UI/FlowIcon/FlowIcon';
import AvatarSelectionToggle from '@/Shared/UI/AvatarSelectionToggle/AvatarSelectionToggle';
import TableCellContent from '@/Shared/UI/TableCellContent/TableCellContent';
import type { Team } from '@/Domains/Workspace/Pages/WorkspaceMembers/types';
import { formatDate } from '@/Domains/Workspace/Pages/WorkspaceMembers/utils';
import TeamActionsMenu from './TeamActionsMenu.pp';
import * as S from './TeamRow.styled.pp';

interface Props {
    team: Team;
    isWorkspaceAdmin: boolean;
    menuOpen: boolean;
    menuPosition: React.CSSProperties;
    menuRef: React.Ref<HTMLDivElement>;
    selected: boolean;
    onToggleSelected: (team: Team) => void;
    onToggleMenu: (event: React.MouseEvent<HTMLButtonElement>) => void;
    onCloseMenu: () => void;
    onRename: (team: Team) => void;
    onManageMembers: (team: Team) => void;
    onDelete: (team: Team) => void;
}

export default function TeamRow({
    team,
    isWorkspaceAdmin,
    menuOpen,
    menuPosition,
    menuRef,
    selected,
    onToggleSelected,
    onToggleMenu,
    onCloseMenu,
    onRename,
    onManageMembers,
    onDelete,
}: Props) {
    return (
        <tr>
            <td>
                <TableCellContent>
                    <S.TableUserCell>
                        {isWorkspaceAdmin ? (
                            <AvatarSelectionToggle
                                selected={selected}
                                onChange={() => onToggleSelected(team)}
                                label={`${selected ? 'Deselect' : 'Select'} ${team.name}`}
                            >
                                <S.TeamIcon>
                                    <Icon icon="lucide:users-round" width={14} height={14} />
                                </S.TeamIcon>
                            </AvatarSelectionToggle>
                        ) : (
                            <S.TeamIcon>
                                <Icon icon="lucide:users-round" width={14} height={14} />
                            </S.TeamIcon>
                        )}
                        <S.TeamName>{team.name}</S.TeamName>
                    </S.TableUserCell>
                </TableCellContent>
            </td>
            <td>
                <TableCellContent>
                    {team.users.length > 0 ? (
                        <S.AvatarStack>
                            {team.users.slice(0, 6).map(user => (
                                <S.Avatar key={user.id} title={user.name}>
                                    <FlowIcon
                                        flow={{
                                            icon_type: user.icon_type,
                                            icon_value: user.icon_value,
                                            icon_color: user.icon_color,
                                            icon_url: user.icon_url,
                                            name: user.name,
                                        }}
                                        size={22}
                                        radius="full"
                                    />
                                </S.Avatar>
                            ))}
                            {team.users.length > 6 && <S.AvatarMore>+{team.users.length - 6}</S.AvatarMore>}
                            <S.MemberCount>
                                {team.users.length} member{team.users.length !== 1 ? 's' : ''}
                            </S.MemberCount>
                        </S.AvatarStack>
                    ) : (
                        <S.TableMuted>No members</S.TableMuted>
                    )}
                </TableCellContent>
            </td>
            <td className="center">
                <TableCellContent $align="center">
                    <S.TableNumber $muted={!team.flows_count}>
                        {team.flows_count ?? 0}
                    </S.TableNumber>
                </TableCellContent>
            </td>
            <td>
                <TableCellContent>
                    {team.created_at ? (
                        <S.TableDateBadge>
                            <Icon icon="lucide:calendar" width={11} height={11} />
                            {formatDate(team.created_at)}
                        </S.TableDateBadge>
                    ) : (
                        <S.TableMuted>-</S.TableMuted>
                    )}
                </TableCellContent>
            </td>
            {(team.can_manage_members || team.can_update || team.can_delete) && (
                <td>
                    <TableCellContent $align="end">
                        <TeamActionsMenu
                            team={team}
                            isOpen={menuOpen}
                            menuPosition={menuPosition}
                            menuRef={menuRef}
                            onToggle={onToggleMenu}
                            onClose={onCloseMenu}
                            onRename={onRename}
                            onManageMembers={onManageMembers}
                            onDelete={onDelete}
                        />
                    </TableCellContent>
                </td>
            )}
        </tr>
    );
}
