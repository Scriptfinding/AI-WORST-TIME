import React, { useState, useRef } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { useSearchablePopover } from '@/Shared/Hooks/useSearchablePopover';
import * as S from './GroupCombobox.styled';
import * as Shared from './shared.styled';

interface GroupComboboxProps {
    value: string;
    onChange: (value: string) => void;
    groups: string[];
}

export default function GroupCombobox({ value, onChange, groups }: GroupComboboxProps) {
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

    const filtered = groups.filter(g => !search || g.toLowerCase().includes(search.toLowerCase()));
    const exactMatch = groups.some(g => g.toLowerCase() === search.trim().toLowerCase());

    return (
        <Shared.ComboboxWrapper ref={wrapperRef}>
            <Shared.ComboboxLabel>Group (Optional)</Shared.ComboboxLabel>
            <Shared.ComboboxTrigger
                type="button"
                $open={open}
                $hasValue={!!value}
                onClick={() => { setOpen(o => !o); setSearch(''); }}
            >
                <Icon icon="lucide:folder" width={14} />
                {value || 'Group name'}
                {value ? (
                    <S.ComboboxClear onClick={e => { e.stopPropagation(); onChange(''); setOpen(false); }}>
                        <Icon icon="lucide:x" width={14} />
                    </S.ComboboxClear>
                ) : (
                    <Icon icon="lucide:chevron-down" width={14} />
                )}
            </Shared.ComboboxTrigger>
            {open && (
                <Shared.ComboboxPanel>
                    <Shared.DropdownSearchWrapper>
                        <Shared.DropdownSearchInput
                            ref={searchRef}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search or create group..."
                            onKeyDown={e => {
                                if (e.key === 'Enter' && search.trim()) {
                                    e.preventDefault();
                                    onChange(search.trim());
                                    setOpen(false);
                                    setSearch('');
                                }
                            }}
                        />
                    </Shared.DropdownSearchWrapper>
                    <Shared.DropdownList>
                        {filtered.map(g => (
                            <Shared.DropdownItem
                                key={g}
                                type="button"
                                $active={value === g}
                                onClick={() => { onChange(g); setOpen(false); setSearch(''); }}
                            >
                                <Icon icon="lucide:folder" width={14} />
                                {g}
                            </Shared.DropdownItem>
                        ))}
                        {search.trim() && !exactMatch && (
                            <S.ComboboxCreate
                                type="button"
                                onClick={() => { onChange(search.trim()); setOpen(false); setSearch(''); }}
                            >
                                <Icon icon="lucide:plus" width={14} />
                                Create "{search.trim()}"
                            </S.ComboboxCreate>
                        )}
                        {!search && groups.length === 0 && (
                            <Shared.DropdownEmpty>Type to create a group</Shared.DropdownEmpty>
                        )}
                        {search && filtered.length === 0 && exactMatch && (
                            <Shared.DropdownEmpty>No other groups found</Shared.DropdownEmpty>
                        )}
                    </Shared.DropdownList>
                </Shared.ComboboxPanel>
            )}
        </Shared.ComboboxWrapper>
    );
}
