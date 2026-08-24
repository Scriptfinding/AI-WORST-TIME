import type { DeletableFolder, Folder, FolderTree } from '@/Domains/Folder/types';
import CreateFolderModal from './CreateFolderModal/CreateFolderModal';
import DeleteFolderModal from './DeleteFolderModal/DeleteFolderModal';

interface Props {
    showNewFolder: boolean;
    onCloseNewFolder: () => void;
    currentFolder: Folder | null;
    isWorkspaceView?: boolean;
    ownerId?: Id | null;
    folderToDelete: DeletableFolder | null;
    onCloseDeleteFolder: () => void;
    folderTree: FolderTree[];
}

export default function ExplorerModals({ showNewFolder, onCloseNewFolder, currentFolder, isWorkspaceView, ownerId = null, folderToDelete, onCloseDeleteFolder, folderTree }: Props) {
    return (
        <>
            <CreateFolderModal
                isOpen={showNewFolder}
                onClose={onCloseNewFolder}
                currentFolder={currentFolder}
                isWorkspaceView={isWorkspaceView}
                ownerId={ownerId}
            />
            <DeleteFolderModal
                folder={folderToDelete}
                folderTree={folderTree}
                onClose={onCloseDeleteFolder}
            />
        </>
    );
}
