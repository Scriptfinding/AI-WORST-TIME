import { Icon } from '@/Shared/UI/Icon/Icon';
import { useTheme } from 'styled-components';
import type { FolderTree } from '@/Domains/Folder/types';
import { handleLinkClick } from '@/Shared/Utils/navigation';
import type { SidebarFlow } from '@/Domains/Folder/Components/FolderTreeSidebar/types';
import FolderNode from '@/Domains/Folder/Components/FolderTreeSidebar/components/FolderNode/FolderNode';
import FlowRow from '@/Domains/Folder/Components/FolderTreeSidebar/components/FlowRow/FlowRow';
import * as S from './styled';

interface Props {
    folders: FolderTree[];
    rootFlows: SidebarFlow[];
    active: boolean;
    expanded: boolean;
    onToggle: () => void;
}

export default function PersonalTreeSection({
    folders,
    rootFlows,
    active,
    expanded,
    onToggle,
}: Props) {
    const theme = useTheme();
    const hasContent = folders.length > 0 || rootFlows.length > 0;

    return (
        <>
            <S.Row
                href="/flows"
                $active={active}
                onClick={(event) => handleLinkClick(event, '/flows')}
            >
                <S.Chevron
                    $visible={hasContent}
                    $expanded={expanded}
                    onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        onToggle();
                    }}
                >
                    <Icon icon="lucide:chevron-right" />
                </S.Chevron>
                <S.IconSlot>
                    <Icon
                        icon="lucide:home"
                        style={{ color: theme.colors.accent.warning }}
                    />
                </S.IconSlot>
                <S.Label>Personal</S.Label>
            </S.Row>

            {expanded && (
                <>
                    {folders.map((folder) => (
                        <FolderNode key={folder.id} folder={folder} depth={1} />
                    ))}
                    {rootFlows.map((flow) => (
                        <FlowRow
                            key={`flow-${flow.id}`}
                            flow={flow}
                            depth={1}
                        />
                    ))}
                </>
            )}
        </>
    );
}
