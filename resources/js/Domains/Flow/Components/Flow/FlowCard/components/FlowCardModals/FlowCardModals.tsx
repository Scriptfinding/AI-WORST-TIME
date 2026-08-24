import DuplicateFlowLocationModal from '@/Domains/Flow/Components/DuplicateFlowLocationModal/DuplicateFlowLocationModal';
import MoveFlowModal from '@/Domains/Flow/Components/MoveFlowModal/MoveFlowModal';
import VisibilityModal from '@/Domains/Flow/Components/VisibilityModal/VisibilityModal';
import type { Flow } from '@/Domains/Flow/types';
import type { FolderTree, TeamTree, UserTree } from '@/Domains/Folder/types';
import type { FlowCardController } from '@/Domains/Flow/Components/Flow/FlowCard/hooks/useFlowCardController';

interface Props {
    flow: Flow;
    canEdit: boolean;
    personalTree: FolderTree[];
    workspaceTree: FolderTree[];
    teamTrees: TeamTree[];
    userTrees?: UserTree[];
    controller: FlowCardController;
}

export default function FlowCardModals({
    flow,
    canEdit,
    personalTree,
    workspaceTree,
    teamTrees,
    userTrees = [],
    controller,
}: Props) {
    const { ConfirmModal } = controller;
    // Moving keeps the flow's owner, so personal targets must come from that
    // owner's tree; visibility and duplication target the current user.
    const moveTree = userTrees.find(tree => tree.id === flow.owner_id)?.tree ?? personalTree;

    return (
        <>
            <ConfirmModal />
            {canEdit && (
                <>
                    <VisibilityModal
                        isOpen={controller.showVisibility}
                        onClose={controller.closeVisibility}
                        onConfirm={controller.updateVisibility}
                        flow={flow}
                        personalTree={personalTree}
                        workspaceTree={workspaceTree}
                        teamTrees={teamTrees}
                        loading={controller.savingVisibility}
                    />
                    <MoveFlowModal
                        isOpen={controller.showMove}
                        onClose={controller.closeMove}
                        flow={flow}
                        personalTree={moveTree}
                        workspaceTree={workspaceTree}
                        teamTrees={teamTrees}
                    />
                </>
            )}
            <DuplicateFlowLocationModal
                isOpen={controller.showDuplicate}
                onClose={controller.closeDuplicate}
                flow={flow}
                personalTree={personalTree}
                workspaceTree={workspaceTree}
                teamTrees={teamTrees}
            />
        </>
    );
}
