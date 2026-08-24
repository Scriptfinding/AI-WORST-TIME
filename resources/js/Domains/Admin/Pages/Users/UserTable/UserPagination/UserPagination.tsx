import React from 'react';
import { router } from '@inertiajs/react';
import type { PaginatedData } from '@/Shared/Types/pagination';
import type { UserWithRelations } from '@/Domains/Admin/Pages/Users/Users';
import * as S from './styled';

interface Props {
    pagination: PaginatedData<UserWithRelations>;
}

export default function UserPagination({ pagination }: Props) {
    if (pagination.last_page <= 1) return null;

    return (
        <S.Footer>
            <S.Pagination>
                {pagination.links.map((link, index) => (
                    <S.PageButton
                        key={index}
                        $active={link.active}
                        disabled={!link.url}
                        onClick={() => link.url && router.get(link.url)}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ))}
            </S.Pagination>
        </S.Footer>
    );
}
