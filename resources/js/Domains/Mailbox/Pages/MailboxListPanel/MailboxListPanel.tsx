import { useCollapsedGroups } from '@/Shared/UI/TableFilters/useCollapsedGroups';
import { useAuth, usePageProps } from '@/App/Hooks/usePageProps';
import type { MailboxItem } from '@/Domains/Mailbox/types';
import { EmptyPanel, Panel, PanelBody } from '@/Domains/Mailbox/Pages/shared.styled';
import MailboxFilterBar from './components/MailboxFilterBar/MailboxFilterBar';
import MailboxSections from './components/MailboxSections/MailboxSections';
import { useMailboxFilters } from './hooks/useMailboxFilters';
import * as S from './styled';

interface Props {
    mailboxes: MailboxItem[];
    activeMailboxId: Id | null;
    teams: { id: Id; name: string }[];
    integrations: { id: string; name: string }[];
    isAdmin: boolean;
    selectedIds: Set<Id>;
    onToggleSelected: (mailboxId: Id) => void;
    onSelectMailbox: (mailbox: MailboxItem) => void;
    onEditMailbox: (mailbox: MailboxItem) => void;
    onDeleteMailbox: (mailbox: MailboxItem) => void;
}

export default function MailboxListPanel({
    mailboxes,
    activeMailboxId,
    teams,
    integrations,
    isAdmin,
    selectedIds,
    onToggleSelected,
    onSelectMailbox,
    onEditMailbox,
    onDeleteMailbox,
}: Props) {
    const { user } = useAuth();
    const { settings } = usePageProps();
    const collapsedGroups = useCollapsedGroups(
        `mailbox-collapsed-groups:${user?.id ?? 'anonymous'}`,
    );
    const filters = useMailboxFilters({
        mailboxes,
        teams,
        workspaceSharingEnabled: settings?.workspace_sharing_enabled ?? false,
    });

    return (
        <Panel $width="340px">
            <S.PanelContextBar>
                <S.PanelContextText>Inboxes</S.PanelContextText>
                <S.PanelContextMeta>
                    {filters.filteredMailboxes.length} / {mailboxes.length}
                </S.PanelContextMeta>
            </S.PanelContextBar>

            <MailboxFilterBar
                hasActiveFilters={filters.hasActiveFilters}
                integration={filters.integration}
                integrations={integrations}
                scope={filters.scope}
                scopeOptions={filters.scopeOptions}
                search={filters.search}
                selectedScopeLabel={filters.selectedScopeLabel}
                sortAscending={filters.sortAscending}
                onIntegrationChange={filters.setIntegration}
                onReset={filters.reset}
                onScopeChange={filters.setScope}
                onSearchChange={filters.setSearch}
                onSortChange={filters.setSortAscending}
            />

            <PanelBody>
                {filters.filteredMailboxes.length === 0 ? (
                    <EmptyPanel>
                        {mailboxes.length === 0
                            ? 'No mailboxes yet.\nCreate one to get started.'
                            : 'No mailboxes match your filters.'}
                    </EmptyPanel>
                ) : (
                    <MailboxSections
                        activeMailboxId={activeMailboxId}
                        collapsedGroups={collapsedGroups.collapsedGroups}
                        isAdmin={isAdmin}
                        selectedIds={selectedIds}
                        onToggleSelected={onToggleSelected}
                        isGroupHidden={collapsedGroups.isGroupHidden}
                        mailboxes={filters.filteredMailboxes}
                        userId={user?.id}
                        onDeleteMailbox={onDeleteMailbox}
                        onEditMailbox={onEditMailbox}
                        onSelectMailbox={onSelectMailbox}
                        onToggleGroup={collapsedGroups.toggleGroup}
                    />
                )}
            </PanelBody>
        </Panel>
    );
}
