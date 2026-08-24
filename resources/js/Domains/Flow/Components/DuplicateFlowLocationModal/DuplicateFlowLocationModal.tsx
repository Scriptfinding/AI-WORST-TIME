import { useState } from 'react';
import { router } from '@inertiajs/react';
import Modal from '@/Shared/UI/Modal/Modal';
import Button from '@/Shared/UI/Button/Button';
import VisibilityPicker from '@proprietary/Domains/Flow/Components/VisibilityPicker/VisibilityPicker.pp';
import { useFlowDestinationSelection } from '@proprietary/Domains/Flow/Components/VisibilityPicker/useFlowDestinationSelection.pp';
import { useConfirm } from '@/Shared/Hooks/useConfirm';
import { csrfHeaders } from '@/Shared/Utils/csrf';
import type { FolderTree, TeamTree } from '@/Domains/Folder/types';
import {
    buildDuplicateLocationPayload,
    type DuplicateFlow,
} from './utils';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    flow: DuplicateFlow;
    personalTree: FolderTree[];
    workspaceTree: FolderTree[];
    teamTrees?: TeamTree[];
}

export default function DuplicateFlowLocationModal({ isOpen, onClose, flow, personalTree, workspaceTree, teamTrees = [] }: Props) {
    const [duplicating, setDuplicating] = useState(false);
    const [pickerValue, setPickerValue] = useFlowDestinationSelection({
        isOpen,
        currentScope: flow.visibility,
        currentFolderId: flow.visibility === 'owner' ? flow.folder_id : flow.workspace_folder_id,
        currentTeamId: flow.team_id,
    });
    const { confirm, ConfirmModal } = useConfirm();

    const handleSubmit = async () => {
        const payload = buildDuplicateLocationPayload(pickerValue, teamTrees);

        setDuplicating(true);

        try {
            const response = await fetch(`/flows/${flow.id}/duplicate`, {
                method: 'POST',
                headers: {
                    ...csrfHeaders(),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) return;

            const data = await response.json();
            const shouldOpen = await confirm({
                title: 'Flow duplicated',
                message: `"${data.flow?.name ?? 'The duplicated flow'}" was created. Open it now?`,
                confirmLabel: 'Open flow',
                cancelLabel: 'Stay here',
                variant: 'primary',
            });

            if (shouldOpen && data.url) {
                router.visit(data.url);
            } else {
                onClose();
                router.reload();
            }
        } finally {
            setDuplicating(false);
        }
    };

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={() => {
                    if (!duplicating) onClose();
                }}
                title="Duplicate Flow"
                caption={`Choose where "${flow.name}" should be duplicated.`}
                width="460px"
                footer={
                    <>
                        <Button variant="secondary" onClick={onClose} disabled={duplicating}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            loading={duplicating}
                            disabled={duplicating || (pickerValue.visibility === 'team' && !pickerValue.teamId)}
                        >
                            Duplicate Flow
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
                />
            </Modal>
            <ConfirmModal />
        </>
    );
}
