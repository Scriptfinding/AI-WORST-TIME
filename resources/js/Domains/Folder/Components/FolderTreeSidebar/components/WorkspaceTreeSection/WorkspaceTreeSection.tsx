import { Icon } from '@/Shared/UI/Icon/Icon';
import type { FolderTree, TeamTree } from '@/Domains/Folder/types';
import { handleLinkClick } from '@/Shared/Utils/navigation';
import type { SidebarFlow } from '@/Domains/Folder/Components/FolderTreeSidebar/types';
import FolderNode from '@/Domains/Folder/Components/FolderTreeSidebar/components/FolderNode/FolderNode';
import FlowRow from '@/Domains/Folder/Components/FolderTreeSidebar/components/FlowRow/FlowRow';
import TeamTreeSection from '@/Domains/Folder/Components/FolderTreeSidebar/components/TeamTreeSection/TeamTreeSection';
import * as S from './styled';

interface Props {
    folders: FolderTree[];
    rootFlows: SidebarFlow[];
    teamTrees: TeamTree[];
    teamsEnabled: boolean;
    disabled: boolean;
    currentFolderId: Id | null;
    active: boolean;
    expanded: boolean;
    teamSectionsExpanded: Record<string, boolean>;
    onToggle: () => void;
    onToggleTeam: (teamId: Id) => void;
}

export default function WorkspaceTreeSection({
    folders,
    rootFlows,
    teamTrees,
    teamsEnabled,
    disabled,
    currentFolderId,
    active,
    expanded,
    teamSectionsExpanded,
    onToggle,
    onToggleTeam,
}: Props) {
    const hasContent = folders.length > 0
        || rootFlows.length > 0
        || teamTrees.length > 0;
    const workspaceUrl = '/flows?view=workspace';

    return (
        <>
            <S.Divider />
            <S.Row
                href={disabled ? undefined : workspaceUrl}
                $active={active}
                $disabled={disabled}
                aria-disabled={disabled}
                onClick={(event) => {
                    if (disabled) {
                        event.preventDefault();
                        return;
                    }
                    handleLinkClick(event, workspaceUrl);
                }}
            >
                <S.Chevron
                    $visible={hasContent && !disabled}
                    $expanded={expanded}
                    onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        if (!disabled) onToggle();
                    }}
                >
                    <Icon icon="lucide:chevron-right" />
                </S.Chevron>
                <S.IconSlot>
                    <Icon icon="lucide:building-2" />
                </S.IconSlot>
                <S.Label>Workspace</S.Label>
            </S.Row>

            {expanded && !disabled && (
                <>
                    {teamsEnabled && teamTrees.map((team) => (
                        <TeamTreeSection
                            key={`team-${team.id}`}
                            team={team}
                            currentFolderId={currentFolderId}
                            expanded={teamSectionsExpanded[team.id] ?? false}
                            onToggle={onToggleTeam}
                        />
                    ))}
                    {folders.map((folder) => (
                        <FolderNode
                            key={`ws-${folder.id}`}
                            folder={folder}
                            depth={1}
                            viewParam="workspace"
                        />
                    ))}
                    {rootFlows.map((flow) => (
                        <FlowRow
                            key={`ws-flow-${flow.id}`}
                            flow={flow}
                            depth={1}
                        />
                    ))}
                </>
            )}
        </>
    );
}
