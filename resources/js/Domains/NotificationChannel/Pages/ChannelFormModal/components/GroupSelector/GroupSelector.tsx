import { useRef, useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { useSearchablePopover } from '@/Shared/Hooks/useSearchablePopover';
import * as S from './styled';

interface Props {
    groups: string[];
    value: string;
    onChange: (group: string) => void;
}

export default function GroupSelector({ groups, value, onChange }: Props) {
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

    const selectGroup = (group: string) => {
        onChange(group);
        setOpen(false);
        setSearch('');
    };
    const filteredGroups = groups.filter(group =>
        !search || group.toLowerCase().includes(search.toLowerCase()),
    );
    const canCreate = search.trim()
        && !groups.some(group => group.toLowerCase() === search.trim().toLowerCase());

    return (
        <S.Wrapper ref={wrapperRef}>
            <S.Label>Group (Optional)</S.Label>
            <S.Trigger
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
                    <S.Clear
                        onClick={event => {
                            event.stopPropagation();
                            onChange('');
                            setOpen(false);
                        }}
                    >
                        <Icon icon="lucide:x" width={14} />
                    </S.Clear>
                ) : (
                    <Icon icon="lucide:chevron-down" width={14} />
                )}
            </S.Trigger>
            {open && (
                <S.Panel>
                    <S.SearchWrapper>
                        <S.SearchInput
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
                    </S.SearchWrapper>
                    <S.List>
                        {filteredGroups.map(group => (
                            <S.Item
                                key={group}
                                type="button"
                                $active={value === group}
                                onClick={() => selectGroup(group)}
                            >
                                <Icon icon="lucide:folder" width={14} />
                                {group}
                            </S.Item>
                        ))}
                        {canCreate && (
                            <S.Create type="button" onClick={() => selectGroup(search.trim())}>
                                <Icon icon="lucide:plus" width={14} />
                                Create "{search.trim()}"
                            </S.Create>
                        )}
                        {!search && groups.length === 0 && (
                            <S.Empty>Type to create a group</S.Empty>
                        )}
                    </S.List>
                </S.Panel>
            )}
        </S.Wrapper>
    );
}
