import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { useSearchablePopover } from '@/Shared/Hooks/useSearchablePopover';
import type { WorkspaceOption } from '@/Domains/Admin/Pages/Users/UserModals/types';
import * as S from './styled';

interface Props {
    workspaces: WorkspaceOption[];
    selectedIds: Id[];
    onToggle: (id: Id) => void;
    error?: boolean;
}

export default function WorkspacePicker({ workspaces, selectedIds, onToggle, error = false }: Props) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const filtered = useMemo(() => {
        if (!query.trim()) return workspaces;
        const normalizedQuery = query.toLowerCase();
        return workspaces.filter(workspace => workspace.name.toLowerCase().includes(normalizedQuery));
    }, [workspaces, query]);
    const selected = useMemo(
        () => workspaces.filter(workspace => selectedIds.includes(workspace.id)),
        [workspaces, selectedIds],
    );
    const close = useCallback(() => {
        setOpen(false);
        setQuery('');
    }, []);

    useSearchablePopover({
        open,
        onDismiss: () => setOpen(false),
        reset: () => setQuery(''),
        focusRef: searchRef,
        containerRefs: [wrapperRef],
        eventType: 'mousedown',
    });

    return (
        <S.Wrapper ref={wrapperRef} onKeyDown={event => event.key === 'Escape' && close()}>
            <S.Trigger $error={error} aria-invalid={error} onClick={() => setOpen(value => !value)}>
                {selected.length === 0 && <S.Placeholder>Select workspaces...</S.Placeholder>}
                {selected.map(workspace => (
                    <S.Tag key={workspace.id}>
                        {workspace.name}
                        <button type="button" onClick={event => { event.stopPropagation(); onToggle(workspace.id); }}>
                            <Icon icon="lucide:x" width={10} height={10} />
                        </button>
                    </S.Tag>
                ))}
            </S.Trigger>
            {open && (
                <S.Dropdown>
                    <S.Search
                        ref={searchRef}
                        placeholder="Search..."
                        value={query}
                        onChange={event => setQuery(event.target.value)}
                    />
                    <S.List>
                        {filtered.length === 0
                            ? <S.Empty>No workspace found</S.Empty>
                            : filtered.map(workspace => {
                                const checked = selectedIds.includes(workspace.id);
                                return (
                                    <S.Option key={workspace.id} $checked={checked}>
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() => onToggle(workspace.id)}
                                        />
                                        {workspace.name}
                                    </S.Option>
                                );
                            })}
                    </S.List>
                </S.Dropdown>
            )}
        </S.Wrapper>
    );
}
