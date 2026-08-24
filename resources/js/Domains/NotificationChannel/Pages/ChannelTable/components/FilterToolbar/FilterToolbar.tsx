import React, { useMemo } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import FilterDropdown from '@/Shared/UI/TableFilters/FilterDropdown';
import {
    buildGroupOptions,
    buildScopeOptions,
    getScopeIcon,
    getSelectedGroupLabel,
    getSelectedScopeLabel,
} from '@/Shared/UI/TableFilters/options';
import { useTableFilters } from '@/Shared/UI/TableFilters/useTableFilters';
import type { ChannelTableFilters, ChannelTableTeam } from '@/Domains/NotificationChannel/Pages/ChannelTable/types';
import * as S from './styled';

interface FilterToolbarProps {
    filters: ChannelTableFilters;
    groups: string[];
    teams: ChannelTableTeam[];
    workspaceSharingEnabled: boolean;
}

export default function FilterToolbar({
    filters,
    groups,
    teams,
    workspaceSharingEnabled,
}: FilterToolbarProps) {
    const { applyFilters, hasActiveFilters, resetFilters, search, setSearch } = useTableFilters({
        filters,
        route: '/channels',
    });
    const groupOptions = buildGroupOptions(groups);
    const selectedGroupLabel = getSelectedGroupLabel(filters.group);
    const scopeOptions = useMemo(
        () => buildScopeOptions(teams, workspaceSharingEnabled, 'My channels'),
        [teams, workspaceSharingEnabled],
    );
    const selectedScopeLabel = useMemo(
        () => getSelectedScopeLabel(filters.scope, scopeOptions),
        [filters.scope, scopeOptions],
    );

    const selectGroup = (value: string) => {
        applyFilters({ group: value === '__all__' ? null : value });
    };
    const selectScope = (value: string) => {
        applyFilters({ scope: value === '__all__' ? null : value });
    };
    const scopeIcon = getScopeIcon(filters.scope);

    return (
        <>
            <S.Header>
                <S.Toolbar>
                    <S.SearchForm onSubmit={event => { event.preventDefault(); applyFilters(); }}>
                        <S.SearchBar>
                            <Icon icon="lucide:search" width={14} height={14} />
                            <S.SearchInput
                                placeholder="Search channels..."
                                value={search}
                                onChange={event => setSearch(event.target.value)}
                                onKeyDown={event => { if (event.key === 'Enter') applyFilters(); }}
                            />
                            {search && (
                                <S.SearchClear type="button" onClick={() => { setSearch(''); applyFilters({ search: null }); }}>
                                    <Icon icon="lucide:x" width={12} height={12} />
                                </S.SearchClear>
                            )}
                        </S.SearchBar>
                    </S.SearchForm>
                    {groups.length > 0 && (
                        <FilterDropdown
                            emptyLabel="No groups found"
                            onSelect={selectGroup}
                            options={groupOptions}
                            panelShadow="0 8px 24px rgba(0, 0, 0, 0.12)"
                            searchPlaceholder="Search groups..."
                            selectedValue={filters.group ?? '__all__'}
                            triggerIcon="lucide:folder"
                            triggerLabel={selectedGroupLabel}
                        />
                    )}
                    <FilterDropdown
                        emptyLabel="No results"
                        onSelect={selectScope}
                        options={scopeOptions}
                        panelShadow="0 8px 24px rgba(0, 0, 0, 0.12)"
                        searchPlaceholder="Search scopes..."
                        sections={[{ value: 'team', label: 'Teams' }]}
                        selectedValue={filters.scope ?? '__all__'}
                        triggerIcon={scopeIcon}
                        triggerLabel={selectedScopeLabel}
                    />
                </S.Toolbar>
            </S.Header>
            {hasActiveFilters && (
                <S.FilterResetBanner type="button" onClick={resetFilters}>
                    <Icon icon="lucide:filter-x" width={14} height={14} />
                    Filtered results, click to reset
                </S.FilterResetBanner>
            )}
        </>
    );
}
