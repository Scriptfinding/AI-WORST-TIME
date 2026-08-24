import { useEffect, useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { router } from '@inertiajs/react';
import Button from '@/Shared/UI/Button/Button';
import type { ExplorerFilters } from '@/Domains/Flow/Pages/FlowExplorer/ExplorerContent/types';
import * as S from './styled';

interface Props {
    filters: ExplorerFilters;
    isWorkspaceView: boolean;
    viewMode: string;
    selectionActive: boolean;
    selectedCount: number;
    selectableVisibleCount: number;
    allVisibleSelected: boolean;
    deletingSelected: boolean;
    onClearSelection: () => void;
    onDeleteSelected: () => void;
    onToggleSelectAllVisible: () => void;
}

export default function ExplorerToolbar({
    filters,
    isWorkspaceView,
    viewMode,
    selectionActive,
    selectedCount,
    selectableVisibleCount,
    allVisibleSelected,
    deletingSelected,
    onClearSelection,
    onDeleteSelected,
    onToggleSelectAllVisible,
}: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [searchEverywhere, setSearchEverywhere] = useState(filters.search_everywhere === '1');
    const hasActiveSearch = Boolean(filters.search);
    const hasEverywhereSearch = filters.search_everywhere === '1';

    useEffect(() => {
        setSearchEverywhere(filters.search_everywhere === '1');
    }, [filters.search_everywhere]);

    const getSearchData = () => {
        const data: Record<string, string | number | null> = {
            search,
            folder_id: filters.folder_id,
            owner_id: filters.owner_id,
        };
        if (isWorkspaceView) data.view = 'workspace';
        return data;
    };

    const handleSearch = (event: React.FormEvent) => {
        event.preventDefault();
        const data = getSearchData();
        if (searchEverywhere && search.trim()) data.search_everywhere = '1';
        router.visit('/flows', { data, preserveState: true });
    };

    const resetSearch = () => {
        setSearch('');
        setSearchEverywhere(false);
        const data: Record<string, string | number | null> = {
            folder_id: filters.folder_id,
            owner_id: filters.owner_id,
        };
        if (isWorkspaceView) data.view = 'workspace';
        router.visit('/flows', { data, preserveState: true });
    };

    const toggleSearchEverywhere = () => {
        const next = !searchEverywhere;
        setSearchEverywhere(next);
        if (!search.trim()) return;

        const data = getSearchData();
        if (next) data.search_everywhere = '1';
        router.visit('/flows', { data, preserveState: true });
    };

    const toggleViewMode = () => {
        const next = viewMode === 'grid' ? 'list' : 'grid';
        router.patch('/profile/preference', { key: 'explorer_view_mode', value: next }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <>
            <S.Toolbar>
                <S.ToolbarLeft>
                    <S.SearchForm onSubmit={handleSearch}>
                        <S.SearchWrapper>
                            <Icon icon="lucide:search" />
                            <S.SearchInput
                                value={search}
                                onChange={event => setSearch(event.target.value)}
                                placeholder="Search flows..."
                            />
                        </S.SearchWrapper>
                        <S.SearchScopeSwitch
                            type="button"
                            $active={searchEverywhere}
                            onClick={toggleSearchEverywhere}
                            title={searchEverywhere ? 'Search across all folders' : 'Search only in the current folder'}
                        >
                            <S.SearchScopeOption $active={!searchEverywhere}>Folder</S.SearchScopeOption>
                            <S.SearchScopeKnob>
                                <Icon icon={searchEverywhere ? 'lucide:globe-2' : 'lucide:folder'} width={12} height={12} />
                            </S.SearchScopeKnob>
                            <S.SearchScopeOption $active={searchEverywhere}>Everywhere</S.SearchScopeOption>
                        </S.SearchScopeSwitch>
                    </S.SearchForm>
                </S.ToolbarLeft>
                <S.ToolbarRight>
                    {selectionActive && (
                        <>
                            <Button
                                variant="secondary"
                                size="sm"
                                disabled={deletingSelected}
                                onClick={onClearSelection}
                            >
                                <Icon icon="lucide:x" width={14} />
                                <S.SelectionButtonLabel>Clear</S.SelectionButtonLabel>
                            </Button>
                            <Button
                                variant="danger"
                                size="sm"
                                loading={deletingSelected}
                                onClick={onDeleteSelected}
                            >
                                <Icon icon="lucide:trash-2" width={14} />
                                <S.SelectionButtonLabel>Delete ({selectedCount})</S.SelectionButtonLabel>
                            </Button>
                        </>
                    )}
                    {selectableVisibleCount > 0 && (
                        <Button
                            variant="secondary"
                            size="sm"
                            disabled={deletingSelected}
                            onClick={onToggleSelectAllVisible}
                        >
                            <Icon icon="lucide:check-square" width={14} />
                            <S.SelectionButtonLabel>
                                {allVisibleSelected ? 'Uncheck all' : 'Check all'}
                            </S.SelectionButtonLabel>
                        </Button>
                    )}
                    <S.ViewToggle $active={viewMode === 'grid'} onClick={toggleViewMode} title="Grid view">
                        <Icon icon="lucide:layout-grid" />
                    </S.ViewToggle>
                    <S.ViewToggle $active={viewMode === 'list'} onClick={toggleViewMode} title="List view">
                        <Icon icon="lucide:list" />
                    </S.ViewToggle>
                </S.ToolbarRight>
            </S.Toolbar>

            {hasActiveSearch && (
                <S.FilterResetBanner type="button" onClick={resetSearch}>
                    <Icon icon="lucide:filter-x" width={14} height={14} />
                    {hasEverywhereSearch
                        ? 'Searching everywhere. Click to reset all filters.'
                        : 'Filtered mode active. Click to reset all filters.'}
                </S.FilterResetBanner>
            )}
        </>
    );
}
