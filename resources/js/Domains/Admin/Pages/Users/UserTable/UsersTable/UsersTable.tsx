import React from 'react';
import type { UserWithRelations } from '@/Domains/Admin/Pages/Users/Users';
import UserRow from '@/Domains/Admin/Pages/Users/UserTable/UserRow/UserRow';
import * as S from './styled';

interface Props {
    users: UserWithRelations[];
    hasSearch: boolean;
    currentUserId?: Id;
    selectedUserIds: Set<Id>;
    onToggleSelected: (user: UserWithRelations) => void;
    onOpenEdit: (user: UserWithRelations) => void;
    onViewWorkspaces: (user: UserWithRelations) => void;
    onViewFlows: (user: UserWithRelations) => void;
    onDelete: (user: UserWithRelations) => void;
}

export default function UsersTable({
    users,
    hasSearch,
    currentUserId,
    selectedUserIds,
    onToggleSelected,
    onOpenEdit,
    onViewWorkspaces,
    onViewFlows,
    onDelete,
}: Props) {
    return (
        <S.TableWrapper>
            <S.Table>
                <thead>
                    <tr>
                        <S.Th>ID</S.Th>
                        <S.Th>Name</S.Th>
                        <S.Th>Email</S.Th>
                        <S.Th>Workspaces</S.Th>
                        <S.Th $center>Assigned</S.Th>
                        <S.Th $center>Flows</S.Th>
                        <S.Th $center>API Keys</S.Th>
                        <S.Th>Joined</S.Th>
                        <S.Th $right />
                    </tr>
                </thead>
                <tbody>
                    {users.length === 0 && (
                        <tr>
                            <S.EmptyCell colSpan={9}>
                                <S.EmptyState>
                                    {hasSearch ? 'No users match your search.' : 'No users yet.'}
                                </S.EmptyState>
                            </S.EmptyCell>
                        </tr>
                    )}
                    {users.map(user => (
                        <UserRow
                            key={user.id}
                            user={user}
                            currentUserId={currentUserId}
                            selected={selectedUserIds.has(user.id)}
                            onToggleSelected={onToggleSelected}
                            onOpenEdit={onOpenEdit}
                            onViewWorkspaces={onViewWorkspaces}
                            onViewFlows={onViewFlows}
                            onDelete={onDelete}
                        />
                    ))}
                </tbody>
            </S.Table>
        </S.TableWrapper>
    );
}
