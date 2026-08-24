import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { useSearchablePopover } from '@/Shared/Hooks/useSearchablePopover';
import * as S from './styled';

interface GroupFieldProps {
    value: string;
    groups: string[];
    isModalOpen: boolean;
    onChange: (group: string) => void;
}

export default function GroupField({ value, groups, isModalOpen, onChange }: GroupFieldProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const filteredGroups = groups.filter(group => !search || group.toLowerCase().includes(search.toLowerCase()));
    const hasExactMatch = groups.some(group => group.toLowerCase() === search.trim().toLowerCase());

    useSearchablePopover({
        open: isOpen,
        onDismiss: () => setIsOpen(false),
        reset: () => setSearch(''),
        focusRef: searchRef,
        containerRefs: [wrapperRef],
        eventType: 'mousedown',
    });

    useEffect(() => {
        if (!isModalOpen) {
            setIsOpen(false);
            setSearch('');
        }
    }, [isModalOpen]);

    const selectGroup = (group: string) => {
        onChange(group);
        setIsOpen(false);
        setSearch('');
    };

    return (
        <S.GroupComboWrapper ref={wrapperRef}>
            <S.GroupComboLabel>Group (Optional)</S.GroupComboLabel>
            <S.GroupComboTrigger
                type="button"
                $open={isOpen}
                $hasValue={!!value}
                onClick={() => {
                    setIsOpen(current => !current);
                    setSearch('');
                }}
            >
                <Icon icon="lucide:folder" width={14} />
                {value || 'Group name'}
                {value ? (
                    <S.GroupComboClear
                        onClick={event => {
                            event.stopPropagation();
                            onChange('');
                            setIsOpen(false);
                        }}
                    >
                        <Icon icon="lucide:x" width={14} />
                    </S.GroupComboClear>
                ) : (
                    <Icon icon="lucide:chevron-down" width={14} />
                )}
            </S.GroupComboTrigger>
            {isOpen && (
                <S.GroupComboPanel>
                    <S.GroupComboSearch
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
                    <S.GroupComboList>
                        {filteredGroups.map(group => (
                            <S.GroupComboItem
                                key={group}
                                $active={value === group}
                                onClick={() => selectGroup(group)}
                            >
                                <Icon icon="lucide:folder" width={14} />
                                {group}
                            </S.GroupComboItem>
                        ))}
                        {search.trim() && !hasExactMatch && (
                            <S.GroupComboCreate type="button" onClick={() => selectGroup(search.trim())}>
                                <Icon icon="lucide:plus" width={14} />
                                Create "{search.trim()}"
                            </S.GroupComboCreate>
                        )}
                        {!search && groups.length === 0 && (
                            <S.GroupComboEmpty>Type to create a group</S.GroupComboEmpty>
                        )}
                    </S.GroupComboList>
                </S.GroupComboPanel>
            )}
        </S.GroupComboWrapper>
    );
}
