import { useCallback, useEffect, useMemo, useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { router } from '@inertiajs/react';
import Modal from '@/Shared/UI/Modal/Modal';
import Input from '@/Shared/UI/Input/Input';
import Button from '@/Shared/UI/Button/Button';
import { useConfirm } from '@/Shared/Hooks/useConfirm';
import { useUrlSyncedModal } from '@/Shared/Hooks/useUrlSyncedModal';
import { useAuth, usePageProps } from '@/App/Hooks/usePageProps';
import MoveFlowModal from '@/Domains/Flow/Components/MoveFlowModal/MoveFlowModal';
import DuplicateFlowLocationModal from '@/Domains/Flow/Components/DuplicateFlowLocationModal/DuplicateFlowLocationModal';
import type { Breadcrumb, DeletableFolder, FolderTree, TeamTree, UserTree } from '@/Domains/Folder/types';
import PersonalTreeSection from './components/PersonalTreeSection/PersonalTreeSection';
import WorkspaceTreeSection from './components/WorkspaceTreeSection/WorkspaceTreeSection';
import UsersTreeSection from './components/UsersTreeSection/UsersTreeSection';
import { FolderTreeContext } from './treeContext';
import type { SidebarFlow } from './types';
import { useTreeExpansion } from './useTreeExpansion';
import * as S from './styled';

interface Props {
    folderTree: FolderTree[];
    userTrees?: UserTree[];
    workspaceTree: FolderTree[];
    teamTrees?: TeamTree[];
    width?: number;
    rootFlows: SidebarFlow[];
    workspaceRootFlows: SidebarFlow[];
    currentFolderId: Id | null;
    currentOwnerId?: Id | null;
    breadcrumbs: Breadcrumb[];
    currentView: string | null;
    onDeleteFolder?: (folder: DeletableFolder) => void;
    onVisibilityFlow?: (flow: SidebarFlow) => void;
}

function flattenFolders(trees: FolderTree[]): { id: Id; name: string }[] {
    return trees.flatMap(folder => [
        { id: folder.id, name: folder.name },
        ...flattenFolders(folder.children),
    ]);
}

function flattenFlows(trees: FolderTree[]): SidebarFlow[] {
    return trees.flatMap(folder => [
        ...folder.flows,
        ...flattenFlows(folder.children),
    ]);
}

export default function FolderTreeSidebar({
    folderTree,
    userTrees = [],
    workspaceTree,
    teamTrees = [],
    rootFlows,
    workspaceRootFlows,
    width,
    currentFolderId,
    currentOwnerId = null,
    breadcrumbs,
    currentView,
    onDeleteFolder,
    onVisibilityFlow,
}: Props) {
    const { user } = useAuth();
    const { settings } = usePageProps();
    const workspaceSharingEnabled = settings?.workspace_sharing_enabled ?? false;
    const teamsEnabled = settings?.teams_enabled ?? false;
    const workspaceSectionEnabled = workspaceSharingEnabled || teamsEnabled;
    const showWorkspaceSection = workspaceSectionEnabled
        || (settings?.promote_disabled_features ?? false);
    const canEditFlow = useCallback((flow: SidebarFlow) => Boolean(
        user && (
            user.role === 'admin'
            || user.workspace_role === 'admin'
            || flow.owner_id === user.id
        )
    ), [user]);
    const {
        expandedFolders,
        personalExpanded,
        usersExpanded,
        userSectionsExpanded,
        workspaceExpanded,
        teamSectionsExpanded,
        toggleFolder,
        togglePersonal,
        toggleUsers,
        toggleUser,
        toggleWorkspace,
        toggleTeam,
    } = useTreeExpansion(breadcrumbs, currentView, currentOwnerId, teamTrees, userTrees);

    const modalFolders = useMemo(() => [
        ...flattenFolders(folderTree),
        ...flattenFolders(workspaceTree),
        ...teamTrees.flatMap(team => flattenFolders(team.tree)),
        ...userTrees.flatMap(userTree => flattenFolders(userTree.tree)),
    ], [folderTree, teamTrees, userTrees, workspaceTree]);
    const {
        selectedItem: renameTarget,
        openModal: openRenameTarget,
        closeModal: closeRenameTarget,
    } = useUrlSyncedModal(modalFolders, 'edit-sidebar-folder');
    const [renameName, setRenameName] = useState('');
    const [renaming, setRenaming] = useState(false);
    const modalFlows = useMemo(() => [
        ...rootFlows,
        ...workspaceRootFlows,
        ...flattenFlows(folderTree),
        ...flattenFlows(workspaceTree),
        ...teamTrees.flatMap(team => [...team.rootFlows, ...flattenFlows(team.tree)]),
        ...userTrees.flatMap(userTree => [...userTree.rootFlows, ...flattenFlows(userTree.tree)]),
    ], [folderTree, rootFlows, teamTrees, userTrees, workspaceRootFlows, workspaceTree]);
    const {
        selectedItem: moveFlow,
        openModal: openMoveFlow,
        closeModal: closeMoveFlow,
    } = useUrlSyncedModal(modalFlows, 'edit-sidebar-flow-location');
    const [duplicateFlow, setDuplicateFlow] = useState<SidebarFlow | null>(null);
    const { confirm, ConfirmModal } = useConfirm();

    const handleRenameOpen = useCallback((folder: { id: Id; name: string }) => {
        openRenameTarget(folder);
        setRenameName(folder.name);
    }, [openRenameTarget]);

    useEffect(() => {
        if (renameTarget) setRenameName(renameTarget.name);
    }, [renameTarget]);

    const handleRenameSubmit = () => {
        if (!renameTarget || !renameName.trim() || renameName === renameTarget.name) {
            closeRenameTarget();
            return;
        }
        setRenaming(true);
        router.put(`/folders/${renameTarget.id}`, { name: renameName }, {
            onSuccess: () => {
                closeRenameTarget();
                setRenaming(false);
            },
            onError: () => setRenaming(false),
        });
    };

    const handleDeleteFolder = useCallback(async (folder: DeletableFolder) => {
        if (onDeleteFolder) {
            onDeleteFolder(folder);
            return;
        }

        const confirmed = await confirm({
            title: 'Delete Folder',
            message: `Are you sure you want to delete "${folder.name}"? Everything inside will be permanently deleted.`,
            confirmLabel: 'Delete',
            variant: 'danger',
        });
        if (confirmed) router.delete(`/folders/${folder.id}`, { preserveState: false });
    }, [onDeleteFolder, confirm]);

    const handleDuplicate = useCallback((flow: SidebarFlow) => {
        setDuplicateFlow(flow);
    }, []);

    const handleDeleteFlow = useCallback(async (flow: SidebarFlow) => {
        const confirmed = await confirm({
            title: 'Delete Flow',
            message: `Are you sure you want to delete "${flow.name}"? All runs, recordings, screenshots and downloads will be permanently lost.`,
            confirmLabel: 'Delete',
            variant: 'danger',
        });
        if (confirmed) {
            router.delete(`/flows/${flow.id}`, {
                data: { redirect_url: window.location.pathname + window.location.search },
                preserveState: false,
            });
        }
    }, [confirm]);

    const treeContext = useMemo(() => ({
        expandedFolders,
        currentFolderId,
        toggleFolder,
        renameFolder: handleRenameOpen,
        deleteFolder: handleDeleteFolder,
        duplicateFlow: handleDuplicate,
        moveFlow: openMoveFlow,
        deleteFlow: handleDeleteFlow,
        visibilityFlow: onVisibilityFlow,
        canEditFlow,
    }), [
        expandedFolders,
        currentFolderId,
        toggleFolder,
        handleRenameOpen,
        handleDeleteFolder,
        handleDuplicate,
        openMoveFlow,
        handleDeleteFlow,
        onVisibilityFlow,
        canEditFlow,
    ]);

    return (
        <S.Sidebar $width={width}>
            <S.SidebarHeader>
                <Icon icon="lucide:panel-left" />
                Explorer
            </S.SidebarHeader>
            <S.TreeContainer>
                <S.TreeInner>
                    <FolderTreeContext.Provider value={treeContext}>
                        <PersonalTreeSection
                            folders={folderTree}
                            rootFlows={rootFlows}
                            active={currentFolderId === null && currentOwnerId === null && currentView !== 'workspace' && currentView !== 'users'}
                            expanded={personalExpanded}
                            onToggle={togglePersonal}
                        />
                        {showWorkspaceSection && (
                            <WorkspaceTreeSection
                                folders={workspaceTree}
                                rootFlows={workspaceRootFlows}
                                teamTrees={teamTrees}
                                teamsEnabled={teamsEnabled}
                                disabled={!workspaceSectionEnabled}
                                disabledFeatureMessage={settings?.disabled_feature_message ?? ''}
                                currentFolderId={currentFolderId}
                                active={currentView === 'workspace' && currentFolderId === null}
                                expanded={workspaceExpanded}
                                teamSectionsExpanded={teamSectionsExpanded}
                                onToggle={toggleWorkspace}
                                onToggleTeam={toggleTeam}
                            />
                        )}
                        {userTrees.length > 0 && (
                            <UsersTreeSection
                                users={userTrees}
                                currentOwnerId={currentOwnerId}
                                active={currentView === 'users'}
                                expanded={usersExpanded}
                                userSectionsExpanded={userSectionsExpanded}
                                onToggle={toggleUsers}
                                onToggleUser={toggleUser}
                            />
                        )}
                    </FolderTreeContext.Provider>
                </S.TreeInner>
            </S.TreeContainer>

            <Modal
                isOpen={!!renameTarget}
                onClose={() => !renaming && closeRenameTarget()}
                title="Rename Folder"
                footer={(
                    <>
                        <Button
                            variant="secondary"
                            onClick={closeRenameTarget}
                            disabled={renaming}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleRenameSubmit} loading={renaming}>
                            Rename
                        </Button>
                    </>
                )}
            >
                <Input
                    label="Folder name"
                    value={renameName}
                    onChange={(event) => setRenameName(event.target.value)}
                    autoFocus
                    onKeyDown={(event) => event.key === 'Enter' && handleRenameSubmit()}
                />
            </Modal>

            {moveFlow && (
                <MoveFlowModal
                    isOpen
                    onClose={closeMoveFlow}
                    flow={moveFlow}
                    personalTree={
                        // Keep the personal targets scoped to the flow owner's
                        // folders: moving a flow into another owner's personal
                        // folder would orphan it from every sidebar tree.
                        userTrees.find((tree) => tree.id === moveFlow.owner_id)?.tree
                            ?? folderTree
                    }
                    workspaceTree={workspaceTree}
                    teamTrees={teamTrees}
                />
            )}

            {duplicateFlow && (
                <DuplicateFlowLocationModal
                    isOpen
                    onClose={() => setDuplicateFlow(null)}
                    flow={duplicateFlow}
                    personalTree={folderTree}
                    workspaceTree={workspaceTree}
                    teamTrees={teamTrees}
                />
            )}

            <ConfirmModal />
        </S.Sidebar>
    );
}
