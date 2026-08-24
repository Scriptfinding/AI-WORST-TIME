import { useCallback, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import type { Flow } from '@/Domains/Flow/types';
import type { DeletableFolder, Folder, FolderTree, Breadcrumb, TeamTree, UserTree } from '@/Domains/Folder/types';
import type { PaginatedData } from '@/Shared/Types/pagination';
import type { PageProps, User } from '@/App/types';
import ExplorerNavigation from './ExplorerNavigation/ExplorerNavigation';
import ExplorerToolbar from './ExplorerToolbar/ExplorerToolbar';
import ExplorerResults from './ExplorerResults/ExplorerResults';
import BatchDeleteModal from './BatchDeleteModal/BatchDeleteModal';
import VisibilityMoveModal from './VisibilityMoveModal/VisibilityMoveModal';
import * as S from './styled';
import type { DropTarget, ExplorerFilters, PendingMove } from './types';
import { getMovePayload, isSameDropScope, resolveDropScope } from './utils';
import { useExplorerSelection } from './useExplorerSelection';

interface Props {
    flows: PaginatedData<Flow>;
    folders: Folder[];
    currentFolder: Folder | null;
    breadcrumbs: Breadcrumb[];
    personalOwner: Pick<User, 'id' | 'name'>;
    filters: ExplorerFilters;
    workspaceTree: FolderTree[];
    personalTree: FolderTree[];
    userTrees?: UserTree[];
    teamTrees?: TeamTree[];
    onDeleteFolder: (folder: DeletableFolder) => void;
}

export default function ExplorerContent({
    flows,
    folders,
    currentFolder,
    breadcrumbs,
    personalOwner,
    filters,
    workspaceTree,
    personalTree,
    userTrees = [],
    teamTrees = [],
    onDeleteFolder,
}: Props) {
    const { auth } = usePage<PageProps>().props;
    const viewMode = auth.user?.explorer_view_mode ?? 'grid';
    const isWorkspaceView = filters.view === 'workspace';
    const isUsersView = filters.view === 'users';
    const parentFolderId = currentFolder?.parent_id ?? null;
    const showFolders = filters.search_everywhere !== '1';

    const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);
    const allFolderTrees = [
        ...personalTree,
        ...userTrees.flatMap(user => user.tree),
        ...workspaceTree,
        ...teamTrees.flatMap(team => team.tree),
    ];
    const selection = useExplorerSelection({
        flows: flows.data,
        folders,
        folderTrees: allFolderTrees,
        user: auth.user,
    });

    const executeMove = useCallback((flowId: Id, target: DropTarget, changeVisibility: boolean) => {
        router.patch(`/flows/${flowId}/move`, getMovePayload(target, changeVisibility), {
            preserveState: true,
        });
    }, []);

    const handleDrop = useCallback((event: React.DragEvent, targetFolderId: Id | null) => {
        event.preventDefault();
        const type = event.dataTransfer.getData('application/x-drag-type');
        const draggedId = event.dataTransfer.getData('application/x-drag-id');
        if (!type || !draggedId) return;

        if (type === 'folder') {
            if (draggedId !== String(targetFolderId ?? '')) {
                router.patch(`/folders/${draggedId}/move`, { parent_id: targetFolderId }, { preserveState: true });
            }
            return;
        }
        if (type !== 'flow') return;

        const flowVisibility = event.dataTransfer.getData('application/x-drag-visibility');
        const flowTeamId = event.dataTransfer.getData('application/x-drag-team-id');
        const target = resolveDropScope(targetFolderId, isWorkspaceView, breadcrumbs, currentFolder);

        if (isSameDropScope(flowVisibility, flowTeamId, target)) {
            executeMove(draggedId, target, false);
        } else {
            setPendingMove({ flowId: draggedId, target, fromScope: flowVisibility || 'owner' });
        }
    }, [breadcrumbs, currentFolder, executeMove, isWorkspaceView]);

    return (
        <S.Container>
            <ExplorerNavigation
                isWorkspaceView={isWorkspaceView}
                currentFolder={currentFolder}
                breadcrumbs={breadcrumbs}
                personalOwner={personalOwner}
                isOtherOwner={filters.owner_id !== null}
                isUsersView={isUsersView}
                onDrop={handleDrop}
            />
            <ExplorerToolbar
                filters={filters}
                isWorkspaceView={isWorkspaceView}
                viewMode={viewMode}
                selectionActive={selection.selectionActive}
                selectedCount={selection.selectedCount}
                selectableVisibleCount={selection.selectableVisibleCount}
                allVisibleSelected={selection.allVisibleSelected}
                deletingSelected={selection.deletingSelected}
                onClearSelection={selection.clearSelection}
                onDeleteSelected={selection.openDeleteModal}
                onToggleSelectAllVisible={selection.toggleSelectAllVisible}
            />
            <ExplorerResults
                flows={flows}
                folders={folders}
                currentFolder={currentFolder}
                parentFolderId={parentFolderId}
                viewMode={viewMode}
                viewParam={filters.view}
                isWorkspaceView={isWorkspaceView}
                isUsersView={isUsersView}
                userTrees={userTrees}
                ownerId={filters.owner_id}
                showFolders={showFolders}
                searchActive={Boolean(filters.search)}
                workspaceTree={workspaceTree}
                personalTree={personalTree}
                teamTrees={teamTrees}
                selectionActive={selection.selectionActive}
                selectedFlowIds={selection.selectedFlowIds}
                selectedFolderIds={selection.selectedFolderIds}
                onDeleteFolder={onDeleteFolder}
                onToggleFlowSelect={selection.toggleFlowSelection}
                onToggleFolderSelect={selection.toggleFolderSelection}
                onDrop={handleDrop}
            />
            <BatchDeleteModal
                isOpen={selection.deleteModalOpen}
                deleting={selection.deletingSelected}
                selectedCount={selection.selectedCount}
                selectedFlows={selection.selectedFlows}
                selectedFolders={selection.selectedFolders}
                folderTotals={selection.selectedFolderTotals}
                hasNestedItems={selection.hasSelectedFolderWithChildren}
                nestedDeleteConfirmed={selection.confirmNestedDelete}
                onNestedDeleteConfirmedChange={selection.setConfirmNestedDelete}
                onClose={selection.closeDeleteModal}
                onConfirm={selection.confirmDeleteSelected}
            />
            <VisibilityMoveModal
                pendingMove={pendingMove}
                onClose={() => setPendingMove(null)}
                onConfirm={move => {
                    executeMove(move.flowId, move.target, true);
                    setPendingMove(null);
                }}
            />
        </S.Container>
    );
}
