import { useMemo, type ReactNode } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import FilterDropdown from '@/Shared/UI/TableFilters/FilterDropdown';
import {
    buildScopeOptions,
    getScopeIcon,
    getSelectedScopeLabel,
} from '@/Shared/UI/TableFilters/options';
import type { TableFilterTeam } from '@/Shared/UI/TableFilters/types';
import * as S from '@/Shared/UI/TableFilters/LocalTableFilterToolbar.styled';

interface Props {
    search: string;
    scope: string | null;
    teams: TableFilterTeam[];
    searchPlaceholder: string;
    personalScopeLabel: string;
    trailing?: ReactNode;
    className?: string;
    onSearchChange: (search: string) => void;
    onScopeChange: (scope: string | null) => void;
}

export default function LocalTableFilterToolbar({
    search,
    scope,
    teams,
    searchPlaceholder,
    personalScopeLabel,
    trailing,
    className,
    onSearchChange,
    onScopeChange,
}: Props) {
    const scopeOptions = useMemo(
        () => buildScopeOptions(teams, true, personalScopeLabel),
        [personalScopeLabel, teams],
    );
    const selectedScopeLabel = useMemo(
        () => getSelectedScopeLabel(scope, scopeOptions),
        [scope, scopeOptions],
    );
    const hasActiveFilters = search.trim() !== '' || scope !== null;

    return (
        <S.Container className={className}>
            <S.Toolbar>
                <S.SearchBar>
                    <Icon icon="lucide:search" width={14} height={14} />
                    <S.SearchInput
                        type="search"
                        placeholder={searchPlaceholder}
                        value={search}
                        onChange={event => onSearchChange(event.target.value)}
                    />
                    {search && (
                        <S.SearchClear type="button" aria-label="Clear search" onClick={() => onSearchChange('')}>
                            <Icon icon="lucide:x" width={12} height={12} />
                        </S.SearchClear>
                    )}
                </S.SearchBar>
                <FilterDropdown
                    emptyLabel="No results"
                    onSelect={value => onScopeChange(value === '__all__' ? null : value)}
                    options={scopeOptions}
                    panelShadow="0 8px 24px rgba(0, 0, 0, 0.12)"
                    searchPlaceholder="Search scopes..."
                    sections={[{ value: 'team', label: 'Teams' }]}
                    selectedValue={scope ?? '__all__'}
                    triggerIcon={getScopeIcon(scope)}
                    triggerLabel={selectedScopeLabel}
                />
                {trailing}
            </S.Toolbar>
            {hasActiveFilters && (
                <S.ResetBanner
                    type="button"
                    onClick={() => {
                        onSearchChange('');
                        onScopeChange(null);
                    }}
                >
                    <Icon icon="lucide:filter-x" width={14} height={14} />
                    Filtered results, click to reset
                </S.ResetBanner>
            )}
        </S.Container>
    );
}
