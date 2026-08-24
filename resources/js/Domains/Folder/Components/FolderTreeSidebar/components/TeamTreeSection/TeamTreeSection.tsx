import { Icon } from '@/Shared/UI/Icon/Icon';
import type { TeamTree } from '@/Domains/Folder/types';
import { handleLinkClick } from '@/Shared/Utils/navigation';
import FolderNode from '@/Domains/Folder/Components/FolderTreeSidebar/components/FolderNode/FolderNode';
import FlowRow from '@/Domains/Folder/Components/FolderTreeSidebar/components/FlowRow/FlowRow';
import * as S from './styled';

interface Props {
    team: TeamTree;
    currentFolderId: Id | null;
    expanded: boolean;
    onToggle: (teamId: Id) => void;
}

export default function TeamTreeSection({
    team,
    currentFolderId,
    expanded,
    onToggle,
}: Props) {
    const hasContent = team.tree.length > 0 || team.rootFlows.length > 0;
    const folderUrl = team.root_folder_id
        ? `/flows?folder_id=${team.root_folder_id}&view=workspace`
        : '/flows?view=workspace';

    return (
        <>
            <S.Row
                href={folderUrl}
                $active={currentFolderId !== null && currentFolderId === team.root_folder_id}
                onClick={(event) => handleLinkClick(event, folderUrl)}
            >
                <S.Chevron
                    $visible={hasContent}
                    $expanded={expanded}
                    onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        onToggle(team.id);
                    }}
                >
                    <Icon icon="lucide:chevron-right" />
                </S.Chevron>
                <S.IconSlot>
                    <Icon icon="lucide:users" />
                </S.IconSlot>
                <S.Label>{team.name}</S.Label>
            </S.Row>

            {expanded && (
                <>
                    {team.tree.map((folder) => (
                        <FolderNode
                            key={`team-folder-${folder.id}`}
                            folder={folder}
                            depth={2}
                            viewParam="workspace"
                        />
                    ))}
                    {team.rootFlows.map((flow) => (
                        <FlowRow
                            key={`team-flow-${flow.id}`}
                            flow={flow}
                            depth={2}
                        />
                    ))}
                </>
            )}
        </>
    );
}
