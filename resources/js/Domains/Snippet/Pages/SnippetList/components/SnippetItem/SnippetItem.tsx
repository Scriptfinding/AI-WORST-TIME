import type { RefObject } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import AvatarSelectionToggle from '@/Shared/UI/AvatarSelectionToggle/AvatarSelectionToggle';
import type { Snippet } from '@/Domains/Snippet/types';
import * as S from './styled';

interface SnippetItemProps {
    snippet: Snippet;
    active: boolean;
    canDelete: boolean;
    depth?: number;
    menuOpen: boolean;
    menuRef: RefObject<HTMLDivElement | null>;
    selected: boolean;
    onToggleSelected: (snippetId: Id) => void;
    onDelete: (snippet: Snippet) => void;
    onDuplicate: (snippet: Snippet) => void;
    onHideTooltip: () => void;
    onLoad: (snippet: Snippet) => void;
    onShowTooltip: (label: string, target: HTMLElement) => void;
    onToggleMenu: (snippetId: Id) => void;
}

export default function SnippetItem({
    snippet,
    active,
    canDelete,
    depth = 0,
    menuOpen,
    menuRef,
    selected,
    onToggleSelected,
    onDelete,
    onDuplicate,
    onHideTooltip,
    onLoad,
    onShowTooltip,
    onToggleMenu,
}: SnippetItemProps) {
    const scopeIcon = snippet.scope === 'workspace'
        ? 'lucide:building-2'
        : snippet.scope === 'team'
            ? 'lucide:users-round'
            : 'lucide:user';

    return (
        <S.Item
            $active={active}
            $depth={depth}
            onClick={() => onLoad(snippet)}
        >
            {canDelete ? (
                <AvatarSelectionToggle
                    selected={selected}
                    onChange={() => onToggleSelected(snippet.id)}
                    label={`${selected ? 'Deselect' : 'Select'} ${snippet.label}`}
                    size={22}
                >
                    <S.ScopeIcon
                        $inactive={!snippet.is_active}
                        $workspace={snippet.scope === 'workspace'}
                        $team={snippet.scope === 'team'}
                    >
                        <Icon icon={scopeIcon} width={12} />
                    </S.ScopeIcon>
                </AvatarSelectionToggle>
            ) : (
                <S.ScopeIcon
                    $inactive={!snippet.is_active}
                    $workspace={snippet.scope === 'workspace'}
                    $team={snippet.scope === 'team'}
                >
                    <Icon icon={scopeIcon} width={12} />
                </S.ScopeIcon>
            )}
            <S.Content $inactive={!snippet.is_active}>
                <S.Title
                    onMouseEnter={event => onShowTooltip(snippet.label, event.currentTarget)}
                    onMouseLeave={onHideTooltip}
                >
                    <S.Label>{snippet.label}</S.Label>
                </S.Title>
            </S.Content>
            {snippet.library_reference && (
                <S.LibraryBadge title="Imported from library" $inactive={!snippet.is_active}>
                    <Icon icon="lucide:store" width={13} />
                </S.LibraryBadge>
            )}
            <S.OverflowWrapper ref={menuOpen ? menuRef : undefined} onClick={event => event.stopPropagation()}>
                <S.OverflowButton type="button" onClick={() => onToggleMenu(snippet.id)}>
                    <Icon icon="lucide:ellipsis-vertical" width={14} />
                </S.OverflowButton>
                {menuOpen && (
                    <S.OverflowMenu>
                        <S.OverflowMenuItem type="button" onClick={() => onDuplicate(snippet)}>
                            <Icon icon="lucide:copy" width={13} />
                            Duplicate
                        </S.OverflowMenuItem>
                        {canDelete && (
                            <S.OverflowMenuItem $danger type="button" onClick={() => onDelete(snippet)}>
                                <Icon icon="lucide:trash-2" width={13} />
                                Delete
                            </S.OverflowMenuItem>
                        )}
                    </S.OverflowMenu>
                )}
            </S.OverflowWrapper>
        </S.Item>
    );
}
