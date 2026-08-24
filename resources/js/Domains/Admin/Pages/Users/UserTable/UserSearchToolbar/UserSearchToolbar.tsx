import React from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import * as S from './styled';

interface Props {
    search: string;
    filteredCount: number;
    totalCount: number;
    onSearchChange: (value: string) => void;
}

export default function UserSearchToolbar({
    search,
    filteredCount,
    totalCount,
    onSearchChange,
}: Props) {
    const hasActiveFilter = Boolean(search.trim());
    const count = hasActiveFilter ? `${filteredCount} / ${totalCount}` : totalCount;

    return (
        <>
            <S.Toolbar>
                <S.SearchWrapper>
                    <Icon icon="lucide:search" width={14} height={14} />
                    <S.SearchInput
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={event => onSearchChange(event.target.value)}
                    />
                </S.SearchWrapper>
                <S.CountBadge>
                    {count} user{totalCount !== 1 ? 's' : ''}
                </S.CountBadge>
            </S.Toolbar>

            {hasActiveFilter && (
                <S.FilterResetBanner type="button" onClick={() => onSearchChange('')}>
                    <Icon icon="lucide:filter-x" width={14} height={14} />
                    Filtered results, click to reset
                </S.FilterResetBanner>
            )}
        </>
    );
}
