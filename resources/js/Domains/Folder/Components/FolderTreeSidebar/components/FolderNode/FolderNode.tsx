import { Icon } from '@/Shared/UI/Icon/Icon';
import type { FolderTree } from '@/Domains/Folder/types';
import { handleLinkClick } from '@/Shared/Utils/navigation';
import { useFolderTreeContext } from '@/Domains/Folder/Components/FolderTreeSidebar/treeContext';
import FlowRow from '@/Domains/Folder/Components/FolderTreeSidebar/components/FlowRow/FlowRow';
import SidebarOverflow from '@/Domains/Folder/Components/FolderTreeSidebar/components/SidebarOverflow/SidebarOverflow';
import {
    MenuDivider,
    MenuItem,
    TreeLabel,
} from '@/Domains/Folder/Components/FolderTreeSidebar/components/shared.styled';
import * as S from './styled';

interface Props {
    folder: FolderTree;
    depth: number;
    viewParam?: string;
    ownerId?: Id;
}

export default function FolderNode({ folder, depth, viewParam, ownerId }: Props) {
    const {
        currentFolderId,
        deleteFolder,
        expandedFolders,
        renameFolder,
        toggleFolder,
    } = useFolderTreeContext();
    const isExpanded = expandedFolders.has(folder.id);
    const hasChildren = folder.children.length > 0 || folder.flows.length > 0;
    const params = new URLSearchParams({ folder_id: String(folder.id) });
    if (viewParam) params.set('view', viewParam);
    if (ownerId) params.set('owner_id', String(ownerId));
    const folderUrl = `/flows?${params}`;

    return (
        <>
            <S.Row
                href={folderUrl}
                $depth={depth}
                $active={folder.id === currentFolderId}
                onClick={(event) => handleLinkClick(event, folderUrl)}
            >
                <S.Chevron
                    $visible={hasChildren}
                    $expanded={isExpanded}
                    onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        toggleFolder(folder.id);
                    }}
                >
                    <Icon icon="lucide:chevron-right" />
                </S.Chevron>
                <S.IconSlot>
                    <Icon icon={isExpanded ? 'lucide:folder-open' : 'lucide:folder'} />
                    <SidebarOverflow>
                        <MenuItem onClick={(event) => {
                            event.stopPropagation();
                            renameFolder(folder);
                        }}>
                            <Icon icon="lucide:pencil" width={13} />
                            Rename
                        </MenuItem>
                        <MenuDivider />
                        <MenuItem $danger onClick={(event) => {
                            event.stopPropagation();
                            deleteFolder(folder);
                        }}>
                            <Icon icon="lucide:trash-2" width={13} />
                            Delete
                        </MenuItem>
                    </SidebarOverflow>
                </S.IconSlot>
                <TreeLabel>{folder.name}</TreeLabel>
            </S.Row>

            {isExpanded && (
                <>
                    {folder.children.map((child) => (
                        <FolderNode
                            key={child.id}
                            folder={child}
                            depth={depth + 1}
                            viewParam={viewParam}
                            ownerId={ownerId}
                        />
                    ))}
                    {folder.flows.map((flow) => (
                        <FlowRow
                            key={`flow-${flow.id}`}
                            flow={flow}
                            depth={depth + 1}
                        />
                    ))}
                </>
            )}
        </>
    );
}
