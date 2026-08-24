import { useMemo } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { filterOptions } from '@/Shared/UI/TableFilters/options';
import type { TableFilterOption } from '@/Shared/UI/TableFilters/types';
import { useFilterDropdown } from '@/Shared/UI/TableFilters/useFilterDropdown';
import * as S from './styled';

interface SnippetFiltersProps {
    hasActiveFilters: boolean;
    scope: string;
    scopeOptions: TableFilterOption[];
    search: string;
    selectedScopeLabel: string;
    showInactive: boolean;
    onReset: () => void;
    onScopeChange: (scope: string) => void;
    onSearchChange: (search: string) => void;
    onShowInactiveChange: (showInactive: boolean) => void;
}

export default function SnippetFilters({
    hasActiveFilters,
    scope,
    scopeOptions,
    search,
    selectedScopeLabel,
    showInactive,
    onReset,
    onScopeChange,
    onSearchChange,
    onShowInactiveChange,
}: SnippetFiltersProps) {
    const dropdown = useFilterDropdown();
    const filteredOptions = useMemo(
        () => filterOptions(scopeOptions, dropdown.search),
        [dropdown.search, scopeOptions],
    );
    const scopeIcon = scope.startsWith('team:')
        ? 'lucide:users-round'
        : scope === 'workspace'
            ? 'lucide:building-2'
            : scope === 'owner'
                ? 'lucide:user'
                : 'lucide:layers';

    const selectScope = (value: string) => {
        onScopeChange(value);
        dropdown.close();
    };

    const resetFilters = () => {
        onReset();
        dropdown.close();
    };

    return (
        <>
            <S.FilterBar>
                <S.ScopeDropdownWrapper ref={dropdown.dropdownRef}>
                    <S.ScopeDropdownTrigger
                        type="button"
                        $open={dropdown.open}
                        onClick={() => dropdown.setOpen(open => !open)}
                        title={selectedScopeLabel}
                    >
                        <Icon icon={scopeIcon} width={11} />
                        {dropdown.open && selectedScopeLabel}
                    </S.ScopeDropdownTrigger>
                    {dropdown.open && (
                        <S.ScopeDropdownPanel>
                            <S.ScopeDropdownSearch
                                ref={dropdown.searchInputRef}
                                value={dropdown.search}
                                onChange={event => dropdown.setSearch(event.target.value)}
                                placeholder="Search scopes..."
                            />
                            <S.ScopeDropdownList>
                                {filteredOptions.length === 0 ? (
                                    <S.ScopeDropdownEmpty>No results</S.ScopeDropdownEmpty>
                                ) : (
                                    <>
                                        {filteredOptions.filter(option => !option.section).map(option => (
                                            <S.ScopeDropdownItem
                                                key={option.value || '__all__'}
                                                type="button"
                                                $active={scope === option.value}
                                                onClick={() => selectScope(option.value)}
                                            >
                                                <Icon icon={option.icon} width={12} />
                                                {option.label}
                                            </S.ScopeDropdownItem>
                                        ))}
                                        {filteredOptions.some(option => option.section === 'team') && (
                                            <>
                                                <S.ScopeDropdownSeparator />
                                                <S.ScopeDropdownSectionLabel>Teams</S.ScopeDropdownSectionLabel>
                                                {filteredOptions.filter(option => option.section === 'team').map(option => (
                                                    <S.ScopeDropdownItem
                                                        key={option.value}
                                                        type="button"
                                                        $active={scope === option.value}
                                                        onClick={() => selectScope(option.value)}
                                                    >
                                                        <Icon icon={option.icon} width={12} />
                                                        {option.label}
                                                    </S.ScopeDropdownItem>
                                                ))}
                                            </>
                                        )}
                                    </>
                                )}
                            </S.ScopeDropdownList>
                        </S.ScopeDropdownPanel>
                    )}
                </S.ScopeDropdownWrapper>
                <S.InactiveToggleButton
                    type="button"
                    $active={showInactive}
                    onClick={() => onShowInactiveChange(!showInactive)}
                    title={showInactive ? 'Hide inactive snippets' : 'Show inactive snippets'}
                >
                    <Icon icon={showInactive ? 'lucide:eye' : 'lucide:eye-off'} width={12} />
                </S.InactiveToggleButton>
                <S.QuickSearch
                    value={search}
                    onChange={event => onSearchChange(event.target.value)}
                    placeholder="Search snippets..."
                />
            </S.FilterBar>
            {hasActiveFilters && (
                <S.FilterResetBanner type="button" onClick={resetFilters}>
                    <Icon icon="lucide:filter-x" width={14} height={14} />
                    Filtered results, click to reset
                </S.FilterResetBanner>
            )}
        </>
    );
}
