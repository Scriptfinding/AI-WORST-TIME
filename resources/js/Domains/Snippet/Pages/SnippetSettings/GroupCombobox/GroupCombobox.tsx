import { Icon } from '@/Shared/UI/Icon/Icon';
import { useMemo, useRef, useState } from 'react';
import type { Snippet } from '@/Domains/Snippet/types';
import { useSearchablePopover } from '@/Shared/Hooks/useSearchablePopover';
import * as S from './styled';

interface Props {
    value: string;
    snippets: Snippet[];
    snippetGroups: string[];
    disabled: boolean;
    onChange: (value: string) => void;
}

export default function GroupCombobox({ value, snippets, snippetGroups, disabled, onChange }: Props) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const groups = useMemo(() => {
        const snippetGroupNames = snippets.map(snippet => snippet.group).filter(Boolean) as string[];
        return [...new Set([...snippetGroups, ...snippetGroupNames])].sort();
    }, [snippets, snippetGroups]);

    useSearchablePopover({
        open,
        onDismiss: () => setOpen(false),
        reset: () => setSearch(''),
        focusRef: searchRef,
        containerRefs: [wrapperRef],
        eventType: 'mousedown',
    });

    const filteredGroups = groups.filter(group => !search || group.toLowerCase().includes(search.toLowerCase()));
    const trimmedSearch = search.trim();
    const exactMatch = groups.some(group => group.toLowerCase() === trimmedSearch.toLowerCase());
    const selectGroup = (group: string) => {
        onChange(group);
        setOpen(false);
        setSearch('');
    };

    return (
        <S.Wrapper ref={wrapperRef}>
            <S.Label>Group (Optional)</S.Label>
            <S.Trigger
                type="button"
                $open={open}
                $hasValue={Boolean(value)}
                onClick={() => {
                    if (!disabled) {
                        setOpen(current => !current);
                        setSearch('');
                    }
                }}
                disabled={disabled}
            >
                <Icon icon="lucide:folder" width={14} />
                {value || 'Group name'}
                {value ? (
                    <S.Clear onClick={event => {
                        event.stopPropagation();
                        onChange('');
                        setOpen(false);
                    }}>
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
                                if (event.key === 'Enter' && trimmedSearch) {
                                    event.preventDefault();
                                    selectGroup(trimmedSearch);
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
                        {trimmedSearch && !exactMatch && (
                            <S.Create type="button" onClick={() => selectGroup(trimmedSearch)}>
                                <Icon icon="lucide:plus" width={14} />
                                Create "{trimmedSearch}"
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
