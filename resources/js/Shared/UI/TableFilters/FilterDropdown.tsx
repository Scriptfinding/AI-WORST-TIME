import { Fragment, useMemo } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { filterOptions } from './options';
import FilterOption from './FilterOption/FilterOption';
import * as S from './styled';
import type { TableFilterOption } from './types';
import { useFilterDropdown } from './useFilterDropdown';

interface FilterDropdownSection {
    value: string;
    label: string;
}

interface FilterDropdownProps {
    emptyLabel: string;
    iconOnly?: boolean;
    onSelect: (value: string) => void;
    options: TableFilterOption[];
    panelAlign?: 'left' | 'right';
    searchPlaceholder: string;
    selectedValue: string;
    triggerIcon: string;
    triggerLabel: string;
    panelShadow?: string;
    sections?: FilterDropdownSection[];
}

export default function FilterDropdown({
    emptyLabel,
    iconOnly = false,
    onSelect,
    options,
    panelAlign = 'right',
    panelShadow,
    searchPlaceholder,
    sections = [],
    selectedValue,
    triggerIcon,
    triggerLabel,
}: FilterDropdownProps) {
    const dropdown = useFilterDropdown();
    const filteredOptions = useMemo(
        () => filterOptions(options, dropdown.search),
        [dropdown.search, options],
    );
    const defaultOptions = filteredOptions.filter(option => !option.section);

    const selectOption = (value: string) => {
        onSelect(value);
        dropdown.close();
    };

    return (
        <S.DropdownWrapper ref={dropdown.dropdownRef}>
            <S.DropdownTrigger
                type="button"
                $open={dropdown.open}
                $iconOnly={iconOnly}
                aria-label={iconOnly ? triggerLabel : undefined}
                title={iconOnly ? triggerLabel : undefined}
                onClick={() => dropdown.setOpen(open => !open)}
            >
                <Icon icon={triggerIcon} width={14} />
                {!iconOnly && triggerLabel}
                {!iconOnly && <Icon icon="lucide:chevron-down" width={14} />}
            </S.DropdownTrigger>
            {dropdown.open && (
                <S.DropdownPanel $shadow={panelShadow} $align={panelAlign}>
                    <S.DropdownSearchWrapper>
                        <S.DropdownSearchInput
                            ref={dropdown.searchInputRef}
                            value={dropdown.search}
                            onChange={event => dropdown.setSearch(event.target.value)}
                            placeholder={searchPlaceholder}
                        />
                    </S.DropdownSearchWrapper>
                    <S.DropdownList>
                        {filteredOptions.length === 0 ? (
                            <S.DropdownEmpty>{emptyLabel}</S.DropdownEmpty>
                        ) : (
                            <>
                                {defaultOptions.map(option => (
                                    <FilterOption
                                        key={option.value}
                                        active={selectedValue === option.value}
                                        onSelect={selectOption}
                                        option={option}
                                    />
                                ))}
                                {sections.map(section => {
                                    const sectionOptions = filteredOptions.filter(
                                        option => option.section === section.value,
                                    );
                                    if (sectionOptions.length === 0) return null;

                                    return (
                                        <Fragment key={section.value}>
                                            <S.DropdownSeparator />
                                            <S.DropdownSectionLabel>{section.label}</S.DropdownSectionLabel>
                                            {sectionOptions.map(option => (
                                                <FilterOption
                                                    key={option.value}
                                                    active={selectedValue === option.value}
                                                    onSelect={selectOption}
                                                    option={option}
                                                />
                                            ))}
                                        </Fragment>
                                    );
                                })}
                            </>
                        )}
                    </S.DropdownList>
                </S.DropdownPanel>
            )}
        </S.DropdownWrapper>
    );
}
