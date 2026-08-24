import React, { useMemo, useRef, useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { useSearchablePopover } from '@/Shared/Hooks/useSearchablePopover';
import type { RunUser } from '@/Domains/Flow/Pages/Runs/types';
import * as S from './styled';

interface Props {
    runUsers: RunUser[];
    selectedRunUserId: Id;
    onChange: (value: string) => void;
}

const RunUserFilter = ({ runUsers, selectedRunUserId, onChange }: Props) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const selectedRunUser = runUsers.find(user => user.id === selectedRunUserId);
    const filteredRunUsers = useMemo(() => {
        const query = search.trim().toLowerCase();
        return query ? runUsers.filter(user => user.name.toLowerCase().includes(query)) : runUsers;
    }, [runUsers, search]);

    useSearchablePopover({
        open,
        onDismiss: () => setOpen(false),
        reset: () => setSearch(''),
        focusRef: searchRef,
        containerRefs: [dropdownRef],
        eventType: 'mousedown',
    });

    const selectRunUser = (value: string) => {
        onChange(value);
        setOpen(false);
        setSearch('');
    };

    return (
        <S.FilterBlock>
            <S.FieldLabel>Run by</S.FieldLabel>
            <S.RunUserDropdown ref={dropdownRef}>
                <S.RunUserDropdownTrigger
                    type="button"
                    $open={open}
                    $hasValue={!!selectedRunUserId}
                    onClick={() => {
                        setOpen(previous => !previous);
                        setSearch('');
                    }}
                >
                    <span>{selectedRunUser ? selectedRunUser.name : 'All users'}</span>
                    <Icon icon={open ? 'lucide:chevron-up' : 'lucide:chevron-down'} width={14} height={14} />
                </S.RunUserDropdownTrigger>
                {open && (
                    <S.RunUserDropdownPanel>
                        <S.RunUserDropdownSearch
                            ref={searchRef}
                            value={search}
                            onChange={event => setSearch(event.target.value)}
                            placeholder="Search user..."
                        />
                        <S.RunUserDropdownList>
                            <S.RunUserDropdownItem
                                type="button"
                                $active={selectedRunUserId === ''}
                                onClick={() => selectRunUser('')}
                            >
                                All users
                            </S.RunUserDropdownItem>
                            {filteredRunUsers.length > 0 ? filteredRunUsers.map(user => (
                                <S.RunUserDropdownItem
                                    key={user.id}
                                    type="button"
                                    $active={selectedRunUserId === user.id}
                                    onClick={() => selectRunUser(user.id)}
                                >
                                    {user.name}
                                </S.RunUserDropdownItem>
                            )) : <S.RunUserDropdownEmpty>No user found</S.RunUserDropdownEmpty>}
                        </S.RunUserDropdownList>
                    </S.RunUserDropdownPanel>
                )}
            </S.RunUserDropdown>
        </S.FilterBlock>
    );
};

export default RunUserFilter;
