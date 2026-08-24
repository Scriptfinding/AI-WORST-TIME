import type { WorkspaceUser } from '@/Domains/Workspace/types';
import * as Shared from '@/Domains/Workspace/Pages/WorkspaceMembers/shared.styled';
import type { Team } from '@/Domains/Workspace/Pages/WorkspaceMembers/types';
import MemberRow from '@/Domains/Workspace/Pages/WorkspaceMembers/MemberListCard/MemberRow/MemberRow';
import * as S from './styled';

interface Props {
    members: WorkspaceUser[];
    userTeams: Map<Id, Team[]>;
    search: string;
    adminCount: number;
    isWorkspaceAdmin: boolean;
    viewerIsInstanceAdmin: boolean;
    teamsEnabled: boolean;
    workspaceSharingEnabled: boolean;
    workspaceOwnerId: Id | null;
    selectedUserIds: Set<Id>;
    onToggleSelected: (user: WorkspaceUser) => void;
    onEdit: (user: WorkspaceUser) => void;
    onManageTeams: (user: WorkspaceUser) => void;
    onRemove: (user: WorkspaceUser) => void;
}

export default function MemberTable({
    members,
    userTeams,
    search,
    adminCount,
    isWorkspaceAdmin,
    viewerIsInstanceAdmin,
    teamsEnabled,
    workspaceSharingEnabled,
    workspaceOwnerId,
    selectedUserIds,
    onToggleSelected,
    onEdit,
    onManageTeams,
    onRemove,
}: Props) {
    const columnCount = 5 + Number(teamsEnabled) + Number(workspaceSharingEnabled) + Number(isWorkspaceAdmin);

    return (
        <Shared.TableWrapper>
            <Shared.Table>
                <thead>
                    <tr>
                        <th>Member</th>
                        <th>Email</th>
                        {teamsEnabled && <th>Teams</th>}
                        {workspaceSharingEnabled && <th>Role</th>}
                        <th className="center">Flows</th>
                        <th>Workspaces</th>
                        <th>Joined</th>
                        {isWorkspaceAdmin && <th aria-label="Actions" />}
                    </tr>
                </thead>
                <tbody>
                    {members.map(user => {
                        // Instance admins can only be managed by other instance admins.
                        const manageable = viewerIsInstanceAdmin || user.role !== 'admin';

                        return (
                        <MemberRow
                            key={user.id}
                            user={user}
                            teams={userTeams.get(user.id) ?? []}
                            isLastAdmin={user.pivot.role === 'admin' && adminCount <= 1}
                            isWorkspaceAdmin={isWorkspaceAdmin}
                            manageable={manageable}
                            teamsEnabled={teamsEnabled}
                            workspaceSharingEnabled={workspaceSharingEnabled}
                            selectable={isWorkspaceAdmin && manageable && user.id !== workspaceOwnerId && !(user.pivot.role === 'admin' && adminCount <= 1)}
                            selected={selectedUserIds.has(user.id)}
                            onToggleSelected={onToggleSelected}
                            onEdit={onEdit}
                            onManageTeams={onManageTeams}
                            onRemove={onRemove}
                        />
                        );
                    })}
                    {members.length === 0 && (
                        <tr>
                            <S.EmptyCell colSpan={columnCount}>
                                {search ? 'No members match your search.' : 'No members yet.'}
                            </S.EmptyCell>
                        </tr>
                    )}
                </tbody>
            </Shared.Table>
        </Shared.TableWrapper>
    );
}
