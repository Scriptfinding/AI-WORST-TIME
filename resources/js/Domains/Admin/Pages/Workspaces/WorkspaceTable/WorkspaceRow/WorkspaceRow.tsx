import React from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { router } from '@inertiajs/react';
import FlowIcon from '@/Shared/UI/FlowIcon/FlowIcon';
import WorkspaceIcon from '@/Domains/Workspace/Components/WorkspaceIcon/WorkspaceIcon';
import type { WorkspaceWithRelations } from '@/Domains/Admin/Pages/Workspaces/Workspaces';
import { timeAgo } from '@/Domains/Admin/Pages/Workspaces/WorkspaceTable/utils';
import { formatDateTime } from '@/Shared/Utils/formatDate';
import * as S from './styled';

interface Props {
    workspace: WorkspaceWithRelations;
    onDelete: (workspace: WorkspaceWithRelations) => void;
    onViewMembers: (workspace: WorkspaceWithRelations) => void;
    onViewFlows: (workspace: WorkspaceWithRelations) => void;
    onEdit: (workspace: WorkspaceWithRelations) => void;
    onTransferOwnership: (workspace: WorkspaceWithRelations) => void;
}

export default function WorkspaceRow({
    workspace,
    onDelete,
    onViewMembers,
    onViewFlows,
    onEdit,
    onTransferOwnership,
}: Props) {
    return (
        <tr>
            <S.IdCell>{workspace.id}</S.IdCell>
            <S.NameCell>
                <S.Name>
                    <WorkspaceIcon workspace={workspace} size={22} />
                    {workspace.name}
                </S.Name>
            </S.NameCell>
            <S.Cell>
                {workspace.lookup_key
                    ? <S.LookupKey>{workspace.lookup_key}</S.LookupKey>
                    : <S.EmptyValue>-</S.EmptyValue>}
            </S.Cell>
            <S.Cell>
                {workspace.owner ? (
                    <S.Owner>
                        <FlowIcon
                            flow={{
                                icon_type: workspace.owner.icon_type,
                                icon_value: workspace.owner.icon_value,
                                icon_color: workspace.owner.icon_color,
                                icon_url: workspace.owner.icon_url,
                                name: workspace.owner.name,
                            }}
                            size={18}
                            radius="full"
                        />
                        {workspace.owner.name}
                    </S.Owner>
                ) : (
                    <S.EmptyValue>-</S.EmptyValue>
                )}
            </S.Cell>
            <S.Cell $center>
                {workspace.users_count > 0 ? (
                    <S.ClickableCount
                        onClick={() => onViewMembers(workspace)}
                        title="View members"
                    >
                        {workspace.users_count}
                    </S.ClickableCount>
                ) : (
                    <S.DisabledCount>0</S.DisabledCount>
                )}
            </S.Cell>
            <S.Cell $center>
                {workspace.flows && workspace.flows.length > 0 ? (
                    <S.ClickableCount
                        onClick={() => onViewFlows(workspace)}
                        title="View flows"
                    >
                        {workspace.flows.length}
                    </S.ClickableCount>
                ) : (
                    <S.DisabledCount>0</S.DisabledCount>
                )}
            </S.Cell>
            <S.Cell>
                {workspace.expires_at
                    ? formatDateTime(workspace.expires_at, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                    })
                    : <S.EmptyValue>Never</S.EmptyValue>}
            </S.Cell>
            <S.Cell>{workspace.created_at && timeAgo(workspace.created_at)}</S.Cell>
            <S.Cell $right>
                <S.Actions>
                    <S.IconButton title="Edit workspace" onClick={() => onEdit(workspace)}>
                        <Icon icon="lucide:pencil" width={14} height={14} />
                    </S.IconButton>
                    <S.IconButton
                        title="Transfer ownership"
                        onClick={() => onTransferOwnership(workspace)}
                    >
                        <Icon icon="lucide:crown" width={14} height={14} />
                    </S.IconButton>
                    <S.IconButton
                        title="Switch to workspace"
                        onClick={() => router.post(`/workspace/${workspace.id}/switch`)}
                    >
                        <Icon icon="lucide:arrow-right-left" width={14} height={14} />
                    </S.IconButton>
                    <S.IconButton
                        $danger
                        title="Delete workspace"
                        onClick={() => onDelete(workspace)}
                    >
                        <Icon icon="lucide:trash-2" width={14} height={14} />
                    </S.IconButton>
                </S.Actions>
            </S.Cell>
        </tr>
    );
}
