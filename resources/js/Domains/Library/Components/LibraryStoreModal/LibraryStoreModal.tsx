import React from 'react';
import Modal from '@/Shared/UI/Modal/Modal';
import LibraryStoreListing from './LibraryStoreListing/LibraryStoreListing';
import LibraryBlueprintDetail from './LibraryBlueprintDetail/LibraryBlueprintDetail';
import LibraryUseItemModal from './LibraryUseItemModal/LibraryUseItemModal';
import { useLibraryStoreItems } from './useLibraryStoreItems';
import { useLibraryStoreMutations } from './useLibraryStoreMutations';
import { useLibraryStoreSelection } from './useLibraryStoreSelection';
import type { LibraryTeamOption } from './types';

export {
    closeLibraryStoreQuery,
    openLibraryStoreQuery,
    shouldOpenLibraryStoreFromQuery,
} from './utils';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    teams?: LibraryTeamOption[];
}

export default function LibraryStoreModal({ isOpen, onClose, teams = [] }: Props) {
    const store = useLibraryStoreItems(isOpen);
    const selection = useLibraryStoreSelection(isOpen, store.items, onClose);
    const mutations = useLibraryStoreMutations({
        pendingUse: selection.pendingUse,
        setPendingUse: selection.setPendingUse,
        setItems: store.setItems,
        setError: store.setError,
        loadItems: store.loadItems,
    });

    return (
        <Modal
            isOpen={isOpen}
            onClose={selection.close}
            title="Blueprints"
            caption="Import flows and snippets from public Puppetflow blueprints."
            fullScreen
        >
            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: 20, display: 'flex', flexDirection: 'column' }}>
                {selection.activeItem ? (
                    <LibraryBlueprintDetail
                        item={selection.activeItem}
                        busyKey={mutations.busyKey}
                        error={store.error}
                        onBack={selection.back}
                        onUpvote={mutations.upvote}
                        onUseItem={selection.selectForUse}
                    />
                ) : (
                    <LibraryStoreListing
                        items={store.items}
                        categories={store.categories}
                        categoryCounts={store.categoryCounts}
                        totalCount={store.totalCount}
                        search={store.search}
                        category={store.category}
                        sort={store.sort}
                        page={store.page}
                        perPage={store.perPage}
                        loading={store.loading}
                        error={store.error}
                        refreshing={mutations.refreshing}
                        onSearchChange={store.changeSearch}
                        onCategoryChange={store.changeCategory}
                        onSortChange={store.changeSort}
                        onPageChange={store.setPage}
                        onPerPageChange={store.changePerPage}
                        onRefresh={mutations.refresh}
                        onExplore={selection.explore}
                    />
                )}
            </div>
            {selection.pendingUse && (
                <LibraryUseItemModal
                    isOpen
                    blueprint={selection.pendingUse.item}
                    collection={selection.pendingUse.collection}
                    child={selection.pendingUse.child}
                    teams={teams}
                    submitting={mutations.busyKey === `${selection.pendingUse.item.key}:${selection.pendingUse.collection}:${selection.pendingUse.child.reference}`}
                    error={store.error}
                    onClose={() => selection.setPendingUse(null)}
                    onSubmit={mutations.submitUse}
                />
            )}
        </Modal>
    );
}
