import { usePageProps } from '@/App/Hooks/usePageProps';
import type { Snippet } from '@/Domains/Snippet/types';
import * as Layout from '@/Domains/Snippet/Pages/shared.styled';
import GroupedSnippetList from './components/GroupedSnippetList/GroupedSnippetList';
import SnippetFilters from './components/SnippetFilters/SnippetFilters';
import { useSnippetFilters } from './hooks/useSnippetFilters';
import * as S from './styled';

interface Props {
    snippets: Snippet[];
    active: Snippet | null;
    mobileView: string;
    teams: { id: Id; name: string }[];
    isAdmin: boolean;
    currentUserId: Id;
    selectedIds: Set<Id>;
    onToggleSelected: (snippetId: Id) => void;
    onLoadSnippet: (snippet: Snippet) => void;
    onDelete: (snippet: Snippet) => void;
    onDuplicate: (snippet: Snippet) => void;
}

export default function SnippetList({
    snippets,
    active,
    mobileView,
    teams,
    isAdmin,
    currentUserId,
    selectedIds,
    onToggleSelected,
    onLoadSnippet,
    onDelete,
    onDuplicate,
}: Props) {
    const { settings } = usePageProps();
    const filters = useSnippetFilters({
        snippets,
        teams,
        workspaceSharingEnabled: settings?.workspace_sharing_enabled ?? false,
    });

    return (
        <Layout.Panel $width="300px" $mobileHidden={mobileView !== 'list'}>
            <S.PanelContextBar>
                <S.PanelContextText>Library</S.PanelContextText>
                <S.PanelContextMeta>{filters.filteredSnippets.length} / {snippets.length}</S.PanelContextMeta>
            </S.PanelContextBar>

            <SnippetFilters
                hasActiveFilters={filters.hasActiveFilters}
                scope={filters.scope}
                scopeOptions={filters.scopeOptions}
                search={filters.search}
                selectedScopeLabel={filters.selectedScopeLabel}
                showInactive={filters.showInactive}
                onReset={filters.resetFilters}
                onScopeChange={filters.setScope}
                onSearchChange={filters.setSearch}
                onShowInactiveChange={filters.setShowInactive}
            />

            <Layout.PanelBody>
                {filters.filteredSnippets.length === 0 ? (
                    <Layout.EmptyPanel>
                        {snippets.length === 0
                            ? 'No snippets yet.\nCreate one to get started.'
                            : 'No snippets match your filters.'}
                    </Layout.EmptyPanel>
                ) : (
                    <GroupedSnippetList
                        snippets={filters.filteredSnippets}
                        active={active}
                        currentUserId={currentUserId}
                        isAdmin={isAdmin}
                        selectedIds={selectedIds}
                        onToggleSelected={onToggleSelected}
                        onDelete={onDelete}
                        onDuplicate={onDuplicate}
                        onLoad={onLoadSnippet}
                    />
                )}
            </Layout.PanelBody>
        </Layout.Panel>
    );
}
