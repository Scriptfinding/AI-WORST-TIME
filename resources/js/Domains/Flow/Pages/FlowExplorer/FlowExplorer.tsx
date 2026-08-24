import React, { useState, useCallback, useMemo, useRef } from 'react';
import { router } from '@inertiajs/react';
import AppLayout from '@/App/Layout/AppLayout/AppLayout';
import type { User } from '@/App/types';
import FolderTreeSidebar from '@/Domains/Folder/Components/FolderTreeSidebar/FolderTreeSidebar';
import VisibilityModal from '@/Domains/Flow/Components/VisibilityModal/VisibilityModal';
import Button from '@/Shared/UI/Button/Button';
import LibraryStoreModal, { openLibraryStoreQuery, shouldOpenLibraryStoreFromQuery } from '@/Domains/Library/Components/LibraryStoreModal/LibraryStoreModal';
import type { Flow } from '@/Domains/Flow/types';
import type { DeletableFolder, Folder, FolderTree, Breadcrumb, TeamTree, UserTree, TreeFlow } from '@/Domains/Folder/types';
import type { PaginatedData } from '@/Shared/Types/pagination';
import FlowImportModal from '@/Domains/Flow/Pages/FlowImportModal/FlowImportModal';
import { useUrlSyncedModal } from '@/Shared/Hooks/useUrlSyncedModal';
import ExplorerContent from './ExplorerContent/ExplorerContent';
import ExplorerModals from './ExplorerModals/ExplorerModals';
import type { ExplorerFilters } from './ExplorerContent/types';
import { Icon } from '@/Shared/UI/Icon/Icon';
import * as S from './styled';

interface Props {
    flows: PaginatedData<Flow>;
    folders: Folder[];
    currentFolder: Folder | null;
    breadcrumbs: Breadcrumb[];
    folderTree: FolderTree[];
    userTrees?: UserTree[];
    workspaceTree: FolderTree[];
    teamTrees?: TeamTree[];
    rootFlows: TreeFlow[];
    workspaceRootFlows: TreeFlow[];
    filters: ExplorerFilters;
    personalOwner: Pick<User, 'id' | 'name'>;
}

type VisibilityFlow = Pick<Flow, 'id' | 'name' | 'visibility' | 'folder_id' | 'workspace_folder_id' | 'owner_id' | 'team_id' | 'owner_workspace_role'>;

const SIDEBAR_MIN_WIDTH = 220;
const SIDEBAR_MAX_WIDTH = 520;
const SIDEBAR_DEFAULT_WIDTH = 260;
const SIDEBAR_STORAGE_KEY = 'flow-explorer-sidebar-width';

function flattenTreeFlows(trees: FolderTree[]): TreeFlow[] {
    return trees.flatMap(folder => [
        ...folder.flows,
        ...flattenTreeFlows(folder.children),
    ]);
}

export default function FlowExplorer({ flows, folders, currentFolder, breadcrumbs, folderTree, userTrees = [], workspaceTree, teamTrees = [], rootFlows, workspaceRootFlows, filters, personalOwner }: Props) {
    const [showNewFolder, setShowNewFolder] = useState(false);
    const [folderToDelete, setFolderToDelete] = useState<DeletableFolder | null>(null);
    const sidebarFlows = useMemo<VisibilityFlow[]>(() => [
        ...rootFlows,
        ...workspaceRootFlows,
        ...flattenTreeFlows(folderTree),
        ...flattenTreeFlows(workspaceTree),
        ...teamTrees.flatMap(team => [...team.rootFlows, ...flattenTreeFlows(team.tree)]),
        ...userTrees.flatMap(userTree => [...userTree.rootFlows, ...flattenTreeFlows(userTree.tree)]),
    ], [folderTree, rootFlows, teamTrees, userTrees, workspaceRootFlows, workspaceTree]);
    const {
        selectedItem: visibilityFlow,
        openModal: openVisibilityFlow,
        closeModal: closeVisibilityFlow,
    } = useUrlSyncedModal(sidebarFlows, 'edit-sidebar-flow-visibility');
    const [savingVisibility, setSavingVisibility] = useState(false);
    const [showLibraryStore, setShowLibraryStore] = useState(() => shouldOpenLibraryStoreFromQuery());
    const [showImportModal, setShowImportModal] = useState(false);
    const [sidebarWidth, setSidebarWidth] = useState(() => {
        const stored = Number(localStorage.getItem(SIDEBAR_STORAGE_KEY));
        return Number.isFinite(stored) && stored >= SIDEBAR_MIN_WIDTH
            ? Math.min(SIDEBAR_MAX_WIDTH, stored)
            : SIDEBAR_DEFAULT_WIDTH;
    });
    const explorerLayoutRef = useRef<HTMLDivElement>(null);
    const sidebarResizingRef = useRef(false);

    const handleVisibilityOpen = useCallback((flow: VisibilityFlow) => {
        openVisibilityFlow(flow);
    }, [openVisibilityFlow]);

    const handleLibraryStoreOpen = useCallback(() => {
        openLibraryStoreQuery();
        setShowLibraryStore(true);
    }, []);

    const handleSidebarResizeStart = useCallback((event: React.MouseEvent) => {
        event.preventDefault();
        sidebarResizingRef.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';

        const handleMove = (moveEvent: MouseEvent) => {
            if (!sidebarResizingRef.current || !explorerLayoutRef.current) return;

            const rect = explorerLayoutRef.current.getBoundingClientRect();
            const maxWidth = Math.max(SIDEBAR_MIN_WIDTH, Math.min(SIDEBAR_MAX_WIDTH, rect.width - 420));
            const nextWidth = Math.max(SIDEBAR_MIN_WIDTH, Math.min(maxWidth, moveEvent.clientX - rect.left));
            setSidebarWidth(nextWidth);
        };

        const handleUp = () => {
            sidebarResizingRef.current = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('mouseup', handleUp);
            setSidebarWidth(width => {
                localStorage.setItem(SIDEBAR_STORAGE_KEY, String(Math.round(width)));
                return width;
            });
        };

        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleUp);
    }, []);

    const handleVisibilityConfirm = useCallback((data: {
        visibility: 'owner' | 'workspace' | 'team';
        folder_id: Id | null;
        workspace_folder_id: Id | null;
        team_id?: Id | null;
        owner_id?: Id | null;
    }) => {
        if (!visibilityFlow) return;
        setSavingVisibility(true);
        router.put(`/flows/${visibilityFlow.id}/visibility`, data, {
            preserveState: false,
            onSuccess: closeVisibilityFlow,
            onFinish: () => setSavingVisibility(false),
        });
    }, [closeVisibilityFlow, visibilityFlow]);

    const isWorkspaceView = filters.view === 'workspace';
    const isTeamFolder = Boolean(currentFolder?.team_id);
    const newFlowParams = new URLSearchParams();
    if (currentFolder) newFlowParams.set('folder_id', String(currentFolder.id));
    if (isWorkspaceView) newFlowParams.set('view', 'workspace');
    if (!isWorkspaceView && filters.owner_id) newFlowParams.set('owner_id', String(filters.owner_id));
    const newFlowUrl = `/flows/create${newFlowParams.toString() ? `?${newFlowParams}` : ''}`;
    const defaultImportVisibility = isTeamFolder ? 'team' : isWorkspaceView ? 'workspace' : 'owner';

    return (
        <AppLayout
            title="Flow Explorer"
            noPadding
            headerRight={
                <S.HeaderActions>
                    <Button variant="secondary" size="sm" onClick={() => setShowNewFolder(true)}>
                        <Icon icon="lucide:folder-plus" width={14} />
                        <S.BtnLabel>New Folder</S.BtnLabel>
                    </Button>
                    <Button variant="secondary" size="sm" onClick={handleLibraryStoreOpen}>
                        <Icon icon="lucide:store" width={14} />
                        <S.BtnLabel>Blueprints</S.BtnLabel>
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => setShowImportModal(true)}>
                        <Icon icon="lucide:upload" width={14} />
                        <S.BtnLabel>Import</S.BtnLabel>
                    </Button>
                    <Button size="sm" onClick={() => router.visit(newFlowUrl)}>
                        <Icon icon="lucide:plus" width={14} />
                        <S.BtnLabel>New Flow</S.BtnLabel>
                    </Button>
                </S.HeaderActions>
            }
        >
            <S.ExplorerLayout ref={explorerLayoutRef}>
                <FolderTreeSidebar
                    folderTree={folderTree}
                    userTrees={userTrees}
                    workspaceTree={workspaceTree}
                    teamTrees={teamTrees}
                    width={sidebarWidth}
                    rootFlows={rootFlows}
                    workspaceRootFlows={workspaceRootFlows}
                    currentFolderId={currentFolder?.id ?? null}
                    currentOwnerId={filters.owner_id}
                    breadcrumbs={breadcrumbs}
                    currentView={filters.view}
                    onDeleteFolder={setFolderToDelete}
                    onVisibilityFlow={handleVisibilityOpen}
                />
                <S.SidebarResizeHandle
                    onMouseDown={handleSidebarResizeStart}
                    title="Resize side panel"
                />
                <ExplorerContent
                    flows={flows}
                    folders={folders}
                    currentFolder={currentFolder}
                    breadcrumbs={breadcrumbs}
                    personalOwner={personalOwner}
                    filters={filters}
                    workspaceTree={workspaceTree}
                    personalTree={folderTree}
                    userTrees={userTrees}
                    teamTrees={teamTrees}
                    onDeleteFolder={setFolderToDelete}
                />
            </S.ExplorerLayout>

            <ExplorerModals
                showNewFolder={showNewFolder}
                onCloseNewFolder={() => setShowNewFolder(false)}
                currentFolder={currentFolder}
                isWorkspaceView={filters.view === 'workspace'}
                ownerId={filters.owner_id}
                folderToDelete={folderToDelete}
                onCloseDeleteFolder={() => setFolderToDelete(null)}
                folderTree={folderTree}
            />

            {visibilityFlow && (
                <VisibilityModal
                    isOpen
                    onClose={closeVisibilityFlow}
                    onConfirm={handleVisibilityConfirm}
                    flow={visibilityFlow}
                    personalTree={folderTree}
                    workspaceTree={workspaceTree}
                    teamTrees={teamTrees}
                    loading={savingVisibility}
                />
            )}

            <LibraryStoreModal
                isOpen={showLibraryStore}
                onClose={() => setShowLibraryStore(false)}
                teams={teamTrees.map(team => ({ id: team.id, name: team.name }))}
            />
            <FlowImportModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                personalTree={folderTree}
                workspaceTree={workspaceTree}
                teamTrees={teamTrees}
                defaultVisibility={defaultImportVisibility}
                defaultFolderId={currentFolder?.id ?? null}
                defaultTeamId={currentFolder?.team_id ?? null}
            />
        </AppLayout>
    );
}
