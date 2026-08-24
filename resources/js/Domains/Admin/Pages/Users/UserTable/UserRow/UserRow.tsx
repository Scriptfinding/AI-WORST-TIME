import React from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import Badge from '@/Shared/UI/Badge/Badge';
import FlowIcon from '@/Shared/UI/FlowIcon/FlowIcon';
import AvatarSelectionToggle from '@/Shared/UI/AvatarSelectionToggle/AvatarSelectionToggle';
import type { UserWithRelations } from '@/Domains/Admin/Pages/Users/Users';
import UserActions from '@/Domains/Admin/Pages/Users/UserTable/UserActions/UserActions';
import { timeAgo } from '@/Domains/Admin/Pages/Users/UserTable/utils';
import * as Shared from '@/Domains/Workspace/Pages/WorkspaceMembers/shared.styled';
import * as S from './styled';

interface Props {
    user: UserWithRelations;
    currentUserId?: Id;
    selected: boolean;
    onToggleSelected: (user: UserWithRelations) => void;
    onOpenEdit: (user: UserWithRelations) => void;
    onViewWorkspaces: (user: UserWithRelations) => void;
    onViewFlows: (user: UserWithRelations) => void;
    onDelete: (user: UserWithRelations) => void;
}

export default function UserRow({
    user,
    currentUserId,
    selected,
    onToggleSelected,
    onOpenEdit,
    onViewWorkspaces,
    onViewFlows,
    onDelete,
}: Props) {
    return (
        <tr>
            <S.IdCell>{user.id}</S.IdCell>
            <S.NameCell>
                <S.Name>
                    {user.id !== currentUserId ? (
                        <AvatarSelectionToggle
                            selected={selected}
                            onChange={() => onToggleSelected(user)}
                            label={`${selected ? 'Deselect' : 'Select'} ${user.name}`}
                            size={22}
                        >
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
                            size={22}
                            radius="full"
                        />
                    )}
                    {user.name}
                </S.Name>
            </S.NameCell>
            <S.Cell>
                <S.Email>
                    {user.email}
                    {user.role === 'admin' && <Badge variant="info">Super Admin</Badge>}
                </S.Email>
            </S.Cell>
            <S.Cell>
                <Shared.BoolCell $yes={!!user.can_create_workspace}>
                    <Icon icon={user.can_create_workspace ? 'lucide:circle-check' : 'lucide:circle-minus'} width={13} height={13} />
                    {user.can_create_workspace ? 'Can create' : 'No'}
                </Shared.BoolCell>
            </S.Cell>
            <S.Cell $center>
                {user.workspaces && user.workspaces.length > 0 ? (
                    <S.ClickableCount
                        onClick={() => onViewWorkspaces(user)}
                        title="View workspaces"
                    >
                        {user.workspaces.length}
                    </S.ClickableCount>
                ) : (
                    <S.DisabledCount>0</S.DisabledCount>
                )}
            </S.Cell>
            <S.Cell $center>
                {user.owned_flows && user.owned_flows.length > 0 ? (
                    <S.ClickableCount onClick={() => onViewFlows(user)} title="View flows">
                        {user.owned_flows.length}
                    </S.ClickableCount>
                ) : (
                    <S.DisabledCount>0</S.DisabledCount>
                )}
            </S.Cell>
            <S.Cell $center>
                {user.api_keys_count > 0 ? (
                    <S.ClickableCount as="span">{user.api_keys_count}</S.ClickableCount>
                ) : (
                    <S.DisabledCount>0</S.DisabledCount>
                )}
            </S.Cell>
            <S.Cell>{user.created_at && timeAgo(user.created_at)}</S.Cell>
            <S.Cell $right>
                <UserActions
                    user={user}
                    canImpersonate={user.id !== currentUserId}
                    onEdit={onOpenEdit}
                    onDelete={onDelete}
                />
            </S.Cell>
        </tr>
    );
}
