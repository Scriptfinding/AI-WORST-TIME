import { useRef, useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import type { HelpEntryDef } from '@/Domains/Flow/Pages/FlowEditor/types';
import { useActiveOptionScroll } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/hooks/useActiveOptionScroll';
import { NODE_CATEGORIES } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/constants';
import {
    formatToolboxNodeLabel,
    getNodeCategoryColor,
    getNodeIcon,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/catalog';
import type { PendingConnectionTarget, PendingEdgeInsertion } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import * as S from './styled';

interface NodePickerProps {
    search: string;
    activeCategoryKey: string;
    visibleEntries: HelpEntryDef[];
    pendingConnectionTarget: PendingConnectionTarget | null;
    pendingEdgeInsertion: PendingEdgeInsertion | null;
    onSearchChange: (value: string) => void;
    onSelectCategory: (categoryKey: string) => void;
    onClose: () => void;
    onAddNode: (entry: HelpEntryDef) => void;
}

export default function NodePicker({
    search,
    activeCategoryKey,
    visibleEntries,
    pendingConnectionTarget,
    pendingEdgeInsertion,
    onSearchChange,
    onSelectCategory,
    onClose,
    onAddNode,
}: NodePickerProps) {
    const hasSearch = Boolean(search.trim());
    const [activeIndex, setActiveIndex] = useState(0);
    const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
    useActiveOptionScroll({
        open: true,
        itemsDependency: visibleEntries,
        queryDependency: search,
        activeIndex,
        setActiveIndex,
        optionRefs,
    });

    const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (visibleEntries.length === 0) return;

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex(current => Math.min(visibleEntries.length - 1, current + 1));
            return;
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex(current => Math.max(0, current - 1));
            return;
        }

        if (event.key === 'Enter') {
            event.preventDefault();
            onAddNode(visibleEntries[activeIndex] ?? visibleEntries[0]);
        }
    };

    return (
        <S.NodePicker
            data-node-picker
            onWheel={event => event.stopPropagation()}
            onPointerDown={event => event.stopPropagation()}
            onPointerMove={event => event.stopPropagation()}
            onPointerUp={event => event.stopPropagation()}
        >
            <S.PickerHeader>
                <S.PickerTitle>
                    <strong>
                        {pendingEdgeInsertion
                            ? 'Insert node in connection'
                            : pendingConnectionTarget
                                ? 'Add connected node'
                                : 'Node Toolbox'}
                    </strong>
                    <span>
                        {pendingEdgeInsertion
                            ? 'Pick a node to place it between these two nodes'
                            : pendingConnectionTarget
                                ? 'Pick a node to connect it automatically'
                                : 'Pick a category, then add a block to the canvas'}
                    </span>
                </S.PickerTitle>
                <S.ClosePicker
                    type="button"
                    onClick={onClose}
                    title="Close"
                >
                    <Icon icon="lucide:x" width={16} height={16} />
                </S.ClosePicker>
            </S.PickerHeader>
            <S.SearchWrap>
                <Icon icon="lucide:search" width={14} height={14} />
                <S.SearchInput
                    placeholder="Search nodes..."
                    value={search}
                    onChange={event => onSearchChange(event.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    autoFocus
                />
            </S.SearchWrap>
            <S.PickerBody>
                <S.CategoryRail>
                    {NODE_CATEGORIES.map(category => (
                        <S.CategoryPageButton
                            key={category.key}
                            type="button"
                            $active={!hasSearch && activeCategoryKey === category.key}
                            $color={category.color}
                            onClick={() => onSelectCategory(category.key)}
                        >
                            <S.CategoryPageIcon $active={!hasSearch && activeCategoryKey === category.key} $color={category.color}>
                                <Icon icon={category.icon} width={14} height={14} />
                            </S.CategoryPageIcon>
                            <span>{category.label}</span>
                        </S.CategoryPageButton>
                    ))}
                </S.CategoryRail>
                <S.PickerContent>
                    {visibleEntries.length === 0 ? (
                        <S.EmptySearch>No matching nodes.</S.EmptySearch>
                    ) : (
                        visibleEntries.map((entry, index) => {
                            const entryColor = getNodeCategoryColor(entry);
                            const entryDescription = [entry.nodalDesc, entry.desc]
                                .find(description => description?.trim())
                                ?.trim();

                            return (
                                <S.NodeOptionRow
                                    key={entry.signature}
                                    onMouseEnter={() => setActiveIndex(index)}
                                >
                                    <S.NodeOption
                                        ref={element => {
                                            optionRefs.current[index] = element;
                                        }}
                                        type="button"
                                        $active={activeIndex === index}
                                        $color={entryColor}
                                        $hasEditAction={Boolean(entry.editUrl)}
                                        $hasDescription={Boolean(entryDescription)}
                                        onClick={() => onAddNode(entry)}
                                    >
                                        <S.NodeOptionIcon $color={entryColor}>
                                            <Icon icon={getNodeIcon(entry)} width={14} height={14} />
                                        </S.NodeOptionIcon>
                                        <S.NodeOptionContent>
                                            <S.NodeOptionTop>
                                                <strong>{formatToolboxNodeLabel(entry)}</strong>
                                                <small>{entry.category}</small>
                                            </S.NodeOptionTop>
                                            {entryDescription && <span>{entryDescription}</span>}
                                        </S.NodeOptionContent>
                                    </S.NodeOption>
                                    {entry.editUrl && (
                                        <S.NodeOptionEditLink
                                            href={entry.editUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            title={`Open ${formatToolboxNodeLabel(entry)} snippet`}
                                            aria-label={`Open ${formatToolboxNodeLabel(entry)} snippet editor`}
                                        >
                                            <Icon icon="lucide:square-pen" width={13} height={13} />
                                        </S.NodeOptionEditLink>
                                    )}
                                </S.NodeOptionRow>
                            );
                        })
                    )}
                </S.PickerContent>
            </S.PickerBody>
        </S.NodePicker>
    );
}
