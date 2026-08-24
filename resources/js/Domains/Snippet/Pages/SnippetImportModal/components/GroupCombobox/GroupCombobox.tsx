import React, { useRef, useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { useSearchablePopover } from '@/Shared/Hooks/useSearchablePopover';
import * as S from './styled';

interface Props {
    value: string;
    onChange: (value: string) => void;
    groups: string[];
}

export default function GroupCombobox({ value, onChange, groups }: Props) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    useSearchablePopover({
        open,
        onDismiss: () => setOpen(false),
        reset: () => setSearch(''),
        focusRef: searchRef,
        containerRefs: [wrapperRef],
        eventType: 'mousedown',
    });

    const filteredGroups = groups.filter(group => !search || group.toLowerCase().includes(search.toLowerCase()));
    const exactMatch = groups.some(group => group.toLowerCase() === search.trim().toLowerCase());
    const selectGroup = (group: string) => {
        onChange(group);
        setOpen(false);
        setSearch('');
    };

    return (
        <S.ComboboxWrapper ref={wrapperRef}>
            <S.ComboboxLabel>Group (Optional)</S.ComboboxLabel>
            <S.ComboboxTrigger
                type="button"
                $open={open}
                $hasValue={!!value}
                onClick={() => {
                    setOpen(current => !current);
                    setSearch('');
                }}
            >
                <Icon icon="lucide:folder" width={14} />
                {value || 'Group name'}
                {value ? (
                    <S.ComboboxClear
                        onClick={event => {
                            event.stopPropagation();
                            onChange('');
                            setOpen(false);
                        }}
                    >
                        <Icon icon="lucide:x" width={14} />
                    </S.ComboboxClear>
                ) : (
                    <Icon icon="lucide:chevron-down" width={14} />
                )}
            </S.ComboboxTrigger>
            {open && (
                <S.ComboboxPanel>
                    <S.DropdownSearchWrapper>
                        <S.DropdownSearchInput
                            ref={searchRef}
                            value={search}
                            onChange={event => setSearch(event.target.value)}
                            placeholder="Search or create group..."
                            onKeyDown={event => {
                                if (event.key === 'Enter' && search.trim()) {
                                    event.preventDefault();
                                    selectGroup(search.trim());
                                }
                            }}
                        />
                    </S.DropdownSearchWrapper>
                    <S.DropdownList>
                        {filteredGroups.map(group => (
                            <S.DropdownItem
                                key={group}
                                type="button"
                                $active={value === group}
                                onClick={() => selectGroup(group)}
                            >
                                <Icon icon="lucide:folder" width={14} />
                                {group}
                            </S.DropdownItem>
                        ))}
                        {search.trim() && !exactMatch && (
                            <S.ComboboxCreate type="button" onClick={() => selectGroup(search.trim())}>
                                <Icon icon="lucide:plus" width={14} />
                                Create "{search.trim()}"
                            </S.ComboboxCreate>
                        )}
                        {!search && groups.length === 0 && (
                            <S.DropdownEmpty>Type to create a group</S.DropdownEmpty>
                        )}
                        {search && filteredGroups.length === 0 && exactMatch && (
                            <S.DropdownEmpty>No other groups found</S.DropdownEmpty>
                        )}
                    </S.DropdownList>
                </S.ComboboxPanel>
            )}
        </S.ComboboxWrapper>
    );
}
