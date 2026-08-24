import React from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { router } from '@inertiajs/react';
import type { UserWithRelations } from '@/Domains/Admin/Pages/Users/Users';
import * as S from './styled';

interface Props {
    user: UserWithRelations;
    canImpersonate: boolean;
    onEdit: (user: UserWithRelations) => void;
    onDelete: (user: UserWithRelations) => void;
}

export default function UserActions({
    user,
    canImpersonate,
    onEdit,
    onDelete,
}: Props) {
    return (
        <S.Actions>
            {canImpersonate && (
                <S.IconButton
                    title="Impersonate"
                    onClick={() => router.post(`/admin/users/${user.id}/impersonate`)}
                >
                    <Icon icon="lucide:log-in" width={14} height={14} />
                </S.IconButton>
            )}
            <S.IconButton onClick={() => onEdit(user)} title="Edit">
                <Icon icon="lucide:pencil" width={14} height={14} />
            </S.IconButton>
            <S.IconButton $danger title="Delete" onClick={() => onDelete(user)}>
                <Icon icon="lucide:trash-2" width={14} height={14} />
            </S.IconButton>
        </S.Actions>
    );
}
