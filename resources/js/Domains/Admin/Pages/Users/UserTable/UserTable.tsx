import React from 'react';
import { router } from '@inertiajs/react';
import { useConfirm } from '@/Shared/Hooks/useConfirm';
import { useAuth } from '@/App/Hooks/usePageProps';
import type { PaginatedData } from '@/Shared/Types/pagination';
import type { UserWithRelations } from '@/Domains/Admin/Pages/Users/Users';
import UserSearchToolbar from './UserSearchToolbar/UserSearchToolbar';
import UsersTable from './UsersTable/UsersTable';
import UserPagination from './UserPagination/UserPagination';
import * as S from './styled';

interface Props {
    users: PaginatedData<UserWithRelations>;
    filteredUsers: UserWithRelations[];
    search: string;
    onSearchChange: (value: string) => void;
    selectedUserIds: Set<Id>;
    onToggleSelected: (user: UserWithRelations) => void;
    onOpenEdit: (user: UserWithRelations) => void;
    onViewWorkspaces: (user: UserWithRelations) => void;
    onViewFlows: (user: UserWithRelations) => void;
}

export default function UserTable({
    users, filteredUsers, search, onSearchChange,
    selectedUserIds, onToggleSelected,
    onOpenEdit, onViewWorkspaces, onViewFlows,
}: Props) {
    const auth = useAuth();
    const { confirm, ConfirmModal } = useConfirm();

    const handleDelete = async (user: UserWithRelations) => {
        if (await confirm({
            title: 'Delete User',
            message: `Delete "${user.name}"? This cannot be undone.`,
            confirmLabel: 'Delete',
            variant: 'danger',
        })) {
            router.delete(`/admin/users/${user.id}`);
        }
    };

    return (
        <>
            <S.Panel>
                <UserSearchToolbar
                    search={search}
                    filteredCount={filteredUsers.length}
                    totalCount={users.total}
                    onSearchChange={onSearchChange}
                />
                <UsersTable
                    users={filteredUsers}
                    hasSearch={Boolean(search)}
                    currentUserId={auth.user?.id}
                    selectedUserIds={selectedUserIds}
                    onToggleSelected={onToggleSelected}
                    onOpenEdit={onOpenEdit}
                    onViewWorkspaces={onViewWorkspaces}
                    onViewFlows={onViewFlows}
                    onDelete={handleDelete}
                />
                <UserPagination pagination={users} />
            </S.Panel>

            <ConfirmModal />
        </>
    );
}
