import { useCallback, useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { router } from '@inertiajs/react';
import FlowCard from '@/Domains/Flow/Components/Flow/FlowCard/FlowCard';
import FolderItem from '@/Domains/Folder/Components/Folder/FolderItem/FolderItem';
import EmptyState from '@/Shared/UI/EmptyState/EmptyState';
import { ButtonLink } from '@/Shared/UI/Button/Button';
import { handleLinkClick } from '@/Shared/Utils/navigation';
import type { Flow } from '@/Domains/Flow/types';
import type { DeletableFolder, Folder, FolderTree, TeamTree, UserTree } from '@/Domains/Folder/types';
import * as FolderS from '@/Domains/Folder/Components/Folder/FolderItem/styled';
import type { PaginatedData } from '@/Shared/Types/pagination';
import { getParentUrl } from '@/Domains/Flow/Pages/FlowExplorer/ExplorerContent/utils';
import { useGlobalDragReset } from '@/Domains/Flow/Pages/FlowExplorer/useGlobalDragReset';
import * as S from './styled';

interface Props {
    flows: PaginatedData<Flow>;
    folders: Folder[];
    currentFolder: Folder | null;
    parentFolderId: Id | null;
    viewMode: string;
    viewParam: string | null;
    isWorkspaceView: boolean;
    isUsersView: boolean;
    userTrees: UserTree[];
    ownerId: Id | null;
    showFolders: boolean;
    searchActive: boolean;
    workspaceTree: FolderTree[];
    personalTree: FolderTree[];
    teamTrees: TeamTree[];
    selectionActive: boolean;
    selectedFlowIds: Set<Id>;
    selectedFolderIds: Set<Id>;
    onDeleteFolder: (folder: DeletableFolder) => void;
    onToggleFlowSelect: (flow: Flow) => void;
    onToggleFolderSelect: (folder: Folder) => void;
    onDrop: (event: React.DragEvent, folderId: Id | null) => void;
}

export default function ExplorerResults({
    flows,
    folders,
    currentFolder,
    parentFolderId,
    viewMode,
    viewParam,
    isWorkspaceView,
    isUsersView,
    userTrees,
    ownerId,
    showFolders,
    searchActive,
    workspaceTree,
    personalTree,
    teamTrees,
    selectionActive,
    selectedFlowIds,
    selectedFolderIds,
    onDeleteFolder,
    onToggleFlowSelect,
    onToggleFolderSelect,
    onDrop,
}: Props) {
    const [rootDragOver, setRootDragOver] = useState(false);
    const [parentDragOver, setParentDragOver] = useState(false);
    const parentUrl = getParentUrl(parentFolderId, isWorkspaceView, ownerId);

    const resetDragStates = useCallback(() => {
        setRootDragOver(false);
        setParentDragOver(false);
    }, []);
    useGlobalDragReset(resetDragStates, true);

    const handleRootDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        setRootDragOver(true);
    }, []);

    const handleRootDragLeave = useCallback((event: React.DragEvent) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
            setRootDragOver(false);
        }
    }, []);

    const handleRootDrop = useCallback((event: React.DragEvent) => {
        setRootDragOver(false);
        onDrop(event, currentFolder?.id || null);
    }, [currentFolder, onDrop]);

    if (isUsersView) {
        const countFlows = (trees: FolderTree[]): number => trees.reduce(
            (total, node) => total + node.flows.length + countFlows(node.children),
            0,
        );

        return (
            <S.DropZone $active={false}>
                {userTrees.length > 0 ? (
                    <S.FoldersGrid>
                        {userTrees.map(user => {
                            const userUrl = `/flows?owner_id=${user.id}`;
                            const flowCount = user.rootFlows.length + countFlows(user.tree);
                            return (
                                <FolderS.Item
                                    key={`user-${user.id}`}
                                    href={userUrl}
                                    onClick={event => handleLinkClick(event, userUrl)}
                                >
                                    <Icon icon="lucide:user" width={20} height={20} />
                                    <FolderS.NameGroup>
                                        <FolderS.Name>{user.name}</FolderS.Name>
                                        <FolderS.OwnerName>
                                            {flowCount} {flowCount === 1 ? 'flow' : 'flows'}
                                        </FolderS.OwnerName>
                                    </FolderS.NameGroup>
                                </FolderS.Item>
                            );
                        })}
                    </S.FoldersGrid>
                ) : (
                    <EmptyState
                        icon={<Icon icon="lucide:users" width={48} height={48} />}
                        title="No users"
                        description="No other user has personal flows in this workspace"
                    />
                )}
            </S.DropZone>
        );
    }

    const flowCards = flows.data.map(flow => (
        <FlowCard
            key={flow.id}
            flow={flow}
            variant={viewMode === 'grid' ? 'grid' : 'list'}
            workspaceTree={workspaceTree}
            personalTree={personalTree}
            teamTrees={teamTrees}
            userTrees={userTrees}
            selectionActive={selectionActive}
            selected={selectedFlowIds.has(flow.id)}
            onToggleSelect={onToggleFlowSelect}
        />
    ));

    return (
        <S.DropZone
            $active={rootDragOver}
            onDragOver={handleRootDragOver}
            onDragLeave={handleRootDragLeave}
            onDrop={handleRootDrop}
        >
            {showFolders && (currentFolder || folders.length > 0) && (
                <S.FoldersGrid>
                    {currentFolder && (
                        <S.ParentFolder
                            href={parentUrl}
                            $dragOver={parentDragOver}
                            onClick={event => handleLinkClick(event, parentUrl)}
                            onDragOver={event => {
                                event.preventDefault();
                                event.stopPropagation();
                                event.dataTransfer.dropEffect = 'move';
                                setParentDragOver(true);
                            }}
                            onDragLeave={event => {
                                event.stopPropagation();
                                if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                                    setParentDragOver(false);
                                }
                            }}
                            onDrop={event => {
                                event.stopPropagation();
                                setParentDragOver(false);
                                onDrop(event, parentFolderId);
                            }}
                        >
                            <S.ParentFolderIcon>
                                <Icon icon="lucide:corner-left-up" />
                            </S.ParentFolderIcon>
                            <S.ParentFolderName>..</S.ParentFolderName>
                        </S.ParentFolder>
                    )}
                    {folders.map(folder => (
                        <FolderItem
                            key={folder.id}
                            folder={folder}
                            viewParam={viewParam}
                            isWorkspaceView={isWorkspaceView}
                            ownerName={folder.owner?.name}
                            onDelete={onDeleteFolder}
                            selectionActive={selectionActive}
                            selected={selectedFolderIds.has(folder.id)}
                            onToggleSelect={onToggleFolderSelect}
                        />
                    ))}
                </S.FoldersGrid>
            )}

            {flows.data.length > 0 ? (
                <>
                    {viewMode === 'grid'
                        ? <S.FlowsGrid>{flowCards}</S.FlowsGrid>
                        : <S.FlowsList>{flowCards}</S.FlowsList>}

                    {flows.last_page > 1 && (
                        <S.Pagination>
                            {flows.links.map((link, index) => (
                                <S.PageLink
                                    key={index}
                                    $active={link.active}
                                    disabled={!link.url}
                                    onClick={() => link.url && router.visit(link.url, { preserveState: true })}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </S.Pagination>
                    )}
                </>
            ) : (!showFolders || folders.length === 0) && (
                <EmptyState
                    icon={<Icon icon="lucide:layout-grid" width={48} height={48} />}
                    title={searchActive ? 'No flows found' : (isWorkspaceView ? 'Nothing shared yet' : 'No flows yet')}
                    description={searchActive
                        ? 'Try a different search term'
                        : (isWorkspaceView
                            ? 'Share flows from your personal space to display them here'
                            : 'Create your first flow to get started with Puppeteer automation')}
                    action={
                        !searchActive && !isWorkspaceView ? (
                            <ButtonLink href="/flows/create" onClick={event => handleLinkClick(event, '/flows/create')}>
                                Create Flow
                            </ButtonLink>
                        ) : undefined
                    }
                />
            )}
        </S.DropZone>
    );
}
