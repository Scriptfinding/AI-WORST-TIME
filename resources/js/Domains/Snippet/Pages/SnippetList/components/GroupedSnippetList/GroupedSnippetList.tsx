import React, { useRef, useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { useClickOutside } from '@/Shared/Hooks/useClickOutside';
import type { Snippet } from '@/Domains/Snippet/types';
import TitleTooltipPortal, { useTitleTooltip } from '@/Domains/Snippet/Pages/SnippetList/components/TitleTooltipPortal/TitleTooltipPortal';
import { useSnippetGroups } from '@/Domains/Snippet/Pages/SnippetList/hooks/useSnippetGroups';
import SnippetListItem from './SnippetListItem';
import * as S from './styled';

interface GroupedSnippetListProps {
    snippets: Snippet[];
    active: Snippet | null;
    currentUserId: Id;
    isAdmin: boolean;
    selectedIds: Set<Id>;
    onToggleSelected: (snippetId: Id) => void;
    onDelete: (snippet: Snippet) => void;
    onDuplicate: (snippet: Snippet) => void;
    onLoad: (snippet: Snippet) => void;
}

export default function GroupedSnippetList({
    snippets,
    active,
    currentUserId,
    isAdmin,
    selectedIds,
    onToggleSelected,
    onDelete,
    onDuplicate,
    onLoad,
}: GroupedSnippetListProps) {
    const [menuOpenId, setMenuOpenId] = useState<Id | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const { hideTooltip, showTooltip, tooltip } = useTitleTooltip();
    const {
        collapsedGroups,
        hasGroups,
        isGroupHidden,
        sections,
        toggleGroup,
        ungrouped,
    } = useSnippetGroups(snippets, currentUserId);

    useClickOutside({
        refs: [menuRef],
        onOutside: () => setMenuOpenId(null),
        enabled: menuOpenId !== null,
        eventType: 'mousedown',
    });

    return (
        <>
            {hasGroups ? (
                <>
                    {sections.map(section => {
                        const lastHeader = section.headers[section.headers.length - 1];
                        const itemDepth = lastHeader ? lastHeader.depth + 1 : 0;
                        const hideItems = isGroupHidden(section.groupKey);
                        const visibleHeaders = section.headers.filter(header => {
                            const parentKey = header.key.split('/').slice(0, -1).join('/');
                            return !isGroupHidden(parentKey);
                        });
                        if (hideItems && visibleHeaders.length === 0) return null;

                        return (
                            <React.Fragment key={lastHeader?.key}>
                                {visibleHeaders.map(header => (
                                    <S.GroupLabel
                                        key={header.key}
                                        type="button"
                                        $depth={header.depth}
                                        onClick={() => toggleGroup(header.key)}
                                    >
                                        <Icon
                                            icon={collapsedGroups.has(header.key)
                                                ? 'lucide:chevron-right'
                                                : 'lucide:chevron-down'}
                                            width={11}
                                        />
                                        <Icon icon="lucide:folder" width={10} />
                                        <span>{header.label}</span>
                                        <S.GroupCount>({header.count})</S.GroupCount>
                                    </S.GroupLabel>
                                ))}
                                {!hideItems && section.items.map(snippet => (
                                    <SnippetListItem
                                        key={snippet.id}
                                        snippet={snippet}
                                        active={active?.id === snippet.id}
                                        canDelete={isAdmin || snippet.user_id === currentUserId}
                                        selected={selectedIds.has(snippet.id)}
                                        onToggleSelected={onToggleSelected}
                                        depth={itemDepth}
                                        menuOpen={menuOpenId === snippet.id}
                                        menuRef={menuRef}
                                        onCloseMenu={() => setMenuOpenId(null)}
                                        onDelete={onDelete}
                                        onDuplicate={onDuplicate}
                                        onHideTooltip={hideTooltip}
                                        onLoad={onLoad}
                                        onShowTooltip={showTooltip}
                                        onToggleMenu={snippetId => setMenuOpenId(previous => previous === snippetId ? null : snippetId)}
                                    />
                                ))}
                            </React.Fragment>
                        );
                    })}
                    {ungrouped.map(snippet => (
                        <SnippetListItem
                            key={snippet.id}
                            snippet={snippet}
                            active={active?.id === snippet.id}
                            canDelete={isAdmin || snippet.user_id === currentUserId}
                            selected={selectedIds.has(snippet.id)}
                            onToggleSelected={onToggleSelected}
                            menuOpen={menuOpenId === snippet.id}
                            menuRef={menuRef}
                            onCloseMenu={() => setMenuOpenId(null)}
                            onDelete={onDelete}
                            onDuplicate={onDuplicate}
                            onHideTooltip={hideTooltip}
                            onLoad={onLoad}
                            onShowTooltip={showTooltip}
                            onToggleMenu={snippetId => setMenuOpenId(previous => previous === snippetId ? null : snippetId)}
                        />
                    ))}
                </>
            ) : snippets.map(snippet => (
                <SnippetListItem
                    key={snippet.id}
                    snippet={snippet}
                    active={active?.id === snippet.id}
                    canDelete={isAdmin || snippet.user_id === currentUserId}
                    selected={selectedIds.has(snippet.id)}
                    onToggleSelected={onToggleSelected}
                    menuOpen={menuOpenId === snippet.id}
                    menuRef={menuRef}
                    onCloseMenu={() => setMenuOpenId(null)}
                    onDelete={onDelete}
                    onDuplicate={onDuplicate}
                    onHideTooltip={hideTooltip}
                    onLoad={onLoad}
                    onShowTooltip={showTooltip}
                    onToggleMenu={snippetId => setMenuOpenId(previous => previous === snippetId ? null : snippetId)}
                />
            ))}
            <TitleTooltipPortal tooltip={tooltip} />
        </>
    );
}
