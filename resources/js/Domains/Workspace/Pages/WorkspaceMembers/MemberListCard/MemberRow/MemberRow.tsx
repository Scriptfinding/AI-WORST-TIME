import { Icon } from '@/Shared/UI/Icon/Icon';
import Badge from '@/Shared/UI/Badge/Badge';
import FlowIcon from '@/Shared/UI/FlowIcon/FlowIcon';
import AvatarSelectionToggle from '@/Shared/UI/AvatarSelectionToggle/AvatarSelectionToggle';
import TableCellContent from '@/Shared/UI/TableCellContent/TableCellContent';
import type { WorkspaceUser } from '@/Domains/Workspace/types';
import { ucfirst } from '@/Shared/Utils/string';
import * as Shared from '@/Domains/Workspace/Pages/WorkspaceMembers/shared.styled';
import type { Team } from '@/Domains/Workspace/Pages/WorkspaceMembers/types';
import { formatDate } from '@/Domains/Workspace/Pages/WorkspaceMembers/utils';
import MemberActionsMenu from '@/Domains/Workspace/Pages/WorkspaceMembers/MemberListCard/MemberActionsMenu/MemberActionsMenu';
import * as S from './styled';

interface Props {
    user: WorkspaceUser;
    teams: Team[];
    isLastAdmin: boolean;
    isWorkspaceAdmin: boolean;
    manageable: boolean;
    teamsEnabled: boolean;
    workspaceSharingEnabled: boolean;
    selectable: boolean;
    selected: boolean;
    onToggleSelected: (user: WorkspaceUser) => void;
    onEdit: (user: WorkspaceUser) => void;
    onManageTeams: (user: WorkspaceUser) => void;
    onRemove: (user: WorkspaceUser) => void;
}

export default function MemberRow({
    user,
    teams,
    isLastAdmin,
    isWorkspaceAdmin,
    manageable,
    teamsEnabled,
    workspaceSharingEnabled,
    selectable,
    selected,
    onToggleSelected,
    onEdit,
    onManageTeams,
    onRemove,
}: Props) {
    return (
        <tr>
            <td>
                <TableCellContent>
                    <S.UserCell>
                        {selectable ? (
                            <AvatarSelectionToggle
                                selected={selected}
                                onChange={() => onToggleSelected(user)}
                                label={`${selected ? 'Deselect' : 'Select'} ${user.name}`}
                            >
                                <FlowIcon
                                    flow={{
                                        icon_type: user.icon_type,
                                        icon_value: user.icon_value,
                                        icon_color: user.icon_color,
                                        icon_url: user.icon_url,
                                        name: user.name,
                                    }}
                                    size={28}
                                    radius="full"
                                />
                            </AvatarSelectionToggle>
                        ) : (
                            <FlowIcon
                                flow={{
                                    icon_type: user.icon_type,
                                    icon_value: user.icon_value,
                                    icon_color: user.icon_color,
                                    icon_url: user.icon_url,
                                    name: user.name,
                                }}
                                size={28}
                                radius="full"
                            />
                        )}
                        <S.UserInfo>
                            <S.MemberName>{user.name}</S.MemberName>
                            {user.role === 'admin' && (
                                <S.InstanceAdminPill title="Instance administrator">
                                    <Icon icon="lucide:shield-check" width={11} height={11} />
                                    Instance admin
                                </S.InstanceAdminPill>
                            )}
                        </S.UserInfo>
                    </S.UserCell>
                </TableCellContent>
            </td>
            <td>
                <TableCellContent>
                    <Shared.TableEmailLink href={`mailto:${user.email}`} title={user.email}>
                        <Icon icon="lucide:mail" width={12} height={12} />
                        {user.email}
                    </Shared.TableEmailLink>
                </TableCellContent>
            </td>
            {teamsEnabled && (
                <td>
                    <TableCellContent>
                        {teams.length > 0 ? (
                            <S.TeamBadges>
                                {teams.map(team => <S.TeamBadge key={team.id}>{team.name}</S.TeamBadge>)}
                            </S.TeamBadges>
                        ) : (
                            <S.Muted>None</S.Muted>
                        )}
                    </TableCellContent>
                </td>
            )}
            {workspaceSharingEnabled && (
                <td>
                    <TableCellContent>
                        <Badge variant={user.pivot.role === 'admin' ? 'info' : user.pivot.role === 'manager' ? 'warning' : 'success'}>
                            {ucfirst(user.pivot.role)}
                        </Badge>
                    </TableCellContent>
                </td>
            )}
            <td className="center">
                <TableCellContent $align="center">
                    <S.Number $muted={!user.flows_count}>{user.flows_count ?? 0}</S.Number>
                </TableCellContent>
            </td>
            <td>
                <TableCellContent>
                    <Shared.BoolCell $yes={!!user.can_create_workspace}>
                        <Icon icon={user.can_create_workspace ? 'lucide:circle-check' : 'lucide:circle-minus'} width={13} height={13} />
                        {user.can_create_workspace ? 'Can create' : 'No'}
                    </Shared.BoolCell>
                </TableCellContent>
            </td>
            <td>
                <TableCellContent>
                    {user.pivot.created_at ? (
                        <Shared.TableDateBadge>
                            <Icon icon="lucide:calendar" width={11} height={11} />
                            {formatDate(user.pivot.created_at)}
                        </Shared.TableDateBadge>
                    ) : (
                        <S.Muted>—</S.Muted>
                    )}
                </TableCellContent>
            </td>
            {isWorkspaceAdmin && (
                <td>
                    <TableCellContent $align="end">
                        {manageable && (
                            <MemberActionsMenu
                                user={user}
                                teamsEnabled={teamsEnabled}
                                isLastAdmin={isLastAdmin}
                                onEdit={onEdit}
                                onManageTeams={onManageTeams}
                                onRemove={onRemove}
                            />
                        )}
                    </TableCellContent>
                </td>
            )}
        </tr>
    );
}
