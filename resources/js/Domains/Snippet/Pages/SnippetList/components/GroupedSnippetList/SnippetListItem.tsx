import type { RefObject } from 'react';
import type { Snippet } from '@/Domains/Snippet/types';
import SnippetItem from '@/Domains/Snippet/Pages/SnippetList/components/SnippetItem/SnippetItem';

interface Props {
    active: boolean;
    canDelete: boolean;
    depth?: number;
    menuOpen: boolean;
    menuRef: RefObject<HTMLDivElement | null>;
    selected: boolean;
    onToggleSelected: (snippetId: Id) => void;
    onCloseMenu: () => void;
    onDelete: (snippet: Snippet) => void;
    onDuplicate: (snippet: Snippet) => void;
    onHideTooltip: () => void;
    onLoad: (snippet: Snippet) => void;
    onShowTooltip: (label: string, target: HTMLElement) => void;
    onToggleMenu: (snippetId: Id) => void;
    snippet: Snippet;
}

export default function SnippetListItem({
    onCloseMenu,
    onDelete,
    onDuplicate,
    ...props
}: Props) {
    return (
        <SnippetItem
            {...props}
            onDelete={snippet => {
                onCloseMenu();
                onDelete(snippet);
            }}
            onDuplicate={snippet => {
                onCloseMenu();
                onDuplicate(snippet);
            }}
        />
    );
}
