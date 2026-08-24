import { useState } from 'react';
import { router } from '@inertiajs/react';
import Modal from '@/Shared/UI/Modal/Modal';
import Button from '@/Shared/UI/Button/Button';
import VisibilityPicker from '@proprietary/Domains/Flow/Components/VisibilityPicker/VisibilityPicker.pp';
import { useFlowDestinationSelection } from '@proprietary/Domains/Flow/Components/VisibilityPicker/useFlowDestinationSelection.pp';
import type { FolderTree, TeamTree } from '@/Domains/Folder/types';
import { buildMoveLocationPayload, type MoveFlow } from './utils';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    flow: MoveFlow;
    personalTree: FolderTree[];
    workspaceTree: FolderTree[];
    teamTrees?: TeamTree[];
}

export default function MoveFlowModal({ isOpen, onClose, flow, personalTree, workspaceTree, teamTrees = [] }: Props) {
    const [moving, setMoving] = useState(false);
    const [pickerValue, setPickerValue] = useFlowDestinationSelection({
        isOpen,
        currentScope: flow.visibility,
        currentFolderId: flow.visibility === 'owner' ? flow.folder_id : flow.workspace_folder_id,
        currentTeamId: flow.team_id,
    });

    const handleSubmit = () => {
        const payload = buildMoveLocationPayload(pickerValue, teamTrees);

        setMoving(true);
        router.patch(`/flows/${flow.id}/move`, payload, {
            preserveState: false,
            onSuccess: onClose,
            onFinish: () => setMoving(false),
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => {
                if (!moving) onClose();
            }}
            title="Move Flow"
            caption="Choose where this flow should live in the explorer."
            width="460px"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={moving}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        loading={moving}
                        disabled={moving || (pickerValue.visibility === 'team' && !pickerValue.teamId)}
                    >
                        Move Flow
                    </Button>
                </>
            }
        >
            <VisibilityPicker
                value={pickerValue}
                onChange={setPickerValue}
                personalTree={personalTree}
                workspaceTree={workspaceTree}
                teamTrees={teamTrees}
                ownerId={flow.owner_id}
            />
        </Modal>
    );
}
