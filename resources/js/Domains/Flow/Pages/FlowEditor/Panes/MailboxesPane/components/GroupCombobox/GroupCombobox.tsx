import type React from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { DropdownEmpty, DropdownItem, DropdownList, DropdownSearch } from '@/Domains/Flow/Pages/FlowEditor/Panes/MailboxesPane/components/shared.styled';
import * as S from './styled';

interface GroupComboboxProps {
    value: string;
    search: string;
    open: boolean;
    groups: string[];
    exactMatch: boolean;
    wrapperRef: React.Ref<HTMLDivElement>;
    searchRef: React.Ref<HTMLInputElement>;
    onValueChange: (value: string) => void;
    onSearchChange: (value: string) => void;
    onOpenChange: (open: boolean) => void;
}

export default function GroupCombobox({
    value,
    search,
    open,
    groups,
    exactMatch,
    wrapperRef,
    searchRef,
    onValueChange,
    onSearchChange,
    onOpenChange,
}: GroupComboboxProps) {
    const selectGroup = (nextValue: string) => {
        onValueChange(nextValue);
        onOpenChange(false);
        onSearchChange('');
    };

    return (
        <S.GroupComboWrapper ref={wrapperRef}>
            <S.GroupComboLabel>Group (Optional)</S.GroupComboLabel>
            <S.GroupComboTrigger
                type="button"
                $open={open}
                $hasValue={!!value}
                onClick={() => {
                    onOpenChange(!open);
                    onSearchChange('');
                }}
            >
                <Icon icon="lucide:folder" width={14} />
                {value || 'Group name'}
                {value ? (
                    <S.GroupComboClear onClick={event => { event.stopPropagation(); selectGroup(''); }}>
                        <Icon icon="lucide:x" width={14} />
                    </S.GroupComboClear>
                ) : (
                    <Icon icon="lucide:chevron-down" width={14} />
                )}
            </S.GroupComboTrigger>
            {open && (
                <S.GroupComboPanel>
                    <DropdownSearch
                        ref={searchRef}
                        value={search}
                        onChange={event => onSearchChange(event.target.value)}
                        placeholder="Search or create group..."
                        onKeyDown={event => {
                            if (event.key === 'Enter' && search.trim()) {
                                event.preventDefault();
                                selectGroup(search.trim());
                            }
                        }}
                    />
                    <DropdownList>
                        {groups.map(group => (
                            <DropdownItem
                                key={group}
                                $active={value === group}
                                onClick={() => selectGroup(group)}
                            >
                                <Icon icon="lucide:folder" width={14} />
                                {group}
                            </DropdownItem>
                        ))}
                        {search.trim() && !exactMatch && (
                            <S.GroupComboCreate
                                type="button"
                                onClick={() => selectGroup(search.trim())}
                            >
                                <Icon icon="lucide:plus" width={14} />
                                Create "{search.trim()}"
                            </S.GroupComboCreate>
                        )}
                        {!search && groups.length === 0 && (
                            <DropdownEmpty>Type to create a group</DropdownEmpty>
                        )}
                    </DropdownList>
                </S.GroupComboPanel>
            )}
        </S.GroupComboWrapper>
    );
}
