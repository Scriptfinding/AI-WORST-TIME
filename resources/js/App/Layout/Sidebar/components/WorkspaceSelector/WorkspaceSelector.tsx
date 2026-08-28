import { useRef, useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { router } from '@inertiajs/react';
import WorkspaceIcon from '@/Domains/Workspace/Components/WorkspaceIcon/WorkspaceIcon';
import type { PageProps } from '@/App/types';
import type { Workspace } from '@/Domains/Workspace/types';
import { useDismissOnPointerDownOutside } from '@/App/Layout/Sidebar/hooks/useDismissOnPointerDownOutside';
import * as S from './styled';

type WorkspaceOption = PageProps['workspaces'][number];

interface WorkspaceSelectorProps {
    workspace: Workspace | null;
    workspaces: WorkspaceOption[];
    currentPath: string;
    collapsed: boolean;
    isAdmin: boolean;
    canCreateWorkspace: boolean;
    canSwitchWorkspace: boolean;
    onCreateWorkspace: () => void;
}

export default function WorkspaceSelector({
    workspace,
    workspaces,
    currentPath,
    collapsed,
    isAdmin,
    canCreateWorkspace,
    canSwitchWorkspace,
    onCreateWorkspace,
}: WorkspaceSelectorProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLDivElement>(null);

    useDismissOnPointerDownOutside(wrapperRef, open, () => {
        setOpen(false);
        setQuery('');
        setHighlightedIndex(-1);
    });

    const normalizedQuery = query.trim().toLowerCase();
    const filteredWorkspaces = normalizedQuery
        ? workspaces.filter(item => item.name.toLowerCase().includes(normalizedQuery))
        : workspaces;

    const selectWorkspace = (item: WorkspaceOption) => {
        router.post(
            `/workspace/${item.id}/switch`,
            { redirect: `${currentPath}${window.location.search}` },
            { onSuccess: () => window.location.reload() },
        );
        setOpen(false);
        setQuery('');
        setHighlightedIndex(-1);
    };

    const moveHighlight = (direction: 1 | -1) => {
        if (filteredWorkspaces.length === 0) return;

        setHighlightedIndex(current => {
            const next =
                current === -1
                    ? direction === 1
                        ? 0
                        : filteredWorkspaces.length - 1
                    : (current + direction + filteredWorkspaces.length) % filteredWorkspaces.length;

            requestAnimationFrame(() => {
                const dropdown = dropdownRef.current;
                const item = dropdown?.querySelector<HTMLElement>(
                    `[data-workspace-index="${next}"]`,
                );
                if (!dropdown || !item) return;

                const dropdownRect = dropdown.getBoundingClientRect();
                const itemRect = item.getBoundingClientRect();
                const searchRect = searchRef.current?.getBoundingClientRect();
                const visibleTop = searchRect
                    ? Math.max(dropdownRect.top + 6, searchRect.bottom + 4)
                    : dropdownRect.top + 6;
                const visibleBottom = dropdownRect.bottom - 6;

                if (itemRect.top < visibleTop) {
                    dropdown.scrollTop -= visibleTop - itemRect.top;
                } else if (itemRect.bottom > visibleBottom) {
                    dropdown.scrollTop += itemRect.bottom - visibleBottom;
                }
            });

            return next;
        });
    };

    return (
        <S.Wrapper ref={wrapperRef} $collapsed={collapsed}>
            <S.Select
                onClick={
                    canSwitchWorkspace
                        ? () => {
                              setOpen(current => !current);
                              setQuery('');
                              setHighlightedIndex(-1);
                          }
                        : undefined
                }
                style={canSwitchWorkspace ? undefined : { cursor: 'default' }}
            >
                {workspace && <WorkspaceIcon workspace={workspace} size={22} />}
                <S.Name>{workspace?.name || 'Select workspace'}</S.Name>
                {canSwitchWorkspace && <Icon icon="lucide:chevron-down" width={12} height={12} />}
            </S.Select>

            {open && (
                <S.Dropdown ref={dropdownRef}>
                    {isAdmin && workspaces.length > 3 && (
                        <S.DropdownTitle>All workspaces ({workspaces.length})</S.DropdownTitle>
                    )}
                    {workspaces.length > 3 && (
                        <S.SearchWrapper ref={searchRef}>
                            <S.SearchInput
                                autoFocus
                                type="search"
                                value={query}
                                onChange={event => {
                                    setQuery(event.target.value);
                                    setHighlightedIndex(-1);
                                }}
                                onKeyDown={event => {
                                    switch (event.key) {
                                        case 'ArrowDown':
                                            event.preventDefault();
                                            moveHighlight(1);
                                            break;
                                        case 'ArrowUp':
                                            event.preventDefault();
                                            moveHighlight(-1);
                                            break;
                                        case 'Enter':
                                            if (highlightedIndex === -1) return;
                                            event.preventDefault();
                                            selectWorkspace(filteredWorkspaces[highlightedIndex]);
                                            break;
                                        case 'Escape':
                                            event.preventDefault();
                                            event.stopPropagation();

                                            if (query) {
                                                setQuery('');
                                                setHighlightedIndex(-1);
                                            } else {
                                                setOpen(false);
                                            }
                                            break;
                                    }
                                }}
                                placeholder="Search workspaces..."
                            />
                        </S.SearchWrapper>
                    )}
                    {filteredWorkspaces.length === 0 ? (
                        <S.EmptyState>No workspaces match your search</S.EmptyState>
                    ) : (
                        filteredWorkspaces.map((item, index) => (
                            <S.Item
                                key={item.id}
                                data-workspace-index={index}
                                $active={item.id === workspace?.id}
                                $highlighted={index === highlightedIndex}
                                onMouseEnter={() => setHighlightedIndex(index)}
                                onClick={() => selectWorkspace(item)}
                            >
                                <WorkspaceIcon workspace={item} size={20} />
                                <S.ItemLabel>{item.name}</S.ItemLabel>
                            </S.Item>
                        ))
                    )}
                    {canCreateWorkspace && (
                        <S.Item
                            onClick={() => {
                                setOpen(false);
                                setQuery('');
                                setHighlightedIndex(-1);
                                onCreateWorkspace();
                            }}
                        >
                            <Icon icon="lucide:plus" />
                            <S.ItemLabel>New workspace</S.ItemLabel>
                        </S.Item>
                    )}
                </S.Dropdown>
            )}
        </S.Wrapper>
    );
}
