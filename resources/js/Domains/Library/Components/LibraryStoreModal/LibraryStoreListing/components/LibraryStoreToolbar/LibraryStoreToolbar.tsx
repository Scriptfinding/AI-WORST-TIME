import React from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import Button from '@/Shared/UI/Button/Button';
import type { SortKey } from '@/Domains/Library/Components/LibraryStoreModal/types';
import * as S from './styled';

const SORTS: { key: SortKey; label: string }[] = [
    { key: 'popular', label: 'Popular' },
    { key: 'downloaded', label: 'Downloaded' },
    { key: 'liked', label: 'Liked' },
    { key: 'newest', label: 'Newest' },
    { key: 'used', label: 'Used' },
];

interface Props {
    search: string;
    sort: SortKey;
    loading: boolean;
    refreshing: boolean;
    onSearchChange: (value: string) => void;
    onSortChange: (value: SortKey) => void;
    onRefresh: () => void;
}

export default function LibraryStoreToolbar({
    search,
    sort,
    loading,
    refreshing,
    onSearchChange,
    onSortChange,
    onRefresh,
}: Props) {
    return (
        <S.Toolbar>
            <S.SortTabs>
                {SORTS.map((option) => (
                    <S.SortTab
                        key={option.key}
                        type="button"
                        $active={sort === option.key}
                        onClick={() => onSortChange(option.key)}
                    >
                        {option.label}
                    </S.SortTab>
                ))}
            </S.SortTabs>
            <S.ToolbarRight>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onRefresh}
                    loading={refreshing}
                    disabled={loading || refreshing}
                >
                    <Icon icon="lucide:refresh-cw" width={14} />
                    Refresh
                </Button>
                <S.SearchBox>
                    <Icon icon="lucide:search" width={15} />
                    <S.SearchInput
                        value={search}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => onSearchChange(event.target.value)}
                        placeholder="Search blueprints..."
                    />
                </S.SearchBox>
            </S.ToolbarRight>
        </S.Toolbar>
    );
}
