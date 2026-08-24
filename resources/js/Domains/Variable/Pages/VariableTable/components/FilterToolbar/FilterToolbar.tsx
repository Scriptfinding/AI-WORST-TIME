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
import type { VariableTableFilters, VariableTableTeam } from '@/Domains/Variable/Pages/VariableTable/types';
import * as S from './styled';

interface FilterToolbarProps {
    filters: VariableTableFilters;
    groups: string[];
    teams: VariableTableTeam[];
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
        route: '/variables',
    });
    const groupOptions = buildGroupOptions(groups);
    const selectedGroupLabel = getSelectedGroupLabel(filters.group);
    const scopeOptions = useMemo(
        () => buildScopeOptions(teams, workspaceSharingEnabled, 'My variables'),
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

    return (
        <>
            <S.Header>
                <S.Toolbar>
                    <S.SearchForm onSubmit={event => { event.preventDefault(); applyFilters(); }}>
                        <S.SearchWrapper>
                            <Icon icon="lucide:search" />
                            <S.SearchInput
                                value={search}
                                onChange={event => setSearch(event.target.value)}
                                placeholder="Search variables..."
                            />
                        </S.SearchWrapper>
                    </S.SearchForm>
                    {groups.length > 0 && (
                        <FilterDropdown
                            emptyLabel="No groups found"
                            onSelect={selectGroup}
                            options={groupOptions}
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
                        searchPlaceholder="Search scopes..."
                        sections={[{ value: 'team', label: 'Teams' }]}
                        selectedValue={filters.scope ?? '__all__'}
                        triggerIcon={getScopeIcon(filters.scope)}
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
