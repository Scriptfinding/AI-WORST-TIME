import { Icon } from '@/Shared/UI/Icon/Icon';
import {
    HelpBody,
    HelpCategoryPageButton,
    HelpCategoryPageIcon,
    HelpCategoryRail,
    HelpHeader,
    HelpPanel,
    HelpTitle,
    HelpToolbar,
} from '@/Shared/CodeEditor/shared/help-toolbox.styled';
import {
    HelpSearchBar,
    HelpSearchClear,
    HelpSearchInput,
} from '@/Shared/CodeEditor/shared/inputs.styled';
import { ToolbarBadge } from '@/Shared/CodeEditor/shared/toolbar.styled';
import { HELP_CATEGORY_PAGES } from '@/Domains/Flow/Pages/FlowEditor/categories';
import type { HelpEntryDef } from '@/Domains/Flow/Pages/FlowEditor/types';
import { CatalogueList } from '@/Domains/Flow/Pages/FlowEditor/Panes/CodeEditorPane/components/CatalogueList/CatalogueList';

interface ToolboxPanelProps {
    search: string;
    activeCategoryKey: string;
    activeIndex: number;
    entries: HelpEntryDef[];
    entryRefs: React.MutableRefObject<Array<HTMLButtonElement | null>>;
    onSearchChange: (search: string) => void;
    onSearchKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
    onCategoryChange: (key: string) => void;
    onActiveIndexChange: (index: number) => void;
    onInsert: (entry: HelpEntryDef) => void;
    onEvaluate: (entry: HelpEntryDef) => void;
    onClose: () => void;
}

export function ToolboxPanel({
    search,
    activeCategoryKey,
    activeIndex,
    entries,
    entryRefs,
    onSearchChange,
    onSearchKeyDown,
    onCategoryChange,
    onActiveIndexChange,
    onInsert,
    onEvaluate,
    onClose,
}: ToolboxPanelProps) {
    return (
        <HelpPanel data-code-help-panel>
            <HelpHeader>
                <HelpTitle>
                    <strong>Code Toolbox</strong>
                    <span>Browse helpers by workflow step</span>
                </HelpTitle>
                <ToolbarBadge onClick={onClose} title="Close Help">
                    <Icon icon="lucide:x" />
                </ToolbarBadge>
            </HelpHeader>
            <HelpToolbar>
                <HelpSearchBar>
                    <Icon icon="lucide:search" />
                    <HelpSearchInput
                        placeholder="Search functions..."
                        value={search}
                        onChange={event => onSearchChange(event.target.value)}
                        onKeyDown={onSearchKeyDown}
                        autoFocus
                    />
                    {search && (
                        <HelpSearchClear onClick={() => onSearchChange('')}>
                            <Icon icon="lucide:x" />
                        </HelpSearchClear>
                    )}
                </HelpSearchBar>
            </HelpToolbar>
            <HelpBody>
                <HelpCategoryRail>
                    {HELP_CATEGORY_PAGES.map(category => {
                        const active = !search.trim() && activeCategoryKey === category.key;

                        return (
                            <HelpCategoryPageButton
                                key={category.key}
                                type="button"
                                $active={active}
                                $color={category.color}
                                onClick={() => {
                                    onCategoryChange(category.key);
                                    onSearchChange('');
                                }}
                            >
                                <HelpCategoryPageIcon $active={active} $color={category.color}>
                                    <Icon icon={category.icon} width={14} height={14} />
                                </HelpCategoryPageIcon>
                                <span>{category.label}</span>
                            </HelpCategoryPageButton>
                        );
                    })}
                </HelpCategoryRail>
                <CatalogueList
                    entries={entries}
                    activeIndex={activeIndex}
                    entryRefs={entryRefs}
                    onActiveIndexChange={onActiveIndexChange}
                    onInsert={onInsert}
                    onEvaluate={onEvaluate}
                />
            </HelpBody>
        </HelpPanel>
    );
}
