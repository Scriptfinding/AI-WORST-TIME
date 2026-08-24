import React, { useEffect, useRef, useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { useSearchablePopover } from '@/Shared/Hooks/useSearchablePopover';
import { useUserPickerOptions, type PickerUser } from './hooks/useUserPickerOptions';
import * as S from './styled';

export type { PickerUser } from './hooks/useUserPickerOptions';

interface UserPickerProps {
    label?: string;
    value: Id | null;
    onChange: (userId: Id | null) => void;
    onSelect?: (user: PickerUser | null) => void;
    placeholder?: string;
    disabled?: boolean;
    clearable?: boolean;
    fetchUrl?: string;
}

export default function UserPicker({ label, value, onChange, onSelect, placeholder = 'Select a user…', disabled, clearable = true, fetchUrl = '/workspace/users-search' }: UserPickerProps) {
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const {
        search,
        setSearch,
        users,
        loading,
        refresh,
        selectedUser,
        setSelectedUser,
    } = useUserPickerOptions(open, value, fetchUrl);

    useSearchablePopover({
        open,
        onDismiss: () => setOpen(false),
        reset: () => setSearch(''),
        focusRef: searchRef,
        containerRefs: [wrapperRef],
        eventType: 'mousedown',
    });

    useEffect(() => {
        if (disabled) setOpen(false);
    }, [disabled]);

    const handleSelect = (user: PickerUser) => {
        setSelectedUser(user);
        onChange(user.id);
        onSelect?.(user);
        setOpen(false);
        setSearch('');
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedUser(null);
        onChange(null);
        onSelect?.(null);
    };

    return (
        <S.Wrapper ref={wrapperRef}>
            {label && <S.Label>{label}</S.Label>}
            <S.Trigger
                $open={open}
                $disabled={disabled}
            >
                <S.TriggerButton
                    type="button"
                    disabled={disabled}
                    onClick={() => setOpen(o => !o)}
                >
                    <S.TriggerContent>
                        {selectedUser ? (
                            <>
                                <Icon icon="lucide:user" width={14} />
                                {selectedUser.name}
                            </>
                        ) : (
                            <S.Placeholder>{placeholder}</S.Placeholder>
                        )}
                    </S.TriggerContent>
                </S.TriggerButton>
                {clearable && selectedUser && (
                    <S.ClearBtn type="button" disabled={disabled} onClick={handleClear} title="Clear">
                        <Icon icon="lucide:x" width={14} />
                    </S.ClearBtn>
                )}
                <Icon icon="lucide:chevron-down" width={14} />
            </S.Trigger>
            {open && (
                <S.Dropdown>
                    <S.DropdownHeader>
                        <S.Search
                            ref={searchRef}
                            value={search}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                            placeholder="Search by name or email…"
                        />
                        <S.RefreshButton
                            type="button"
                            title="Refresh users"
                            aria-label="Refresh users"
                            disabled={loading}
                            $loading={loading}
                            onMouseDown={event => event.preventDefault()}
                            onClick={() => void refresh()}
                        >
                            <Icon icon="lucide:refresh-cw" width={13} height={13} />
                        </S.RefreshButton>
                    </S.DropdownHeader>
                    {loading ? (
                        <S.Loader>
                            <Icon icon="lucide:loader-circle" width={16} height={16} />
                        </S.Loader>
                    ) : (
                        <S.List>
                            {users.length === 0 ? (
                                <S.Empty>No users found</S.Empty>
                            ) : users.map(u => (
                                <S.Item
                                    key={u.id}
                                    $active={u.id === value}
                                    onClick={() => handleSelect(u)}
                                >
                                    <Icon icon="lucide:user" width={14} />
                                    {u.name}
                                    <S.ItemEmail>{u.email}</S.ItemEmail>
                                </S.Item>
                            ))}
                        </S.List>
                    )}
                </S.Dropdown>
            )}
        </S.Wrapper>
    );
}
