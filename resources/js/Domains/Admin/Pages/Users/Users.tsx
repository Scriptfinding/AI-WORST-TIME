import React, { useEffect, useState, useMemo } from 'react';
import { router } from '@inertiajs/react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import AppLayout from '@/App/Layout/AppLayout/AppLayout';
import Button from '@/Shared/UI/Button/Button';
import BulkDeleteConfirmation from '@/Shared/UI/BulkDeleteConfirmation/BulkDeleteConfirmation';
import FlowIcon from '@/Shared/UI/FlowIcon/FlowIcon';
import { useConfirm } from '@/Shared/Hooks/useConfirm';
import { useUrlSyncedModal } from '@/Shared/Hooks/useUrlSyncedModal';
import type { PaginatedData } from '@/Shared/Types/pagination';
import type { User } from '@/App/types';
import type { Workspace } from '@/Domains/Workspace/types';
import UserTable from './UserTable/UserTable';
import UserModals from './UserModals/UserModals';
import RegistrationRequests, {
    type RegistrationRequest,
} from './RegistrationRequests/RegistrationRequests';
import * as S from './styled';

export interface UserWorkspace extends Pick<Workspace, 'id' | 'name' | 'icon_type' | 'icon_value' | 'icon_color' | 'icon_url'> {
    pivot: { role: 'admin' | 'manager' | 'member' };
}

export interface UserWithRelations extends User {
    workspaces_count: number;
    owned_flows_count: number;
    api_keys_count: number;
    workspaces: UserWorkspace[];
    owned_flows: { id: Id; name: string; icon_type: string; icon_value: string | null; icon_color: string | null; icon_url: string | null }[];
    created_at: string;
}

interface Props {
    users: PaginatedData<UserWithRelations>;
    editingUser: UserWithRelations | null;
    allWorkspaces: Pick<Workspace, 'id' | 'name'>[];
    registrationRequests: RegistrationRequest[];
}

export default function Users({ users, editingUser: initialEditingUser, allWorkspaces, registrationRequests }: Props) {
    const [search, setSearch] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const modalUsers = useMemo(
        () => initialEditingUser && !users.data.some(user => user.id === initialEditingUser.id)
            ? [...users.data, initialEditingUser]
            : users.data,
        [initialEditingUser, users.data],
    );
    const {
        selectedItem: editingUser,
        openModal: openEditingUser,
        closeModal: closeEditingUser,
    } = useUrlSyncedModal(modalUsers, 'edit');
    const [wsDetailUser, setWsDetailUser] = useState<UserWithRelations | null>(null);
    const [flowsDetailUser, setFlowsDetailUser] = useState<UserWithRelations | null>(null);
    const [selectedUserIds, setSelectedUserIds] = useState<Set<Id>>(() => new Set());
    const [deletingSelected, setDeletingSelected] = useState(false);
    const { confirm, ConfirmModal } = useConfirm();

    useEffect(() => {
        const availableUserIds = new Set(users.data.map(user => user.id));
        setSelectedUserIds(current => {
            const next = new Set([...current].filter(id => availableUserIds.has(id)));
            return next.size === current.size ? current : next;
        });
    }, [users.data]);

    const filteredUsers = useMemo(() => {
        if (!search.trim()) return users.data;
        const q = search.toLowerCase();
        return users.data.filter(u =>
            u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
        );
    }, [users.data, search]);

    const toggleSelected = (user: UserWithRelations) => {
        setSelectedUserIds(current => {
            const next = new Set(current);
            if (next.has(user.id)) {
                next.delete(user.id);
            } else {
                next.add(user.id);
            }
            return next;
        });
    };

    const deleteSelected = async () => {
        const selectedUsers = users.data.filter(user => selectedUserIds.has(user.id));
        if (selectedUsers.length === 0) return;

        const confirmed = await confirm({
            title: selectedUsers.length === 1 ? 'Delete User' : 'Delete Users',
            message: (
                <BulkDeleteConfirmation
                    description="The selected accounts and their workspace access will be permanently removed."
                    items={selectedUsers.map(user => ({
                        id: user.id,
                        title: user.name,
                        subtitle: user.email,
                        icon: (
                            <FlowIcon
                                flow={{
                                    icon_type: user.icon_type,
                                    icon_value: user.icon_value,
                                    icon_color: user.icon_color,
                                    icon_url: user.icon_url,
                                    name: user.name,
                                }}
                                size={26}
                                radius="full"
                            />
                        ),
                    }))}
                />
            ),
            confirmLabel: `Delete (${selectedUsers.length})`,
            variant: 'danger',
        });
        if (!confirmed) return;

        setDeletingSelected(true);
        router.delete('/admin/users/bulk-delete', {
            data: { user_ids: selectedUsers.map(user => user.id) },
            preserveScroll: true,
            onSuccess: () => setSelectedUserIds(new Set()),
            onFinish: () => setDeletingSelected(false),
        });
    };

    return (
        <AppLayout
            title="Users"
            headerRight={
                <S.HeaderActions>
                    {selectedUserIds.size > 0 && (
                        <Button
                            size="sm"
                            variant="danger"
                            loading={deletingSelected}
                            onClick={deleteSelected}
                        >
                            <Icon icon="lucide:trash-2" width={14} height={14} />
                            Delete ({selectedUserIds.size})
                        </Button>
                    )}
                    <Button size="sm" onClick={() => setShowCreate(true)}>
                        <Icon icon="lucide:user-plus" width={14} height={14} />
                        Add User
                    </Button>
                </S.HeaderActions>
            }
        >
            <S.Page>
                <RegistrationRequests requests={registrationRequests} workspaces={allWorkspaces} />
                <UserTable
                    users={users}
                    filteredUsers={filteredUsers}
                    search={search}
                    onSearchChange={setSearch}
                    selectedUserIds={selectedUserIds}
                    onToggleSelected={toggleSelected}
                    onOpenEdit={openEditingUser}
                    onViewWorkspaces={setWsDetailUser}
                    onViewFlows={setFlowsDetailUser}
                />
            </S.Page>

            <UserModals
                showCreate={showCreate}
                onCloseCreate={() => setShowCreate(false)}
                editingUser={editingUser}
                onCloseEdit={closeEditingUser}
                wsDetailUser={wsDetailUser}
                onCloseWsDetail={() => setWsDetailUser(null)}
                flowsDetailUser={flowsDetailUser}
                onCloseFlowsDetail={() => setFlowsDetailUser(null)}
                allWorkspaces={allWorkspaces}
            />
            <ConfirmModal />
        </AppLayout>
    );
}
