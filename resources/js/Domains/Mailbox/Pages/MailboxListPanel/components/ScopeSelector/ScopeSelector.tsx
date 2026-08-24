import { useMemo } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { filterOptions } from '@/Shared/UI/TableFilters/options';
import type { TableFilterOption } from '@/Shared/UI/TableFilters/types';
import { useFilterDropdown } from '@/Shared/UI/TableFilters/useFilterDropdown';
import * as S from './styled';
import { getScopeIcon, partitionScopeOptions } from './utils';

interface Props {
    options: TableFilterOption[];
    scope: string;
    selectedLabel: string;
    onChange: (scope: string) => void;
}

export default function ScopeSelector({
    options,
    scope,
    selectedLabel,
    onChange,
}: Props) {
    const dropdown = useFilterDropdown();
    const visibleOptions = useMemo(
        () => filterOptions(options, dropdown.search),
        [dropdown.search, options],
    );
    const { defaultOptions, teamOptions } = partitionScopeOptions(visibleOptions);

    const selectScope = (value: string) => {
        onChange(value);
        dropdown.close();
    };

    return (
        <S.Wrapper ref={dropdown.dropdownRef}>
            <S.Trigger
                type="button"
                $open={dropdown.open}
                onClick={() => dropdown.setOpen(open => !open)}
                title={selectedLabel}
            >
                <Icon icon={getScopeIcon(scope)} width={11} />
                {dropdown.open && selectedLabel}
            </S.Trigger>
            {dropdown.open && (
                <S.Panel>
                    <S.Search
                        ref={dropdown.searchInputRef}
                        value={dropdown.search}
                        onChange={event => dropdown.setSearch(event.target.value)}
                        placeholder="Search scopes..."
                    />
                    <S.List>
                        {visibleOptions.length === 0 ? (
                            <S.Empty>No results</S.Empty>
                        ) : (
                            <>
                                {defaultOptions.map(option => (
                                    <S.Item
                                        key={option.value || '__all__'}
                                        type="button"
                                        $active={scope === option.value}
                                        onClick={() => selectScope(option.value)}
                                    >
                                        <Icon icon={option.icon} width={12} />
                                        {option.label}
                                    </S.Item>
                                ))}
                                {teamOptions.length > 0 && (
                                    <>
                                        <S.Separator />
                                        <S.SectionLabel>Teams</S.SectionLabel>
                                        {teamOptions.map(option => (
                                            <S.Item
                                                key={option.value}
                                                type="button"
                                                $active={scope === option.value}
                                                onClick={() => selectScope(option.value)}
                                            >
                                                <Icon icon={option.icon} width={12} />
                                                {option.label}
                                            </S.Item>
                                        ))}
                                    </>
                                )}
                            </>
                        )}
                    </S.List>
                </S.Panel>
            )}
        </S.Wrapper>
    );
}
