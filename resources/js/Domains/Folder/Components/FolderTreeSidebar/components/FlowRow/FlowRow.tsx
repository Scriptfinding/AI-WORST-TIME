import { Icon } from '@/Shared/UI/Icon/Icon';
import FlowIcon from '@/Shared/UI/FlowIcon/FlowIcon';
import { handleLinkClick } from '@/Shared/Utils/navigation';
import { useFolderTreeContext } from '@/Domains/Folder/Components/FolderTreeSidebar/treeContext';
import type { SidebarFlow } from '@/Domains/Folder/Components/FolderTreeSidebar/types';
import SidebarOverflow from '@/Domains/Folder/Components/FolderTreeSidebar/components/SidebarOverflow/SidebarOverflow';
import {
    MenuDivider,
    MenuItem,
} from '@/Domains/Folder/Components/FolderTreeSidebar/components/shared.styled';
import * as S from './styled';

interface Props {
    flow: SidebarFlow;
    depth: number;
}

export default function FlowRow({ flow, depth }: Props) {
    const {
        canEditFlow,
        deleteFlow,
        duplicateFlow,
        moveFlow,
        visibilityFlow,
    } = useFolderTreeContext();
    const canEdit = canEditFlow(flow);
    const onVisibility = canEdit ? visibilityFlow : undefined;
    const flowUrl = `/flows/${flow.id}`;

    return (
        <S.Row
            href={flowUrl}
            $depth={depth}
            onClick={(event) => handleLinkClick(event, flowUrl)}
        >
            <S.ChevronSpacer />
            <S.IconSlot>
                <FlowIcon flow={flow} size={16} radius="xs" />
                {flow.library_reference && (
                    <S.ImportedBadge title="Imported from library">
                        <Icon icon="lucide:store" width={10} />
                    </S.ImportedBadge>
                )}
                <SidebarOverflow>
                    {onVisibility && (
                        <MenuItem onClick={(event) => {
                            event.stopPropagation();
                            onVisibility(flow);
                        }}>
                            <Icon icon="lucide:eye" width={13} />
                            Visibility
                        </MenuItem>
                    )}
                    {canEdit && (
                        <>
                            {onVisibility && <MenuDivider />}
                            <MenuItem onClick={(event) => {
                                event.stopPropagation();
                                moveFlow(flow);
                            }}>
                                <Icon icon="lucide:folder-input" width={13} />
                                Move Flow
                            </MenuItem>
                        </>
                    )}
                    <>
                        {(onVisibility || canEdit) && <MenuDivider />}
                        <MenuItem onClick={(event) => {
                            event.stopPropagation();
                            duplicateFlow(flow);
                        }}>
                            <Icon icon="lucide:copy" width={13} />
                            Duplicate
                        </MenuItem>
                    </>
                    {canEdit && (
                        <>
                            <MenuDivider />
                            <MenuItem $danger onClick={(event) => {
                                event.stopPropagation();
                                deleteFlow(flow);
                            }}>
                                <Icon icon="lucide:trash-2" width={13} />
                                Delete
                            </MenuItem>
                        </>
                    )}
                </SidebarOverflow>
            </S.IconSlot>
            <S.Label>{flow.name}</S.Label>
        </S.Row>
    );
}
