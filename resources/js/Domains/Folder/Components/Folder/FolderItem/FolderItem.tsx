import { useMemo } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { handleLinkClick } from '@/Shared/Utils/navigation';
import { useUrlSyncedModal } from '@/Shared/Hooks/useUrlSyncedModal';
import type { Folder } from '@/Domains/Folder/types';
import FolderIcon from './FolderIcon/FolderIcon';
import FolderItemMenu from './FolderItemMenu/FolderItemMenu';
import RenameFolderModal from './RenameFolderModal/RenameFolderModal';
import VisibilityMoveModal from './VisibilityMoveModal/VisibilityMoveModal';
import { useFolderItemDnd } from './useFolderItemDnd';
import * as S from './styled';

interface FolderItemProps {
    folder: Folder;
    viewParam?: string | null;
    isWorkspaceView?: boolean;
    ownerName?: string;
    onDelete?: (folder: Folder) => void;
    selectionActive?: boolean;
    selected?: boolean;
    onToggleSelect?: (folder: Folder) => void;
}

export default function FolderItem({ folder, viewParam, isWorkspaceView, ownerName, onDelete, selectionActive = false, selected = false, onToggleSelect }: FolderItemProps) {
    const isTeamRoot = !!folder.team_id && !folder.parent_id;
    const selectable = !isTeamRoot && !!onToggleSelect;
    const modalFolders = useMemo(() => [folder], [folder]);
    const {
        selectedItem: renameFolder,
        openModal: openRename,
        closeModal: closeRename,
    } = useUrlSyncedModal(modalFolders, 'edit-folder');
    const folderUrl = viewParam
        ? `/flows?folder_id=${folder.id}&view=${viewParam}`
        : `/flows?folder_id=${folder.id}`;
    const dnd = useFolderItemDnd(folder, isWorkspaceView);

    const handleItemClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (selectionActive && selectable) {
            e.preventDefault();
            e.stopPropagation();
            onToggleSelect?.(folder);
            return;
        }

        handleLinkClick(e, folderUrl);
    };

    return (
        <>
            <S.Item
                href={folderUrl}
                onClick={handleItemClick}
                draggable={!isTeamRoot}
                onDragStart={isTeamRoot ? undefined : dnd.onDragStart}
                onDragOver={dnd.onDragOver}
                onDragLeave={dnd.onDragLeave}
                onDrop={dnd.onDrop}
                $dragOver={dnd.dragOver}
                $selected={selected}
                $selectionActive={selectionActive}
            >
                {!selectable ? (
                    <FolderIcon team={!!folder.team_id} shared={folder.is_shared} />
                ) : (
                    <S.SelectableIconWrapper>
                        <S.SelectableFolderIcon $selected={selected}>
                            <FolderIcon team={!!folder.team_id} shared={folder.is_shared} />
                        </S.SelectableFolderIcon>
                        <S.SelectCheckbox
                            type="button"
                            $selected={selected}
                            aria-pressed={selected}
                            aria-label={selected ? `Unselect ${folder.name}` : `Select ${folder.name}`}
                            onClick={e => {
                                e.preventDefault();
                                e.stopPropagation();
                                onToggleSelect?.(folder);
                            }}
                        >
                            {selected && <Icon icon="lucide:check" width={13} height={13} />}
                        </S.SelectCheckbox>
                    </S.SelectableIconWrapper>
                )}
                <S.NameGroup>
                    <S.Name>{folder.name}</S.Name>
                    {isWorkspaceView && ownerName && !folder.team_id && (
                        <S.OwnerName>{ownerName}</S.OwnerName>
                    )}
                </S.NameGroup>
                {!isTeamRoot && (
                    <FolderItemMenu
                        folder={folder}
                        onRename={() => openRename(folder)}
                        onDelete={onDelete}
                    />
                )}
            </S.Item>

            {renameFolder && (
                <RenameFolderModal
                    folder={renameFolder}
                    onClose={closeRename}
                />
            )}
            <VisibilityMoveModal
                pendingMove={dnd.pendingMove}
                onClose={dnd.closeVisibilityConfirmation}
                onConfirm={dnd.confirmVisibilityChange}
            />
        </>
    );
}
